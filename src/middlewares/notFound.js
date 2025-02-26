// Middleware pour les routes non trouvées
const notFound = (req, res, next) => {
    res.status(404).send(`
      <html>
        <head>
          <title>Page non trouvée</title>
        </head>
        <body>
          <h1>Erreur 404 : Page non trouvée</h1>
          <p>La ressource demandée est introuvable sur le serveur.</p>
        </body>
      </html>
    `);
  };
  
  module.exports = notFound;