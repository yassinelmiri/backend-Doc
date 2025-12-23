const PatientService = require('../services/patient.service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration Multer
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
      cb(new Error('Seuls les fichiers CSV et Excel sont autorisés (.csv, .xlsx, .xls)'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Créer le middleware upload une seule fois
const uploadMiddleware = upload.single('file'); // IMPORTANT: 'file' doit correspondre au nom du champ dans Postman

class PatientController {
  // Créer un patient
  static async createPatient(req, res) {
    try {
      const patient = await PatientService.createPatient(req.body, req.user.id);
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

  // Obtenir les patients
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

  // Importer depuis fichier - VERSION CORRIGÉE
  static async importPatients(req, res) {
    // Utiliser le middleware upload
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Erreur upload:', err.message);
        return res.status(400).json({
          success: false,
          message: err.message.includes('Unexpected field') 
            ? 'Le champ du fichier doit s\'appeler "file"' 
            : err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Veuillez sélectionner un fichier'
        });
      }

      console.log('Fichier uploadé:', req.file);
      console.log('Doctor ID:', req.user.id);

      try {
        const patients = await PatientService.importFromFile(
          req.file.path, 
          req.user.id, 
          req.file.originalname
        );

        console.log(`${patients.length} patients importés avec succès`);

        // Nettoyer le fichier
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
          success: true,
          message: `${patients.length} patients importés avec succès`,
          data: patients
        });
      } catch (error) {
        console.error('Erreur import:', error.message);
        // Nettoyer en cas d'erreur
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    });
  }

  // Exporter en CSV
  static async exportCSV(req, res) {
    try {
      const csvContent = await PatientService.exportToCSV(req.user.id);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patients_${Date.now()}.csv`);
      res.send(csvContent);
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
      res.setHeader('Content-Disposition', `attachment; filename=patients_${Date.now()}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Envoyer SMS à un patient
  static async sendSMS(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      const result = await PatientService.sendSMS(id, req.user.id, message);
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Envoyer SMS en masse pour retard
  static async sendBulkDelaySMS(req, res) {
    try {
      const result = await PatientService.sendBulkDelaySMS(req.user.id);
      
      res.status(200).json({
        success: true,
        message: `SMS envoyés: ${result.smsSent}/${result.delayedPatients} patients`,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mettre à jour patient
  static async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.updatePatient(id, req.user.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Patient mis à jour',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Supprimer patient
  static async deletePatient(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.deletePatient(id, req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Patient supprimé',
        data: patient
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtenir un patient
  static async getPatient(req, res) {
    try {
      const { id } = req.params;
      const patients = await PatientService.getPatientsByDoctor(req.user.id);
      const patient = patients.find(p => p._id.toString() === id);
      
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient non trouvé'
        });
      }
      
      res.status(200).json({
        success: true,
        data: patient
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Statistiques
  static async getStats(req, res) {
    try {
      const patients = await PatientService.getPatientsByDoctor(req.user.id);
      
      const stats = {
        total: patients.length,
        en_attente: patients.filter(p => p.statut === 'en_attente').length,
        en_cours: patients.filter(p => p.statut === 'en_cours').length,
        retarde: patients.filter(p => p.statut === 'retarde').length,
        termine: patients.filter(p => p.statut === 'termine').length,
        smsEnvoye: patients.filter(p => p.smsEnvoye).length
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = { PatientController, uploadMiddleware };