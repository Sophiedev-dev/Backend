const etudiantModel = require('../models/etudiant');
const { sendEmail, generateActivationCode } = require('../config/email');

// Récupérer tous les étudiants
exports.getAllStudents = async (req, res) => {
  try {
    const students = await etudiantModel.getAllEtudiants();
    res.json({ 
      success: true, 
      users: students 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des utilisateurs." 
    });
  }
};

// Créer un étudiant
exports.createStudent = async (req, res) => {
  const { name, surname, email, password, phonenumber, university, faculty, speciality } = req.body;
  try {
    await etudiantModel.createEtudiant({ name, surname, email, password, phonenumber, university, faculty, speciality });
    res.status(201).json({ 
      success: true, 
      message: "Utilisateur créé avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la création de l'utilisateur." 
    });
  }
};

// Mettre à jour un étudiant
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, surname, email, is_active } = req.body;
  try {
    await etudiantModel.updateEtudiant(id, { name, surname, email, is_active });
    res.json({ message: "Utilisateur mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur." });
  }
};

// Supprimer un étudiant
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await etudiantModel.deleteEtudiant(id);
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur." });
  }
};

// Effectuer une suppression douce (soft delete) d'un étudiant
exports.softDeleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await etudiantModel.softDeleteEtudiant(id);
    res.json({ 
      success: true, 
      message: "Utilisateur déplacé vers la corbeille" 
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la suppression" 
    });
  }
};

// Restaurer un étudiant
exports.restoreStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await etudiantModel.restoreEtudiant(id);
    res.json({ 
      success: true, 
      message: "Utilisateur restauré avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la restauration" 
    });
  }
};

// Récupérer les étudiants supprimés
exports.getDeletedStudents = async (req, res) => {
  try {
    const deletedStudents = await etudiantModel.getDeletedEtudiants();
    res.json({ 
      success: true, 
      users: deletedStudents 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des utilisateurs supprimés" 
    });
  }
};

// Inscription d'un nouvel étudiant
exports.registerStudent = async (req, res) => {
  const { name, surname, email, password } = req.body;

  if (!name || !surname || !email || !password) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    const activationCode = generateActivationCode();
    await etudiantModel.registerEtudiant({ name, surname, email, password }, activationCode);

    // Envoi de l'email avec le code d'activation
    const subject = "Activation de votre compte AmphiMill";
    const text = `Bonjour ${name},\n\nVotre code d'activation est : ${activationCode}\nVeuillez entrer ce code pour activer votre compte.\n\nMerci !`;
    const html = `<p>Bonjour <strong>${name}</strong>,</p>
                  <p>Votre code d'activation est : <strong>${activationCode}</strong></p>
                  <p>Veuillez entrer ce code pour activer votre compte.</p>
                  <p>Merci !</p>`;

    const emailResult = await sendEmail(email, subject, text, html);

    if (!emailResult.success) {
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'email d'activation." });
    }

    res.status(201).json({ message: "Inscription réussie ! Un email de validation a été envoyé." });
  } catch (error) {
    console.error("Erreur lors de l'insertion :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Activation du compte étudiant
exports.activateAccount = async (req, res) => {
  const { email, code } = req.body;
  console.log("Données reçues:", email, code);

  if (!email || !code) {
    return res.status(400).json({ message: "Email et code sont requis." });
  }

  try {
    await etudiantModel.activateEtudiantAccount(email, code);
    res.status(200).json({ message: "Compte activé avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la vérification du code :", error);
    res.status(400).json({ message: "Code incorrect." });
  }
};