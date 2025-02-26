const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

// Chargement des variables d'environnement
dotenv.config();

// Import de la connexion à la base de données
const db = require('./src/config/db');

// Import des routes
const etudiantRoutes = require('./src/routes/etudiantRoutes');
const memoireRoutes = require('./src/routes/memoireRoutes');
const authRoutes = require('./src/routes/authRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

// Import des middlewares
const errorHandler = require('./src/middlewares/errorHandler');
const notFound = require('./src/middlewares/notFound');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/users", etudiantRoutes);
app.use("/api/memoire", memoireRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/send-email", emailRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route pour obtenir un fichier
app.get("/uploads/:filename", async (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "uploads", fileName);

  console.log("Requête pour le fichier :", filePath);

  try {
    // Vérifie si le fichier existe
    await require('fs').promises.access(filePath);

    // Définit les en-têtes appropriés
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Access-Control-Allow-Origin", "*"); // Permet l'accès depuis le frontend

    // Stream du fichier
    const stream = require('fs').createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    console.error("Fichier non trouvé :", filePath);
    res.status(404).json({ message: "Fichier non trouvé", filePath });
  }
});

// Middleware pour les routes non trouvées
app.use(notFound);

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});