const express = require('express');
const router = express.Router();
const { PatientController, upload } = require('../controllers/patient.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Middleware d'authentification
router.use(authMiddleware);

// Routes CRUD patients
router.post('/', PatientController.createPatient);
router.get('/', PatientController.getPatients);
router.get('/:id', PatientController.getPatient);
router.put('/:id', PatientController.updatePatient);
router.delete('/:id', PatientController.deletePatient);

// Routes SMS
router.post('/:id/sms', PatientController.sendSMS);
router.put('/:id/delay', PatientController.markAsDelayed);

// Routes export/import
router.get('/export/csv', PatientController.exportCSV);
router.get('/export/excel', PatientController.exportExcel);
router.post('/import', PatientController.importPatients);

module.exports = router;