const express = require('express');
const router = express.Router();
const memoireController = require('../controllers/memoireController');
const adminController = require('../controllers/adminController');
const db = require('../config/db'); 
// Route pour obtenir les statistiques d'administration
router.get('/', async (req, res) => {
  try {
    // Statistiques sur les mémoires
    const stats = await memoireController.getAdminStats(req, res);
    return stats;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
  }
});

// Add this route to get the admin's public key
router.get('/public-key', async (req, res) => {
  try {
    const [admin] = await db.promise().query(
      'SELECT public_key FROM admin WHERE id_admin = 1'
    );

    if (!admin.length || !admin[0].public_key) {
      return res.status(404).json({
        success: false,
        message: 'Public key not found'
      });
    }

    res.json({
      success: true,
      publicKey: admin[0].public_key
    });
  } catch (error) {
    console.error('Error fetching public key:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving public key'
    });
  }
});

// Route pour obtenir les statistiques d'administration
router.get('/', adminController.getAdminStats);

// Routes pour la gestion des seuils de similarité
router.get('/similarity-threshold', adminController.getSimilarityThreshold);
router.post('/similarity-threshold', adminController.updateSimilarityThreshold);


module.exports = router;