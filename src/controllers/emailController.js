const { sendEmail } = require('../config/email');

// Envoyer un email
exports.sendEmailController = async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }
  console.log(req.body);

  try {
    const result = await sendEmail(to, subject, text, html);
    
    if (!result.success) {
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'email." });
    }
    
    res.status(200).json({ message: "Email envoyé avec succès !", info: result.info });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email." });
  }
};