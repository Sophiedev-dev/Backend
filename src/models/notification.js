const db = require('../config/db');

// Récupérer les notifications d'un étudiant
const getStudentNotifications = (id_etudiant) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM notifications WHERE id_etudiant = ? ORDER BY date_creation DESC`;
    
    db.query(query, [id_etudiant], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Créer une notification
const createNotification = (id_etudiant, message) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO notifications (id_etudiant, message) VALUES (?, ?)`;
    
    db.query(query, [id_etudiant, message], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  getStudentNotifications,
  createNotification
};