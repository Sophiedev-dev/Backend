const express = require('express');
const router = express.Router();
const { upload } = require('../config/upload');
const { sendEmail } = require('../config/email');
const db = require('../config/db');
const { PDFDocument, rgb } = require('pdf-lib');
const similarityChecker = require('../utils/similarityChecker');
const { signDocument, verifySignature } = require('../utils/crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const { S3Client, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const streamToBuffer = require('../utils/streamToBuffer');



const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Créer le dossier uploads s'il n'existe pas
// const uploadDir = 'uploads/memoires';
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   }
// });

// Remplacer la configuration du storage par celle de S3
const uploadMiddleware = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'memoires/' + uniqueSuffix + '-' + file.originalname);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE
  }),
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

// Add this route for signature verification
router.post('/verify-signature', uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.body.publicKey) {
      return res.status(400).json({
        success: false,
        message: 'File and public key are required'
      });
    }

    // Get the file path and public key
    const filePath = req.file.location; // S3 utilise 'key' au lieu de 'path'
    const publicKey = req.body.publicKey;

    // Query the database to get the signature details
    const [signature] = await db.promise().query(
      `SELECT ds.*, m.libelle, a.name as admin_name, ds.signed_at 
       FROM digital_signatures ds
       JOIN memoire m ON ds.id_memoire = m.id_memoire
       JOIN admin a ON ds.id_admin = a.id_admin
       WHERE m.file_path = ?`,
      [filePath]
    );

    if (!signature.length) {
      return res.json({
        success: false,
        message: 'No digital signature found for this document'
      });
    }

    // Verify the signature using the provided public key
    const isValid = verifySignature(signature[0].signature, publicKey);

    if (isValid) {
      res.json({
        success: true,
        message: 'Document signature verified successfully',
        details: {
          documentTitle: signature[0].libelle,
          signedBy: signature[0].admin_name,
          signedAt: signature[0].signed_at
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Invalid signature'
      });
    }

  } catch (error) {
    console.error('Error verifying signature:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying document signature'
    });
  } finally {
    // Clean up the uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Add this route for downloading signed documents
router.get('/:id/download', async (req, res) => {
  try {
    const [memoire] = await db.promise().query(
      `SELECT * FROM memoire WHERE id_memoire = ?`,
      [req.params.id]
    );

    if (!memoire.length) {
      return res.status(404).json({ 
        success: false,
        message: 'Document not found' 
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: memoire[0].file_path.replace(/^https:\/\/.*\.amazonaws\.com\//, '')
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    
    res.json({ 
      success: true,
      url: url 
    });

  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error downloading document',
      error: error.message 
    });
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

// New route for similarity checking
router.post('/check-similarity', uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
// console.log('file');
// console.log(req.file);
    // Récupérer le fichier depuis S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: req.file.key 
    });
    const response = await s3.send(command);

// Convertir le Body (qui est un stream) en buffer
const buffer = await streamToBuffer.streamToBuffer(response.Body);
    try {
      // console.log("commadeeeeeeeeeeeeeeeeeeee");
      // console.log(command);
      const text = await similarityChecker.extractTextFromPDF(buffer);
      const results = await similarityChecker.compareWithExistingMemoires(text);
      const status = await similarityChecker.getSimilarityStatus(results);

      res.json({
        success: true,
        results: results.map(r => ({
          ...r,
          author: r.etudiant_nom || 'Unknown',
          email: r.etudiant_email || 'No email',
          submissionDate: r.date_soumission || 'Unknown date'
        })),
        status: {
          ...status,
          similarity_warning_threshold: status.warningThreshold,
          similarity_danger_threshold: status.dangerThreshold
        }
      });
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du fichier pour la vérification de similarité'
      });
    }
  } catch (error) {
    console.error('Error checking similarity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error checking similarity'
    });
  }
});

// Modified route for submitting a new mémoire with similarity check
router.post('/memoire', uploadMiddleware.single('file'), async (req, res) => {
  try {
    console.log(req.file)
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

    // Récupérer le fichier depuis S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: req.file.key
    });
    const response = await s3.send(command);

// Convertir le Body (qui est un stream) en buffer
const buffer = await streamToBuffer.streamToBuffer(response.Body);
    
    const text = await similarityChecker.extractTextFromPDF(buffer);
    const similarResults = await similarityChecker.compareWithExistingMemoires(text);
    const status = similarityChecker.getSimilarityStatus(similarResults);
console.log(req.file.location);
    // Insérer dans la base de données avec le chemin S3
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
        req.file.location // Utiliser la clé S3 au lieu du chemin local
      ]
    );

    await similarityChecker.saveComparisonResults(result.insertId, similarResults);

    res.status(201).json({
      success: true,
      message: 'Mémoire soumis avec succès',
      memoireId: result.insertId,
      similarityResults: {
        results: similarResults,
        status
      }
    });

  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    
    // Clean up the file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la sauvegarde du mémoire'
    });
  }
});

// Route to get similarity results for a mémoire
router.get('/:id/similarity', async (req, res) => {
  try {
    const memoireId = req.params.id;
    const results = await similarityChecker.getComparisonResults(memoireId);
    
    if (!results) {
      return res.status(404).json({
        success: false,
        message: 'No similarity results found for this mémoire'
      });
    }
    
    const status = similarityChecker.getSimilarityStatus(results);
    
    res.json({
      success: true,
      results,
      status
    });
  } catch (error) {
    console.error('Error getting similarity results:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting similarity results'
    });
  }
});

