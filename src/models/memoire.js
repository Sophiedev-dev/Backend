const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Ajouter un nouveau mémoire
const addMemoire = (memoireData, filePath, fileName) => {
  const {
    libelle,
    annee, 
    cycle, 
    speciality,
    university,
    description,
    id_etudiant,
    mention
  } = memoireData;

  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO memoire (
        libelle, annee, cycle, speciality, university, 
        description, file_path, file_name, id_etudiant, mention
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      libelle,
      annee,
      cycle,
      speciality,
      university,
      description,
      filePath,
      fileName,
      id_etudiant,
      mention || null
    ];

    db.query(query, values, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Récupérer tous les mémoires
const getAllMemoires = (status = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT m.id_memoire, m.libelle, m.annee, m.cycle, m.speciality, m.university, 
             m.file_name, m.file_path, m.status, m.description, m.file_status, m.mention,
             e.name AS etudiant_nom
      FROM memoire m
      JOIN etudiant e ON m.id_etudiant = e.id_etudiant`;
    
    const queryParams = [];

    if (status) {
      query += ` WHERE m.status = ?`; 
      queryParams.push(status);
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Récupérer les mémoires filtrés
const getFilteredMemoires = (status = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT m.id_memoire, m.libelle, m.annee, m.cycle, m.speciality, m.university, 
             m.file_name, m.file_path, m.status, m.description, m.file_status, m.mention,
             e.name AS etudiant_nom
      FROM memoire m
      JOIN etudiant e ON m.id_etudiant = e.id_etudiant
      WHERE m.file_status = 'available'`;
    
    const queryParams = [];

    if (status) {
      query += ` AND m.status = ?`; 
      queryParams.push(status);
    }

    db.query(query, queryParams, (err, results) => {
      if (err) {
        reject(err);
      } else {
        const filteredResults = results.filter((memoire) => {
          const filePath = path.join(__dirname, "../../uploads", memoire.file_name);
          return fs.existsSync(filePath);
        });
        resolve(results);
      }
    });
  });
};

// Récupérer un mémoire par ID
const getMemoireById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT m.*, e.name AS etudiant_nom
      FROM memoire m
      JOIN etudiant e ON m.id_etudiant = e.id_etudiant
      WHERE m.id_memoire = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) {
        reject(err);
      } else {
        if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      }
    });
  });
};

