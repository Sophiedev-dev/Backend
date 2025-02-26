const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Route pour récupérer les notifications d'un étudiant
router.get('/:id_etudiant', notificationController.getStudentNotifications);

// Route pour créer une notification
router.post('/', notificationController.createNotification);

module.exports = router;