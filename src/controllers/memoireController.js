const memoireModel = require('../models/memoire');
const { sendEmail } = require('../config/email');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Ajouter un nouveau mémoire
exports.addMemoire = async (req, res) => {
  const {
    libelle,
    annee, 
    cycle, 
    speciality,
    university,
    description,
    id_etudiant,
    mention,
    status
  } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier téléchargé." });
  }

  // Validation de la mention
  const validMentions = ['Passable', 'Bien', 'Tres Bien', 'Excellent'];
  if (mention && !validMentions.includes(mention)) {
    return res.status(400).json({ message: 'Mention invalide' });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;

  try {
    await memoireModel.addMemoire(req.body, filePath, fileName);
    res.status(201).json({ message: "Données soumises avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'insertion dans la base de données:", error);

    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error("Erreur lors de la suppression du fichier:", unlinkErr);
      } else {
        console.log("Fichier supprimé suite à une erreur dans la base de données.");
      }
    });

    res.status(500).json({ message: "Erreur interne du serveur.", error: error.message });
  }
};

// Récupérer tous les mémoires
exports.getAllMemoires = async (req, res) => {
  const { status } = req.query; // Filtre sur le statut (validé, rejeté, etc.)

  try {
    const memoires = await memoireModel.getFilteredMemoires(status);
    res.status(200).json({ memoire: memoires });
  } catch (error) {
    console.error("Erreur lors de la récupération des mémoires :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des mémoires." });
  }
};

// Récupérer un mémoire par son ID
exports.getMemoireById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const memoire = await memoireModel.getMemoireById(id);
    
    if (!memoire) {
      return res.status(404).json({ 
        success: false, 
        message: "Mémoire non trouvé" 
      });
    }

    res.json({ 
      success: true, 
      memoire
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du mémoire:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération du mémoire" 
    });
  }
};

// Récupérer les mémoires d'un étudiant
exports.getMemoiresByStudentId = async (req, res) => {
  const { id_etudiant } = req.query;
  console.log("ID étudiant reçu:", id_etudiant);

  if (!id_etudiant) {
    return res.status(400).json({ message: "ID étudiant requis." });
  }

  try {
    const memoires = await memoireModel.getMemoiresByEtudiantId(id_etudiant);
    res.status(200).json(memoires);
  } catch (error) {
    console.error("Erreur lors de la récupération des mémoires :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des mémoires." });
  }
};

// Supprimer un mémoire
exports.deleteMemoire = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await memoireModel.deleteMemoire(id);
    res.status(200).json({ 
      success: true,
      message: "Mémoire et signatures associées supprimés avec succès.",
      fileDeleted: result.fileDeleted
    });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression du mémoire.",
      error: error.message 
    });
  }
};

// Mettre à jour le statut d'un mémoire
exports.updateMemoireStatus = async (req, res) => {
  const { action, raison_rejet } = req.body;
  const { id } = req.params;

  if (!['validated', 'rejected'].includes(action)) {
    return res.status(400).json({ message: "Action non valide." });
  }

  try {
    await memoireModel.updateMemoireStatus(id, action, raison_rejet);

    if (action === 'rejected' && raison_rejet) {
      // Récupérer l'email de l'étudiant pour envoyer une notification
      const emailQuery = `
        SELECT e.email
        FROM etudiant e
        JOIN memoire m ON e.id_etudiant = m.id_etudiant
        WHERE m.id_memoire = ?
      `;
      
      const [results] = await db.promise().query(emailQuery, [id]);
      
      if (results.length > 0) {
        const studentEmail = results[0].email;
        // Ici, on pourrait implémenter l'envoi d'email
      }
    }

    res.status(200).json({ message: `Le mémoire a été ${action} avec succès.` });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du mémoire :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du mémoire." });
  }
};

