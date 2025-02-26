const notificationModel = require('../models/notification');

// Récupérer les notifications d'un étudiant
exports.getStudentNotifications = async (req, res) => {
  const { id_etudiant } = req.params;

  if (!id_etudiant) {
    return res.status(400).json({ message: "L'ID de l'étudiant est requis." });
  }

  try {
    const notifications = await notificationModel.getStudentNotifications(id_etudiant);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Erreur SQL lors de la récupération des notifications :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Créer une notification
exports.createNotification = async (req, res) => {
  const { id_etudiant, message } = req.body;

  if (!id_etudiant || !message) {
    return res.status(400).json({ message: "L'ID de l'étudiant et le message sont requis." });
  }

  try {
    await notificationModel.createNotification(id_etudiant, message);
    res.status(201).json({ message: "Notification créée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};