const PatientService = require('../services/patient.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers CSV et Excel sont autorisés'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

class PatientController {
  // Créer un patient
  static async createPatient(req, res) {
    try {
      const patient = await PatientService.createPatient(req.body, req.user.id);
      
      // Ajouter à l'historique du médecin
      const DoctorService = require('../services/doctor.service');
      await DoctorService.addActionToHistory(req.user.id, 'CREATION_PATIENT', {
        patientId: patient._id,
        patientNom: patient.nom
      });
      
      res.status(201).json({
        success: true,
        message: 'Patient créé avec succès',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtenir tous les patients du médecin
  static async getPatients(req, res) {
    try {
      const patients = await PatientService.getPatientsByDoctor(req.user.id, req.query);
      res.status(200).json({
        success: true,
        count: patients.length,
        data: patients
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtenir un patient spécifique
  static async getPatient(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.getPatientById(id, req.user.id);
      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mettre à jour un patient
  static async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.updatePatient(id, req.user.id, req.body);
      
      // Ajouter à l'historique
      const DoctorService = require('../services/doctor.service');
      await DoctorService.addActionToHistory(req.user.id, 'MODIFICATION_PATIENT', {
        patientId: patient._id,
        patientNom: patient.nom,
        updatedFields: Object.keys(req.body)
      });
      
      res.status(200).json({
        success: true,
        message: 'Patient mis à jour avec succès',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Supprimer un patient
  static async deletePatient(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.deletePatient(id, req.user.id);
      
      // Ajouter à l'historique
      const DoctorService = require('../services/doctor.service');
      await DoctorService.addActionToHistory(req.user.id, 'SUPPRESSION_PATIENT', {
        patientId: patient._id,
        patientNom: patient.nom
      });
      
      res.status(200).json({
        success: true,
        message: 'Patient supprimé avec succès',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Envoyer SMS
  static async sendSMS(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      const result = await PatientService.sendSMS(id, req.user.id, message);
      
      // Ajouter à l'historique
      const DoctorService = require('../services/doctor.service');
      await DoctorService.addActionToHistory(req.user.id, 'ENVOI_SMS', {
        patientId: id,
        message: message
      });
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Exporter en CSV
  static async exportCSV(req, res) {
    try {
      const csv = await PatientService.exportToCSV(req.user.id);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=patients.csv');
      res.send(csv);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Exporter en Excel
  static async exportExcel(req, res) {
    try {
      const excelBuffer = await PatientService.exportToExcel(req.user.id);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=patients.xlsx');
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Importer depuis fichier
  static async importPatients(req, res) {
    try {
      upload.single('file')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }
        
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Veuillez sélectionner un fichier'
          });
        }
        
        try {
          const patients = await PatientService.importFromFile(req.file.path, req.user.id);
          
          // Nettoyer le fichier temporaire
          fs.unlinkSync(req.file.path);
          
          // Ajouter à l'historique
          const DoctorService = require('../services/doctor.service');
          await DoctorService.addActionToHistory(req.user.id, 'IMPORT_PATIENTS', {
            file: req.file.originalname,
            patientsCount: patients.length
          });
          
          res.status(200).json({
            success: true,
            message: `${patients.length} patients importés avec succès`,
            data: patients
          });
        } catch (error) {
          // Nettoyer le fichier en cas d'erreur
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          res.status(400).json({
            success: false,
            message: error.message
          });
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Marquer comme retardé
  static async markAsDelayed(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.markAsDelayed(id, req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Rendez-vous marqué comme retardé',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = { PatientController, upload };