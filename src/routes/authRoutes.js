const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { sendVerificationEmail } = require('../config/email');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Route de connexion
router.post('/login', async (req, res) => {
  console.log("Données reçues:", req.body); // Debug

  try {
    const { email, password } = req.body;

    // Vérifier d'abord si c'est un admin
    const [admins] = await db.promise().query(
      'SELECT * FROM admin WHERE email = ?',
      [email]
    );

    if (admins.length > 0) {
      const admin = admins[0];
      const validPassword = await bcrypt.compare(password, admin.password);
      
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: admin.id_admin,
          name: admin.name,
          email: admin.email,
          role: 'admin'
        }
      });
    }

    // Si ce n'est pas un admin, vérifier si c'est un étudiant
    const [students] = await db.promise().query(
      'SELECT * FROM etudiant WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (students.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const student = students[0];
    const validPassword = await bcrypt.compare(password, student.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: student.id_etudiant,
        name: student.name,
        email: student.email,
        role: 'etudiant'
      }
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
});

// Route pour générer des clés pour un admin
router.post('/admin/generate-keys', authController.generateAdminKeys);

// Route de inscription
router.post('/signup', async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    // Vérification si l'email existe déjà
    const [existingUser] = await db.promise().query(
      'SELECT * FROM etudiant WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Génération du code d'activation (6 chiffres)
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertion du nouvel utilisateur
    const [result] = await db.promise().query(
      'INSERT INTO etudiant (name, surname, email, password, code, email_activated, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, surname, email, hashedPassword, activationCode, 0, 1]
    );

    // Envoi de l'email de vérification
    await sendVerificationEmail(email, activationCode);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie. Veuillez vérifier votre email.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'inscription'
    });
  }
});

// Route pour vérifier le code d'activation
router.post('/verify-email', async (req, res) => {
  console.log("Données de vérification reçues:", req.body);

  try {
    const { email, code } = req.body;

    // Vérification du code
    const [user] = await db.promise().query(
      'SELECT id_etudiant, code FROM etudiant WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user[0].code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification incorrect'
      });
    }

    // Mise à jour du statut de vérification
    await db.promise().query(
      'UPDATE etudiant SET email_activated = 1 WHERE id_etudiant = ?',
      [user[0].id_etudiant]
    );

    res.status(200).json({
      success: true,
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
});

module.exports = router;