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
  origin: [
    'http://localhost:3000',
    'https://8eec-129-0-205-51.ngrok-free.app',
    'https://projetsoutenance-al7l.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept']
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

// Mock route for similarity data - For demo purposes
app.get("/api/memoire/:id/similarity", async (req, res) => {
  const memoireId = req.params.id;
  
  // Get configured thresholds
  let warningThreshold = 0;
  let dangerThreshold = 0;
  
  try {
    const [thresholds] = await db.promise().query(
      "SELECT * FROM app_settings WHERE setting_key IN ('similarity_warning_threshold', 'similarity_danger_threshold')"
    );
    
    if (thresholds.length > 0) {
      const warningConfig = thresholds.find(t => t.setting_key === 'similarity_warning_threshold');
      const dangerConfig = thresholds.find(t => t.setting_key === 'similarity_danger_threshold');
      
      warningThreshold = parseInt(warningConfig?.setting_value) || 0;
      dangerThreshold = parseInt(dangerConfig?.setting_value) || 0;
    }
  } catch (error) {
    console.error('Error fetching similarity thresholds:', error);
    return res.status(500).json({ success: false, message: 'Error fetching thresholds' });
  }
  
  // Mock similarity percentage (for demonstration)
  const mockSimilarity = 75;
  
  // Determine level based on configured thresholds
  let level, color, message;
  
  if (mockSimilarity >= dangerThreshold) {
    level = 'danger';
    color = 'red';
    message = 'Taux élevé de similarité avec plusieurs mémoires';
  } else if (mockSimilarity >= warningThreshold) {
    level = 'warning';
    color = 'orange';
    message = 'Similarité modérée détectée avec d\'autres mémoires';
  } else {
    level = 'success';
    color = 'green';
    message = 'Faible taux de similarité, niveau acceptable';
  }
  
  // Mock data for demonstration
  const mockData = {
    success: true,
    results: [
      { libelle: "Impact des réseaux sociaux sur la communication", name: "Impact des réseaux sociaux sur la communication", similarity: 80 },
      { libelle: "L'évolution de la communication digitale", name: "L'évolution de la communication digitale", similarity: 65 }
    ],
    status: {
      level: level,
      percentage: mockSimilarity,
      color: color,
      message: message
    }
  };
  
  setTimeout(() => {
    res.json(mockData);
  }, 1000); // Add a delay to simulate processing
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