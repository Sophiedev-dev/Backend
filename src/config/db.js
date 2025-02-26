const mysql = require("mysql2");

// Configuration de la base de données
const dbConfig = {
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // Remplacez par votre mot de passe
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  database: process.env.DB_NAME || "bankmemo",
};

// Création de la connexion MySQL
const db = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
});

// Connexion à la base de données
db.connect((err) => {
  if (err) throw err;
  console.log("Connecté à la base de données MySQL.");
});

module.exports = db;