const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctor.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Routes publiques (sans middleware)
router.post('/login', DoctorController.login);
router.post('/register', DoctorController.register);

// Routes protégées (avec middleware)
router.use(authMiddleware); // Toutes les routes suivantes sont protégées

// Routes protégées (médecin)
router.get('/profile', DoctorController.getProfile);
router.put('/profile', DoctorController.updateProfile);

// Routes admin
router.get('/all', DoctorController.getAllDoctors);
router.put('/:id/activate', DoctorController.activateDoctor);
router.put('/:id/archive', DoctorController.archiveDoctor);
router.get('/stats', DoctorController.getStats);
router.get('/:id/history', DoctorController.getDoctorHistory);

module.exports = router;