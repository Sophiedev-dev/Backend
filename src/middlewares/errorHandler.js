// Middleware de gestion des erreurs
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
  };
  
  module.exports = errorHandler;