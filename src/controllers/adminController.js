const db = require('../config/db');

// Récupérer les statistiques pour l'administration
exports.getAdminStats = async (req, res) => {
  try {
    // Statistiques sur les mémoires
    const [total] = await db.promise().query("SELECT COUNT(*) AS total FROM memoire");
    const [validated] = await db.promise().query("SELECT COUNT(*) AS validated FROM memoire WHERE status = 'validated'");
    const [rejected] = await db.promise().query("SELECT COUNT(*) AS rejected FROM memoire WHERE status = 'rejected'");
    const [pending] = await db.promise().query("SELECT COUNT(*) AS pending FROM memoire WHERE status = 'pending'");

    // Statistiques sur les utilisateurs
    const [totalUsers] = await db.promise().query("SELECT COUNT(*) AS totalUsers FROM etudiant");
    const [activeUsers] = await db.promise().query("SELECT COUNT(*) AS activeUsers FROM etudiant WHERE is_active = 1");

    res.json({
      total: total[0].total,
      validated: validated[0].validated,
      rejected: rejected[0].rejected,
      pending: pending[0].pending,
      totalUsers: totalUsers[0].totalUsers,
      activeUsers: activeUsers[0].activeUsers
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques." });
  }
};

// Obtenir les seuils de similarité
exports.getSimilarityThreshold = async (req, res) => {
  try {
    // Vérifier si les seuils existent déjà dans la base de données
    const [thresholds] = await db.promise().query(
      "SELECT * FROM app_settings WHERE setting_key IN ('similarity_warning_threshold', 'similarity_danger_threshold')"
    );
    
    // Si aucun seuil n'est trouvé, utiliser les valeurs par défaut
    if (thresholds.length === 0) {
      return res.json({
        success: true,
        warningThreshold: 50,
        dangerThreshold: 70
      });
    }
    
    // Extraire les valeurs des seuils
    const warningThreshold = thresholds.find(t => t.setting_key === 'similarity_warning_threshold')?.setting_value || 50;
    const dangerThreshold = thresholds.find(t => t.setting_key === 'similarity_danger_threshold')?.setting_value || 70;
    
    res.json({
      success: true,
      warningThreshold: parseInt(warningThreshold),
      dangerThreshold: parseInt(dangerThreshold)
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des seuils de similarité:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des seuils de similarité."
    });
  }
};

// Mettre à jour les seuils de similarité
exports.updateSimilarityThreshold = async (req, res) => {
  try {
    const { warningThreshold, dangerThreshold } = req.body;
    
    // Validation basique
    if (warningThreshold >= dangerThreshold) {
      return res.status(400).json({
        success: false,
        message: "Le seuil d'alerte doit être inférieur au seuil de danger"
      });
    }
    
    // Vérifier si les seuils existent déjà
    const [existingWarningThreshold] = await db.promise().query(
      "SELECT * FROM app_settings WHERE setting_key = 'similarity_warning_threshold'"
    );
    
    const [existingDangerThreshold] = await db.promise().query(
      "SELECT * FROM app_settings WHERE setting_key = 'similarity_danger_threshold'"
    );
    
    // Mise à jour ou insertion du seuil d'alerte
    if (existingWarningThreshold.length > 0) {
      await db.promise().query(
        "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'similarity_warning_threshold'",
        [warningThreshold]
      );
    } else {
      await db.promise().query(
        "INSERT INTO app_settings (setting_key, setting_value) VALUES ('similarity_warning_threshold', ?)",
        [warningThreshold]
      );
    }
    
    // Mise à jour ou insertion du seuil de danger
    if (existingDangerThreshold.length > 0) {
      await db.promise().query(
        "UPDATE app_settings SET setting_value = ? WHERE setting_key = 'similarity_danger_threshold'",
        [dangerThreshold]
      );
    } else {
      await db.promise().query(
        "INSERT INTO app_settings (setting_key, setting_value) VALUES ('similarity_danger_threshold', ?)",
        [dangerThreshold]
      );
    }
    
    res.json({
      success: true,
      message: "Seuils de similarité mis à jour avec succès",
      warningThreshold,
      dangerThreshold
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des seuils de similarité:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des seuils de similarité."
    });
  }
};