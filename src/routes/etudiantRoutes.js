const express = require('express');
const router = express.Router();
const etudiantController = require('../controllers/etudiantController');

// Route pour récupérer tous les utilisateurs
router.get('/', etudiantController.getAllStudents);

// Route pour créer un utilisateur
router.post('/', etudiantController.createStudent);

// Route pour mettre à jour un utilisateur
router.put('/:id', etudiantController.updateStudent);

// Route pour supprimer un utilisateur
router.delete('/:id', etudiantController.deleteStudent);

// Route pour la "soft delete" des utilisateurs
router.put('/:id/soft-delete', etudiantController.softDeleteStudent);

// Route pour restaurer un utilisateur
router.put('/:id/restore', etudiantController.restoreStudent);

// Route pour obtenir les utilisateurs supprimés
router.get('/trash', etudiantController.getDeletedStudents);

// Route pour inscrire un étudiant
router.post('/register', etudiantController.registerStudent);

// Route pour activer un compte
router.post('/activate', etudiantController.activateAccount);

module.exports = router;