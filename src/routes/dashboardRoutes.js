const express = require('express');
const router = express.Router();
const memoireController = require('../controllers/memoireController');

// Route pour obtenir les statistiques du tableau de bord
router.get('/', async (req, res) => {
  try {
    const stats = await memoireController.getDashboardStats(req, res);
    return stats;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des statistiques du tableau de bord." 
    });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const memoireId = req.params.id;

    // First, get the memoire to find the file path
    const [memoire] = await db.promise().query(
      'SELECT file_path FROM memoire WHERE id_memoire = ?',
      [memoireId]
    );

    if (memoire.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    // Delete the file if it exists
    if (memoire[0].file_path) {
      const filePath = path.join(__dirname, '..', '..', memoire[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    const [result] = await db.promise().query(
      'DELETE FROM memoire WHERE id_memoire = ?',
      [memoireId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Memoire not found'
      });
    }

    res.json({
      success: true,
      message: 'Memoire deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting memoire:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting memoire'
    });
  }
});

module.exports = router;