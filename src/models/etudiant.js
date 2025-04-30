const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Récupérer tous les étudiants
const getAllEtudiants = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id_etudiant,
        name,
        surname,
        email,
        phonenumber,
        university,
        faculty,
        speciality,
        email_activated,
        is_active
      FROM etudiant
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Créer un étudiant
const createEtudiant = async (userData) => {
  const { name, surname, email, password, phonenumber, university, faculty, speciality } = userData;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO etudiant (
          name, 
          surname, 
          email, 
          password, 
          phonenumber, 
          university, 
          faculty, 
          speciality, 
          email_activated,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, true)
      `;
      
      const values = [
        name, 
        surname, 
        email, 
        hashedPassword, 
        phonenumber || null, 
        university || null, 
        faculty || null, 
        speciality || null
      ];

      db.query(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

// Mettre à jour un étudiant
const updateEtudiant = (id, userData) => {
  const { name, surname, email, is_active } = userData;
  
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE etudiant 
      SET name = ?, surname = ?, email = ?, is_active = ?
      WHERE id_etudiant = ?
    `;
    
    db.query(query, [name, surname, email, is_active, id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Supprimer un étudiant
const deleteEtudiant = (id) => {
  return new Promise((resolve, reject) => {
    const query = "DELETE FROM etudiant WHERE id_etudiant = ?";
    
    db.query(query, [id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Suppression douce d'un étudiant (soft delete)
const softDeleteEtudiant = (id) => {
  return new Promise((resolve, reject) => {
    // Vérifier d'abord si l'étudiant existe
    const checkQuery = "SELECT * FROM etudiant WHERE id_etudiant = ?";
    
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        return reject(checkErr);
      }

      if (checkResults.length === 0) {
        return reject(new Error("Étudiant non trouvé"));
      }

      // Commencer la transaction
      db.beginTransaction((err) => {
        if (err) {
          return reject(err);
        }

        // 1. Insérer dans deleted_users
        const insertQuery = `
          INSERT INTO deleted_users (
            id_etudiant, name, surname, email, password, 
            phonenumber, university, faculty, speciality, 
            id_role, deleted_at
          )
          SELECT 
            id_etudiant, name, surname, email, password, 
            phonenumber, university, faculty, speciality, 
            id_role, CURRENT_TIMESTAMP
          FROM etudiant 
          WHERE id_etudiant = ?
        `;

        db.query(insertQuery, [id], (insertErr) => {
          if (insertErr) {
            return db.rollback(() => {
              reject(insertErr);
            });
          }

          // 2. Supprimer de la table etudiant
          const deleteQuery = "DELETE FROM etudiant WHERE id_etudiant = ?";
          
          db.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
              return db.rollback(() => {
                reject(deleteErr);
              });
            }

            // Valider la transaction
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  reject(commitErr);
                });
              }
              resolve({ success: true });
            });
          });
        });
      });
    });
  });
};

// Restaurer un étudiant
const restoreEtudiant = (id) => {
  return new Promise((resolve, reject) => {
    // Vérifier d'abord si l'étudiant existe dans la corbeille
    const checkQuery = "SELECT * FROM deleted_users WHERE id_etudiant = ?";
    
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        return reject(checkErr);
      }

      if (checkResults.length === 0) {
        return reject(new Error("Étudiant non trouvé dans la corbeille"));
      }

      const user = checkResults[0];

      // Commencer la transaction
      db.beginTransaction((err) => {
        if (err) {
          return reject(err);
        }

        // 1. Réinsérer dans la table etudiant
        const insertQuery = `
          INSERT INTO etudiant (
            id_etudiant, name, surname, email, password, 
            phonenumber, university, faculty, speciality, 
            id_role, email_activated, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
        `;

        const values = [
          user.id_etudiant,
          user.name,
          user.surname,
          user.email,
          user.password,
          user.phonenumber,
          user.university,
          user.faculty,
          user.speciality,
          user.id_role
        ];

        db.query(insertQuery, values, (insertErr) => {
          if (insertErr) {
            return db.rollback(() => {
              reject(insertErr);
            });
          }

          // 2. Supprimer de la table deleted_users
          const deleteQuery = "DELETE FROM deleted_users WHERE id_etudiant = ?";
          
          db.query(deleteQuery, [id], (deleteErr) => {
            if (deleteErr) {
              return db.rollback(() => {
                reject(deleteErr);
              });
            }

            // Valider la transaction
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  reject(commitErr);
                });
              }
              resolve({ success: true });
            });
          });
        });
      });
    });
  });
};

// Récupérer les étudiants supprimés
const getDeletedEtudiants = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id_etudiant, name, surname, email, university, 
             faculty, speciality, deleted_at 
      FROM deleted_users
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Inscrire un nouvel étudiant avec un code d'activation
const registerEtudiant = async (userData, activationCode) => {
  const { name, surname, email, password } = userData;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO etudiant (name, surname, email, password, code, email_activated)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(query, [name, surname, email, hashedPassword, activationCode, false], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            userId: result.insertId
          });
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

// Activer un compte étudiant
const activateEtudiantAccount = (email, code) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT code FROM etudiant WHERE email = ?`;

    db.query(query, [email], (err, results) => {
      if (err) {
        return reject(err);
      }

      if (results.length === 0 || results[0].code !== code) {
        return reject(new Error("Code incorrect"));
      }

      const updateQuery = `UPDATE etudiant SET email_activated = true WHERE email = ?`;
      
      db.query(updateQuery, [email], (updateErr) => {
        if (updateErr) {
          reject(updateErr);
        } else {
          resolve({ success: true });
        }
      });
    });
  });
};

module.exports = {
  getAllEtudiants,
  createEtudiant,
  updateEtudiant,
  deleteEtudiant,
  softDeleteEtudiant,
  restoreEtudiant,
  getDeletedEtudiants,
  registerEtudiant,
  activateEtudiantAccount
};