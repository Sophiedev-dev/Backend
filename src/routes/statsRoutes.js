const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [stats] = await db.promise().query(`
      SELECT 
        COUNT(*) as memoires,
        COUNT(DISTINCT id_etudiant) as chercheurs,
        COUNT(DISTINCT speciality) as specialites
      FROM memoire
      WHERE status = 'validated'
    `);

    // Ensure we're sending the data in the correct format
    res.json({
      memoires: stats[0].memoires,
      chercheurs: stats[0].chercheurs,
      specialites: stats[0].specialites
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

module.exports = router;