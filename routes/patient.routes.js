const express = require('express');
const router = express.Router();
const { PatientController } = require('../controllers/patient.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protection de toutes les routes
router.use(authMiddleware);

// CRUD Patients
router.post('/', PatientController.createPatient);
router.get('/', PatientController.getPatients);
router.get('/stats', PatientController.getStats);
router.get('/:id', PatientController.getPatient);
router.put('/:id', PatientController.updatePatient);
router.delete('/:id', PatientController.deletePatient);

// Import/Export
router.post('/import', PatientController.importPatients);
router.get('/export/csv', PatientController.exportCSV);
router.get('/export/excel', PatientController.exportExcel);

// SMS
router.post('/:id/sms', PatientController.sendSMS);
router.post('/sms/delay-bulk', PatientController.sendBulkDelaySMS);

module.exports = router;