const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "sophiamba17@gmail.com",
    pass: process.env.EMAIL_PASS || "uomg lvjg kgso ihib"
  }
});

// Function to send an email with custom template
const sendEmail = async (to, subject, text, html) => {
  const mailOptions = {
    from: "AmphiMill <sophiamba17@gmail.com>",
    to,
    subject,
    text: text || '', // Fallback plain text
    html: html || '' // HTML content
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé :", info.response);
    return { success: true, info };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
    return { success: false, error };
  }
};

// Specific function for account verification
const sendVerificationEmail = async (to, code) => {
  return sendEmail(
    to,
    'Vérification de votre compte',
    `Votre code de vérification est : ${code}`,
    `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Vérification de votre compte</h2>
        <p>Voici votre code de vérification :</p>
        <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${code}</h1>
        <p>Ce code est valable pendant 10 minutes.</p>
      </div>
    `
  );
};

module.exports = {
  transporter,
  sendEmail,
  sendVerificationEmail
};