const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Création du dossier uploads si nécessaire
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de multer pour le téléchargement des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Dossier où les fichiers seront stockés
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Vérification que le fichier est un PDF
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Le fichier doit être un PDF."));
    }
    cb(null, true);
  },
});

module.exports = {
  upload,
  uploadsDir
};