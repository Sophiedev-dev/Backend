const express = require('express');
const router = express.Router();
const memoireController = require('../controllers/memoireController');
const adminController = require('../controllers/adminController');

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

// Route pour obtenir les statistiques d'administration
router.get('/', adminController.getAdminStats);

// Routes pour la gestion des seuils de similarité
router.get('/similarity-threshold', adminController.getSimilarityThreshold);
router.post('/similarity-threshold', adminController.updateSimilarityThreshold);


module.exports = router;