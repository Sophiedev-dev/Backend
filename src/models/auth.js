const db = require('../config/db');
const bcrypt = require('bcrypt');

// Vérifier les identifiants de connexion
const executeQuery = (query, params, type) => {
  return new Promise((resolve, reject) => {
    db.query(query, [params[0]], async (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      if (results.length === 0) {
        resolve(null);
        return;
      }

      const user = results[0];
      const validPassword = await bcrypt.compare(params[1], user.password);

      if (!validPassword) {
        resolve(null);
        return;
      }

      if (type === "admin") {
        resolve({
          role: "admin",
          user: {
            id_admin: user.id_admin,
            name: user.name,
            email: user.email
          }
        });
      } else {
        resolve({
          role: "etudiant",
          user: {
            id_etudiant: user.id_etudiant,
            name: user.name,
            email: user.email
          },
          notActivated: !user.email_activated
        });
      }
    });
  });
};

// Authentification des utilisateurs
const authenticate = async (email, password) => {
  const adminQuery = "SELECT * FROM admin WHERE email = ?";
  const studentQuery = "SELECT * FROM etudiant WHERE email = ?";

  try {
    const [adminResult, studentResult] = await Promise.all([
      executeQuery(adminQuery, [email, password], "admin"),
      executeQuery(studentQuery, [email, password], "etudiant"),
    ]);

    if (adminResult) {
      return {
        success: true,
        message: "Connexion administrateur réussie.",
        role: adminResult.role,
        user: adminResult.user,
      };
    }
    
    if (studentResult) {
      if (studentResult.notActivated) {
        return {
          success: false,
          message: "Veuillez activer votre compte avant de vous connecter.",
          notActivated: true
        };
      }
      
      return {
        success: true,
        message: "Connexion réussie",
        role: studentResult.role,
        user: studentResult.user
      };
    }
    
    return {
      success: false,
      message: "Email ou mot de passe incorrect."
    };
  } catch (error) {
    throw error;
  }
};

// Générer et stocker des clés pour un admin
const generateAdminKeys = async (id_admin) => {
  const { generateKeyPair } = require('../utils/crypto');
  
  try {
    const { publicKey, privateKey } = generateKeyPair();
    
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE admin SET public_key = ?, private_key = ? WHERE id_admin = ?",
        [publicKey, privateKey, id_admin],
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve({ success: true });
          }
        }
      );
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticate,
  generateAdminKeys
};