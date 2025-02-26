const express = require('express');
const router = express.Router();
const memoireController = require('../controllers/memoireController');
const { upload } = require('../config/upload');
const { sendEmail } = require('../config/email');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = 'uploads/memoires';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont acceptés'));
    }
  }
});

// Move this route to the top, before any routes with path parameters
router.get('/memoire', async (req, res) => {
  try {
    const { status, cycle, search, sortBy, sortOrder } = req.query;
    let query = 'SELECT * FROM memoire';
    const params = [];
    
    const conditions = [];
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (cycle) {
      conditions.push('cycle = ?');
      params.push(cycle);
    }

    if (search) {
      conditions.push('(libelle LIKE ? OR speciality LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    if (sortBy && sortOrder) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY date_soumission DESC';
    }

    const [memoires] = await db.promise().query(query, params);

    // Update the response format to match frontend expectations
    res.json({
      success: true,
      memoire: memoires || []
    });
  } catch (error) {
    console.error('Error fetching memoires:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching memoires'
    });
  }
});

router.get('/memoires-with-students', async (req, res) => {
  try {
    const { status, cycle, search, sortBy, sortOrder } = req.query;
    let query = `
      SELECT m.*, 
             CONCAT(e.name, ' ', e.surname) as etudiant_nom 
      FROM memoire m 
      LEFT JOIN etudiant e ON m.id_etudiant = e.id_etudiant
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('m.status = ?');
      params.push(status);
    }
    
    if (cycle) {
      conditions.push('m.cycle = ?');
      params.push(cycle);
    }

    if (search) {
      conditions.push('(m.libelle LIKE ? OR m.speciality LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    if (sortBy && sortOrder) {
      query += ` ORDER BY m.${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ' ORDER BY m.date_soumission DESC';
    }

    const [memoires] = await db.promise().query(query, params);

    res.json({
      success: true,
      memoire: memoires || []
    });
  } catch (error) {
    console.error('Error fetching memoires:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching memoires'
    });
  }
});

