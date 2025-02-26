const authModel = require('../models/auth');

// Authentification
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }

  try {
    const result = await authModel.authenticate(email, password);

    if (!result.success) {
      if (result.notActivated) {
        return res.status(403).json({ message: "Veuillez activer votre compte avant de vous connecter." });
      }
      return res.status(401).json({ message: result.message });
    }

    return res.status(200).json({
      message: result.message,
      role: result.role,
      user: result.user,
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Générer des clés pour un admin
exports.generateAdminKeys = async (req, res) => {
  const { id_admin } = req.body;

  try {
    await authModel.generateAdminKeys(id_admin);
    res.json({ message: "Clés générées et stockées avec succès" });
  } catch (error) {
    console.error("Erreur lors de la génération des clés:", error);
    res.status(500).json({ message: "Erreur lors de la génération des clés" });
  }
};