// Valider un mémoire
exports.validateMemoire = async (req, res) => {
  console.log('Route de validation appelée');
  console.log('Params:', req.params);
  console.log('Body:', req.body);

  const { id } = req.params;
  const { status, id_admin } = req.body;

  if (!status || !id_admin) {
    return res.status(400).json({ message: "Le statut et l'ID admin sont requis." });
  }

  try {
    if (status === 'validated') {
      const result = await memoireModel.validateMemoire(id, id_admin);
      
      // Récupérer les détails de l'admin pour l'email
      const [adminDetails] = await db.promise().query(
        "SELECT name FROM admin WHERE id_admin = ?",
        [id_admin]
      );

      // Préparer l'email
      const { email, name, libelle } = result.thesis;
      const subject = `Validation de votre mémoire`;
      const text = `Bonjour ${name},\n\n
        Votre mémoire "${libelle}" a été validé par ${adminDetails[0].name}.\n
        Date de validation: ${new Date().toLocaleDateString()}.\n\n
        Félicitations !\n
        Cordialement,`;

      const html = `
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre mémoire "<strong>${libelle}</strong>" a été validé.</p>
        <p><strong>Validé par:</strong> ${adminDetails[0].name}</p>
        <p><strong>Date de validation:</strong> ${new Date().toLocaleDateString()}</p>
        <p>Félicitations !</p>
        <p>Cordialement,</p>`;

      console.log('Tentative d\'envoi d\'email à:', email);

      // Envoi de l'email
      const emailResult = await sendEmail(email, subject, text, html);
      console.log('Résultat de l\'envoi d\'email:', emailResult);

      return res.status(200).json({
        success: true,
        message: `Mémoire validé${emailResult.success ? ' et notification envoyée' : ''} à ${email}`,
        emailSent: emailResult.success
      });
    }
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du mémoire",
      error: error.message
    });
  }
};

// Obtenir des suggestions de mémoires
exports.getMemorySuggestions = async (req, res) => {
  const query = req.query.q?.toLowerCase();
  if (!query) {
    console.log("Aucune requête reçue pour les suggestions.");
    return res.json({ suggestions: [] });
  }

  try {
    const suggestions = await memoireModel.getMemorySuggestions(query);
    res.json({ suggestions });
  } catch (error) {
    console.error("Erreur API suggestions :", error);
    return res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
};

// Vérifier la signature d'un mémoire
exports.verifyThesisSignature = async (req, res) => {
  const { id } = req.params;
  console.log('Requête reçue pour ID:', id);

  try {
    const result = await memoireModel.verifyThesisSignature(id);
    
    if (!result.verified) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      details: result.details
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de la signature",
      error: error.message
    });
  }
};

// Rejeter un mémoire
exports.rejectMemoire = async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;

  if (!rejection_reason) {
    return res.status(400).json({ message: "La raison du rejet est requise." });
  }

  try {
    const result = await memoireModel.rejectMemoire(id, rejection_reason);
    const { email, name } = result.student;
    const { libelle } = result.memo;
    const message = `Votre mémoire "${libelle}" a été rejeté pour la raison suivante : ${rejection_reason}`;

    // Insérer une notification en base de données
    const notificationQuery = `INSERT INTO notifications (id_etudiant, message) VALUES (?, ?)`;
    await db.promise().query(notificationQuery, [result.student.id_etudiant, message]);

    // Envoi de l'email à l'étudiant
    const subject = `Rejet de votre mémoire`;
    const text = `Bonjour ${name},\n\nVotre mémoire "${libelle}" a été rejeté.\n\nRaison : ${rejection_reason}\n\nMerci de prendre en compte ces remarques.`;
    const html = `<p>Bonjour <strong>${name}</strong>,</p>
                  <p>Votre mémoire "<strong>${libelle}</strong>" a été <strong>rejeté</strong>.</p>
                  <p><strong>Raison :</strong> ${rejection_reason}</p>
                  <p>Merci de prendre en compte ces remarques.</p>`;

    const emailResult = await sendEmail(email, subject, text, html);

    if (!emailResult.success) {
      return res.status(500).json({ message: "Mémoire rejeté, mais erreur lors de l'envoi de l'email." });
    }

    res.status(200).json({ message: "Mémoire rejeté, notification envoyée et email transmis." });
  } catch (error) {
    console.error("Erreur SQL lors du rejet du mémoire :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Récupérer les statistiques
exports.getStats = async (req, res) => {
  try {
    const stats = await memoireModel.getStats();
    res.json({
      success: true,
      memoires: stats.memoires,
      chercheurs: stats.chercheurs,
      specialites: stats.specialites
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

// Récupérer les statistiques pour le tableau de bord
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await memoireModel.getDashboardStats();
    res.json({
      success: true,
      recentSubmissions: stats.recentSubmissions,
      topSpecialities: stats.topSpecialities,
      monthlySubmissions: stats.monthlySubmissions
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des statistiques du tableau de bord." 
    });
  }
};

// Récupérer les statistiques d'administration
exports.getAdminStats = async (req, res) => {
  try {
    const stats = await memoireModel.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
  }
};

// Vérifier si un fichier existe
exports.checkFileExists = async (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "../../uploads", fileName);

  try {
    const exists = await fs.promises.access(filePath)
      .then(() => true)
      .catch(() => false);

    res.json({ 
      exists, 
      filePath,
      url: exists ? `/uploads/${fileName}` : null 
    });
  } catch (error) {
    res.status(500).json({ 
      exists: false, 
      error: error.message 
    });
  }
};