router.get('/:memoireId/similarity/:compareId/details', async (req, res) => {
  try {
    const { memoireId, compareId } = req.params;
    
    // Get both mémoires
    const [memoires] = await db.promise().query(
      'SELECT id_memoire, libelle, file_path FROM memoire WHERE id_memoire IN (?, ?)',
      [memoireId, compareId]
    );

    if (memoires.length !== 2) {
      return res.status(404).json({ 
        success: false, 
        message: 'Un ou plusieurs mémoires non trouvés' 
      });
    }

    const sourceMemoire = memoires.find(m => m.id_memoire.toString() === memoireId);
    const targetMemoire = memoires.find(m => m.id_memoire.toString() === compareId);

    // Extract text from both PDFs
    const sourceText = await similarityChecker.extractTextFromPDF(sourceMemoire.file_path);
    const targetText = await similarityChecker.extractTextFromPDF(targetMemoire.file_path);

    // Get detailed comparison
    const comparisonResult = await similarityChecker.getDetailedComparison(sourceText, targetText);

    res.json({
      success: true,
      details: {
        sourceText: sourceText,
        targetText: targetText,
        matches: comparisonResult.detailedMatches,
        sourceMemoireTitle: sourceMemoire.libelle,
        targetMemoireTitle: targetMemoire.libelle
      }
    });

  } catch (error) {
    console.error('Error getting detailed similarity:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération des détails de similarité' 
    });
  }
});

// Add this route for detailed similarity comparison
router.get('/api/memoire/:sourceId/similarity/:targetId/details', async (req, res) => {
  try {
    const { sourceId, targetId } = req.params;
    
    // Get both mémoires
    const [memoires] = await db.promise().query(
      'SELECT id_memoire, libelle, file_path FROM memoire WHERE id_memoire IN (?, ?)',
      [sourceId, targetId]
    );

    if (memoires.length !== 2) {
      return res.status(404).json({
        success: false,
        message: 'Un ou plusieurs mémoires non trouvés'
      });
    }

    const sourceMemoire = memoires.find(m => m.id_memoire.toString() === sourceId);
    const targetMemoire = memoires.find(m => m.id_memoire.toString() === targetId);

    // Extract text from both PDFs
    const sourceText = await similarityChecker.extractTextFromPDF(sourceMemoire.file_path);
    const targetText = await similarityChecker.extractTextFromPDF(targetMemoire.file_path);

    // Get detailed comparison
    const comparison = await similarityChecker.getDetailedComparison(sourceText, targetText);

    res.json({
      success: true,
      details: {
        matches: comparison.detailedMatches,
        sourceMemoireTitle: sourceMemoire.libelle,
        targetMemoireTitle: targetMemoire.libelle
      }
    });

  } catch (error) {
    console.error('Error getting detailed similarity:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de similarité'
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

    // Remplacer la suppression locale par la suppression S3
    if (memoire[0].file_path) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: memoire[0].file_path
      });
      await s3.send(deleteCommand);
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

// ... existing code ...

router.get('/:id', async (req, res) => {
  try {
    const [memoire] = await db.promise().query(
      `SELECT m.*, 
              e.name as etudiant_nom, 
              e.email,
              a.name as admin_name,
              ds.signed_at as validation_date,
              ds.signature
       FROM memoire m 
       LEFT JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
       LEFT JOIN digital_signatures ds ON m.id_memoire = ds.id_memoire
       LEFT JOIN admin a ON ds.id_admin = a.id_admin
       WHERE m.id_memoire = ?`,
      [req.params.id]
    );

    if (memoire.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    // Générer une URL signée pour le fichier S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: memoire[0].file_path
    });
    
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const memoireWithValidation = {
      ...memoire[0],
      validated_by_name: memoire[0].admin_name || null,
      validation_date: memoire[0].validation_date || null,
      file_url: memoire[0].location, 
      // file_url: signedUrl 
    };

    res.json({
      success: true,
      memoire: memoireWithValidation
    });
  } catch (error) {
    console.error('Error fetching memoire:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching memoire details'
    });
  }
});

// ... existing code ...

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

    // Get admin info for signing
    const [adminInfo] = await db.promise().query(
      'SELECT private_key, public_key FROM admin WHERE id_admin = ?',
      [req.body.adminId] // Make sure to send adminId from frontend
    );

    // Sign the document
    const dataToSign = JSON.stringify({
      memoireId: memoireInfo[0].id_memoire,
      libelle: memoireInfo[0].libelle,
      date: new Date().toISOString()
    });

    const signature = signDocument(dataToSign, adminInfo[0].private_key);

    // Save signature in database
    await db.promise().query(
      `INSERT INTO digital_signatures (id_memoire, id_admin, signature, public_key) 
       VALUES (?, ?, ?, ?)`,
      [req.params.id, req.body.adminId, signature, adminInfo[0].public_key]
    );

    // Update memoire status and validated_by
    const [result] = await db.promise().query(
      'UPDATE memoire SET status = "validated", validated_by = ? WHERE id_memoire = ?',
      [req.body.adminId, req.params.id]
    );

    // Format the current date
    const currentDate = new Date().toLocaleDateString('fr-FR');

    // Send email notification
    try {
      await sendEmail(
        memoireInfo[0].email,
        'Validation de votre mémoire',
        `Votre mémoire "${memoireInfo[0].libelle}" a été validé et signé numériquement le ${currentDate}.`,
        `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Validation de Mémoire</h2>
            <p>Bonjour ${memoireInfo[0].name} ${memoireInfo[0].surname},</p>
            <p>Nous avons le plaisir de vous informer que votre mémoire a été validé et signé numériquement.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
              <p><strong>Titre du mémoire :</strong> ${memoireInfo[0].libelle}</p>
              <p><strong>Date de validation :</strong> ${currentDate}</p>
              <p><strong>Statut :</strong> Validé et signé numériquement</p>
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
      message: 'Mémoire validé et signé avec succès',
      signature: signature
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