// Récupérer les mémoires par ID étudiant
const getMemoiresByEtudiantId = (id_etudiant) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT m.*, e.name AS etudiant_nom
      FROM memoire m
      JOIN etudiant e ON m.id_etudiant = e.id_etudiant
      WHERE m.id_etudiant = ?
    `;

    db.query(query, [id_etudiant], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Supprimer un mémoire
const deleteMemoire = async (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Étape 1 : Récupérer le chemin du fichier
      const [fileResult] = await db.promise().query(
        "SELECT file_path FROM memoire WHERE id_memoire = ?",
        [id]
      );

      if (fileResult.length === 0) {
        return reject(new Error("Mémoire non trouvé"));
      }

      const filePath = fileResult[0].file_path;

      // Étape 2 : Supprimer les signatures associées
      await db.promise().query(
        "DELETE FROM digital_signatures WHERE id_memoire = ?",
        [id]
      );

      // Étape 3 : Supprimer le fichier physique (si existe)
      let fileDeleted = false;
      if (fs.existsSync(filePath)) {
        try {
          await fs.promises.unlink(filePath);
          fileDeleted = true;
        } catch (unlinkErr) {
          console.error("Erreur lors de la suppression du fichier :", unlinkErr);
        }
      }

      // Étape 4 : Supprimer l'enregistrement du mémoire
      const [deleteResult] = await db.promise().query(
        "DELETE FROM memoire WHERE id_memoire = ?",
        [id]
      );

      resolve({
        success: true,
        fileDeleted,
        recordDeleted: deleteResult.affectedRows > 0
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Mettre à jour le statut d'un mémoire
const updateMemoireStatus = (id, action, raison_rejet = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE memoire SET status = ?';
    const queryParams = [action];

    if (action === 'rejected' && raison_rejet) {
      query += ', raison_rejet = ?';
      queryParams.push(raison_rejet);
    }

    query += ' WHERE id_memoire = ?';
    queryParams.push(id);

    db.query(query, queryParams, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Valider un mémoire
const validateMemoire = async (id, id_admin) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Mettre à jour le statut
      await db.promise().query(
        "UPDATE memoire SET status = ?, validated_by = ? WHERE id_memoire = ?",
        ["validated", id_admin, id]
      );

      // Récupérer les infos du mémoire et de l'étudiant
      const [results] = await db.promise().query(`
        SELECT e.email, e.name, m.* 
        FROM memoire m 
        JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
        WHERE m.id_memoire = ?
      `, [id]);

      if (results.length === 0) {
        throw new Error("Mémoire ou étudiant non trouvé");
      }

      // Ajouter une signature numérique
      const [existingSignature] = await db.promise().query(
        'SELECT * FROM digital_signatures WHERE id_memoire = ?',
        [id]
      );

      if (existingSignature.length === 0) {
        const dataToSign = JSON.stringify({
          id_memoire: id,
          libelle: results[0].libelle,
          etudiant_id: results[0].id_etudiant,
          date_validation: new Date().toISOString()
        });

        // Utiliser la fonction de signature du module crypto
        const { signDocument } = require('../utils/crypto');
        const { signature, publicKey } = signDocument(dataToSign);

        // Sauvegarder la signature
        await db.promise().query(
          `INSERT INTO digital_signatures 
           (id_memoire, id_admin, signature, public_key, signed_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [id, id_admin, signature, publicKey]
        );
      }

      resolve({
        success: true,
        thesis: results[0]
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Récupérer les suggestions de mémoires
const getMemorySuggestions = (searchQuery) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT libelle 
      FROM memoire 
      WHERE LOWER(libelle) LIKE ? 
      AND status = 'validated' 
      LIMIT 5
    `;

    const queryParam = [`%${searchQuery.toLowerCase()}%`];

    db.query(sql, queryParam, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.map(m => m.libelle));
      }
    });
  });
};

// Vérifier la signature d'un mémoire
const verifyThesisSignature = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const query = `
        SELECT 
          ds.id as signature_id,
          ds.signed_at,
          a.name as admin_name,
          m.libelle
        FROM digital_signatures ds 
        JOIN admin a ON ds.id_admin = a.id_admin 
        JOIN memoire m ON ds.id_memoire = m.id_memoire
        WHERE ds.id_memoire = ?
      `;
      
      const [rows] = await db.promise().query(query, [id]);

      if (rows.length === 0) {
        resolve({
          verified: false,
          message: "Aucune signature trouvée pour ce mémoire"
        });
      } else {
        const signatureInfo = rows[0];
        
        resolve({
          verified: true,
          details: {
            signedBy: signatureInfo.admin_name,
            signedAt: signatureInfo.signed_at,
            memoire: signatureInfo.libelle
          }
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Rejeter un mémoire
const rejectMemoire = (id, rejection_reason) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Mettre à jour le statut et la raison du rejet
      const updateQuery = "UPDATE memoire SET status = 'rejected', rejection_reason = ? WHERE id_memoire = ?";
      const [result] = await db.promise().query(updateQuery, [rejection_reason, id]);

      if (result.affectedRows === 0) {
        return reject(new Error("Mémoire non trouvé"));
      }

      // Récupérer les infos de l'étudiant concerné
      const [studentResult] = await db.promise().query(`
        SELECT e.id_etudiant, e.email, e.name, m.libelle 
        FROM memoire m 
        JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
        WHERE m.id_memoire = ?
      `, [id]);

      if (studentResult.length === 0) {
        return reject(new Error("Étudiant non trouvé"));
      }

      resolve({
        success: true,
        student: studentResult[0],
        memo: {
          id,
          libelle: studentResult[0].libelle
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Récupérer les statistiques générales
const getStats = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const [stats] = await db.promise().query(`
        SELECT 
          (SELECT COUNT(*) FROM memoire WHERE status = 'validated') as memoires,
          (SELECT COUNT(DISTINCT id_etudiant) FROM memoire) as chercheurs,
          (SELECT COUNT(DISTINCT speciality) FROM memoire) as specialites
      `);

      resolve({
        memoires: stats[0].memoires || 0,
        chercheurs: stats[0].chercheurs || 0,
        specialites: stats[0].specialites || 0
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Récupérer les statistiques pour le tableau de bord
const getDashboardStats = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Statistiques récentes sur les mémoires soumises
      const [recentSubmissions] = await db.promise().query(`
        SELECT m.*, e.name as etudiant_nom 
        FROM memoire m 
        JOIN etudiant e ON m.id_etudiant = e.id_etudiant 
        ORDER BY m.date_soumission DESC LIMIT 5
      `);

      // Top spécialités les plus populaires
      const [topSpecialities] = await db.promise().query(`
        SELECT 
          COALESCE(speciality, 'Non spécifié') as speciality,
          COUNT(*) AS count
        FROM memoire
        WHERE speciality IS NOT NULL 
        AND speciality != ''
        GROUP BY speciality
        ORDER BY count DESC
        LIMIT 5
      `);

      // Statistiques sur les soumissions mensuelles
      const [monthlySubmissions] = await db.promise().query(`
        SELECT 
          MONTH(date_soumission) AS month,
          COUNT(*) AS submissions
        FROM memoire
        WHERE date_soumission IS NOT NULL
        GROUP BY MONTH(date_soumission)
        ORDER BY month
      `);

      const formattedTopSpecialities = topSpecialities.length > 0 ? topSpecialities : [];

      resolve({
        recentSubmissions,
        topSpecialities: formattedTopSpecialities,
        monthlySubmissions
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Récupérer les statistiques pour l'administration
const getAdminStats = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Statistiques sur les mémoires
      const [total] = await db.promise().query("SELECT COUNT(*) AS total FROM memoire");
      const [validated] = await db.promise().query("SELECT COUNT(*) AS validated FROM memoire WHERE status = 'validated'");
      const [rejected] = await db.promise().query("SELECT COUNT(*) AS rejected FROM memoire WHERE status = 'rejected'");
      const [pending] = await db.promise().query("SELECT COUNT(*) AS pending FROM memoire WHERE status = 'pending'");

      // Statistiques sur les utilisateurs
      const [totalUsers] = await db.promise().query("SELECT COUNT(*) AS totalUsers FROM etudiant");
      const [activeUsers] = await db.promise().query("SELECT COUNT(*) AS activeUsers FROM etudiant WHERE is_active = 1");

      resolve({
        total: total[0].total,
        validated: validated[0].validated,
        rejected: rejected[0].rejected,
        pending: pending[0].pending,
        totalUsers: totalUsers[0].totalUsers,
        activeUsers: activeUsers[0].activeUsers
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  addMemoire,
  getAllMemoires,
  getFilteredMemoires,
  getMemoireById,
  getMemoiresByEtudiantId,
  deleteMemoire,
  updateMemoireStatus,
  validateMemoire,
  getMemorySuggestions,
  verifyThesisSignature,
  rejectMemoire,
  getStats,
  getDashboardStats,
  getAdminStats
};