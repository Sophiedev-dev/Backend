const express = require('express');
const router = express.Router();
const memoireController = require('../controllers/memoireController');

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

module.exports = router;