const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Route pour envoyer un email
router.post('/send-email', emailController.sendEmailController);

module.exports = router;