// Route pour soumettre un nouveau mémoire
router.post('/memoire', uploadMiddleware.single('file'), async (req, res) => {
  try {
    // Set content-type header
    res.setHeader('Content-Type', 'application/json');

    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier n\'a été uploadé'
      });
    }

    const {
      libelle,
      annee,
      cycle,
      speciality,
      university,
      description,
      mention,
      id_etudiant
    } = req.body;

    // Insérer dans la base de données
    const [result] = await db.promise().query(
      `INSERT INTO memoire (
        libelle, annee, cycle, speciality, university,
        description, mention, id_etudiant, status, file_path,
        date_soumission
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        libelle,
        annee,
        cycle,
        speciality,
        university,
        description,
        mention,
        id_etudiant,
        req.file.path
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Mémoire soumis avec succès',
      memoireId: result.insertId
    });

  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde du mémoire'
    });
  }
});

// Route pour récupérer tous les mémoires
router.get('/', async (req, res) => {
  try {
    const [memoires] = await db.promise().query(
      'SELECT * FROM memoire ORDER BY date_soumission DESC'
    );
    res.json(memoires);
  } catch (error) {
    console.error('Error fetching memoires:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching memoires'
    });
  }
});

// Route pour supprimer un mémoire
router.delete('/:id', async (req, res) => {
  try {
    const memoireId = req.params.id;
    console.log('Attempting to delete memoire:', memoireId);

    // First, delete related digital signatures
    await db.promise().query(
      'DELETE FROM digital_signatures WHERE id_memoire = ?',
      [memoireId]
    );

    // Then get the memoire to find the file path
    const [memoire] = await db.promise().query(
      'SELECT file_path FROM memoire WHERE id_memoire = ?',
      [memoireId]
    );

    if (memoire.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mémoire non trouvé'
      });
    }

    // Delete the file if it exists
    if (memoire[0].file_path) {
      const filePath = path.resolve(__dirname, '..', '..', memoire[0].file_path.replace(/\//g, path.sep));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('File deleted successfully');
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
        }
      }
    }

    // Finally delete the memoire
    const [result] = await db.promise().query(
      'DELETE FROM memoire WHERE id_memoire = ?',
      [memoireId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Erreur: Le mémoire n\'existe pas dans la base de données');
    }

    res.json({
      success: true,
      message: 'Mémoire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du mémoire'
    });
  }
});

// Route pour obtenir un mémoire spécifique
router.get('/:id', async (req, res) => {
  try {
    const [memoire] = await db.promise().query(
      `SELECT m.*, e.name as etudiant_nom 
       FROM memoire m 
       LEFT JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
       WHERE m.id_memoire = ?`,
      [req.params.id]
    );

    if (memoire.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    res.json({
      success: true,
      memoire: memoire[0]
    });
  } catch (error) {
    console.error('Error fetching memoire:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching memoire'
    });
  }
});

// Route pour récupérer les mémoires d'un étudiant
router.get('/etudiant/:id', async (req, res) => {
  try {
    const [memoires] = await db.promise().query(
      'SELECT * FROM memoire WHERE id_etudiant = ? ORDER BY date_soumission DESC',
      [req.params.id]
    );
    res.json(memoires);
  } catch (error) {
    console.error('Error fetching student memoires:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student memoires'
    });
  }
});

// Route pour les suggestions de recherche
router.get('/memoire/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }

    const [suggestions] = await db.promise().query(
      `SELECT DISTINCT libelle 
       FROM memoire 
       WHERE libelle LIKE ? 
         AND status = 'validated'
       ORDER BY libelle ASC
       LIMIT 5`,
      [`%${q}%`]
    );

    res.json(suggestions.map(s => s.libelle));
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions'
    });
  }
});


// Route pour mettre à jour le statut d'un mémoire
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const memoireId = req.params.id;

    const [result] = await db.promise().query(
      'UPDATE memoire SET status = ? WHERE id_memoire = ?',
      [status, memoireId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status'
    });
  }
});

router.put('/:id/valider', async (req, res) => {
  try {
    // Get memoire and student info
    const [memoireInfo] = await db.promise().query(
      `SELECT m.*, e.email, e.name, e.surname 
       FROM memoire m 
       JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
       WHERE m.id_memoire = ?`,
      [req.params.id]
    );

    if (memoireInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    // Update the status
    const [result] = await db.promise().query(
      'UPDATE memoire SET status = "validated" WHERE id_memoire = ?',
      [req.params.id]
    );

    // Format the current date
    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Send email notification with proper template
    try {
      await sendEmail(
        memoireInfo[0].email,
        'Validation de votre mémoire',
        `Votre mémoire "${memoireInfo[0].libelle}" a été validé le ${currentDate}.`, // Plain text version
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Validation de Mémoire</h2>
            <p>Bonjour ${memoireInfo[0].name} ${memoireInfo[0].surname},</p>
            <p>Nous avons le plaisir de vous informer que votre mémoire a été validé.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
              <p><strong>Titre du mémoire :</strong> ${memoireInfo[0].libelle}</p>
              <p><strong>Date de validation :</strong> ${currentDate}</p>
            </div>
            <p>Félicitations pour votre travail !</p>
            <br>
            <p style="color: #666;">Cordialement,</p>
            <p style="color: #666;">L'équipe administrative</p>
          </div>
        `
      );
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    res.json({
      success: true,
      message: 'Mémoire validé avec succès'
    });
  } catch (error) {
    console.error('Error validating memoire:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error validating memoire'
    });
  }
});
// Route pour rejeter un mémoire
router.put('/reject/:id', async (req, res) => {
  try {
    const memoireId = req.params.id;
    const { rejection_reason } = req.body;

    // Get memoire and student info with complete details
    const [memoireInfo] = await db.promise().query(
      `SELECT m.*, e.email, e.name, e.surname 
       FROM memoire m 
       JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
       WHERE m.id_memoire = ?`,
      [memoireId]
    );

    if (memoireInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    const [result] = await db.promise().query(
      'UPDATE memoire SET status = "rejected" WHERE id_memoire = ?',
      [memoireId]
    );

    // Format the current date
    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Send email notification with improved template
    await sendEmail(
      memoireInfo[0].email,
      'Rejet de votre mémoire',
      `Votre mémoire "${memoireInfo[0].libelle}" a été rejeté le ${currentDate}. Raison : ${rejection_reason}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #dc2626;">Notification de Rejet de Mémoire</h2>
          <p>Cher(e) ${memoireInfo[0].name} ${memoireInfo[0].surname},</p>
          <p>Nous vous informons que votre mémoire n'a pas été validé.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-radius: 5px;">
            <p><strong>Titre du mémoire :</strong> ${memoireInfo[0].libelle}</p>
            <p><strong>Date de rejet :</strong> ${currentDate}</p>
            <p><strong>Motif du rejet :</strong> ${rejection_reason}</p>
          </div>
          
          <p>Vous pouvez soumettre une nouvelle version après avoir effectué les corrections nécessaires.</p>
          <br>
          <p style="color: #666;">Cordialement,</p>
          <p style="color: #666;">L'équipe administrative</p>
        </div>
      `
    );

    res.json({
      success: true,
      message: 'Mémoire rejeté avec succès'
    });
  } catch (error) {
    console.error('Error rejecting memoire:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting memoire'
    });
  }
});

// Route pour vérifier si un fichier existe
router.get('/check-file/:filename', async (req, res) => {
  try {
    const filePath = path.join(uploadDir, req.params.filename);
    const exists = fs.existsSync(filePath);
    res.json({ exists });
  } catch (error) {
    console.error('Error checking file:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking file'
    });
  }
});

// Route pour obtenir les statistiques
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await db.promise().query(`
      SELECT 
        COUNT(*) as memoires,
        COUNT(DISTINCT id_etudiant) as chercheurs,
        COUNT(DISTINCT speciality) as specialites
      FROM memoire
      WHERE status = 'validated'
    `);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

// Route pour obtenir les statistiques du tableau de bord
router.get('/dashboard', async (req, res) => {
  try {
    const [stats] = await db.promise().query(`
      SELECT 
        COUNT(*) as total_memoires,
        COUNT(DISTINCT id_etudiant) as total_students,
        COUNT(DISTINCT speciality) as total_specialities,
        COUNT(DISTINCT university) as total_universities
      FROM memoire
    `);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats'
    });
  }
});

// Route pour obtenir les statistiques d'administration
router.get('/admin', async (req, res) => {
  try {
    const [stats] = await db.promise().query(`
      SELECT 
        m.*,
        e.name as student_name,
        e.email as student_email
      FROM memoire m
      LEFT JOIN etudiant e ON m.id_etudiant = e.id_etudiant
      ORDER BY m.date_soumission DESC
    `);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin stats'
    });
  }
});

// Route pour récupérer les mémoires d'un étudiant spécifique
router.get('/memoireEtudiant/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log("Récupération des mémoires pour l'utilisateur:", userId);

    const [memoires] = await db.promise().query(
      'SELECT * FROM memoire WHERE id_etudiant = ? ORDER BY date_soumission DESC',
      [userId]
    );

    res.json(memoires);
  } catch (error) {
    console.error('Erreur lors de la récupération des mémoires:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des mémoires'
    });
  }
});


module.exports = router;