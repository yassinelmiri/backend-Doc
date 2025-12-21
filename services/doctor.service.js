const Doctor = require('../models/doctor.model');
const Patient = require('../models/patient.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xlsx = require('xlsx');
const { Parser } = require('json2csv');

class DoctorService {
  // Authentification
  static async login(email, password) {
    try {
      const doctor = await Doctor.findOne({ email });
      
      if (!doctor) {
        throw new Error('Doctor non trouvé');
      }
      
      if (!doctor.isActive && !doctor.isAdmin) {
        throw new Error('Compte non activé. Contactez l\'administrateur.');
      }
      
      const isMatch = await doctor.comparePassword(password);
      
      if (!isMatch) {
        throw new Error('Mot de passe incorrect');
      }
      
      // Mettre à jour lastLogin
      doctor.lastLogin = new Date();
      await doctor.save();
      
      // Générer token
      const token = jwt.sign(
        { id: doctor._id, email: doctor.email, isAdmin: doctor.isAdmin },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );
      
      return { doctor, token };
    } catch (error) {
      throw error;
    }
  }

  // Créer un médecin
  static async createDoctor(data) {
    try {
      const doctor = new Doctor(data);
      return await doctor.save();
    } catch (error) {
      throw error;
    }
  }

  // Obtenir tous les médecins (pour admin)
  static async getAllDoctors() {
    try {
      return await Doctor.find().select('-password');
    } catch (error) {
      throw error;
    }
  }

  // Obtenir un médecin par ID
  static async getDoctorById(id) {
    try {
      const doctor = await Doctor.findById(id).select('-password');
      if (!doctor) throw new Error('Doctor non trouvé');
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un médecin
  static async updateDoctor(id, data) {
    try {
      // Ne pas permettre la modification de isAdmin via cette méthode
      if (data.isAdmin !== undefined) {
        delete data.isAdmin;
      }
      
      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!doctor) throw new Error('Doctor non trouvé');
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Archiver/désarchiver un médecin
  static async toggleArchive(id, isArchived) {
    try {
      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: { isArchived } },
        { new: true }
      ).select('-password');
      
      if (!doctor) throw new Error('Doctor non trouvé');
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Activer/désactiver un médecin
  static async toggleActive(id, isActive) {
    try {
      const doctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: { isActive } },
        { new: true }
      ).select('-password');
      
      if (!doctor) throw new Error('Doctor non trouvé');
      return doctor;
    } catch (error) {
      throw error;
    }
  }

  // Statistiques pour admin
  static async getStats() {
    try {
      const totalDoctors = await Doctor.countDocuments();
      const activeDoctors = await Doctor.countDocuments({ isActive: true });
      const archivedDoctors = await Doctor.countDocuments({ isArchived: true });
      const totalPatients = await Patient.countDocuments();
      
      // Total SMS envoyés
      const doctors = await Doctor.aggregate([
        {
          $group: {
            _id: null,
            totalSMS: { $sum: '$smsSentCount' }
          }
        }
      ]);
      
      const totalSMS = doctors.length > 0 ? doctors[0].totalSMS : 0;
      
      return {
        totalDoctors,
        activeDoctors,
        archivedDoctors,
        totalPatients,
        totalSMS
      };
    } catch (error) {
      throw error;
    }
  }

  // Ajouter une action à l'historique
  static async addActionToHistory(doctorId, action, details = {}) {
    try {
      await Doctor.findByIdAndUpdate(
        doctorId,
        {
          $push: {
            historiqueActions: {
              action,
              details,
              timestamp: new Date()
            }
          }
        }
      );
    } catch (error) {
      console.error('Erreur ajout historique:', error);
    }
  }

  // Obtenir l'historique d'un médecin
  static async getDoctorHistory(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId)
        .select('historiqueActions nomComplet email')
        .sort({ 'historiqueActions.timestamp': -1 });
      
      if (!doctor) throw new Error('Doctor non trouvé');
      return doctor.historiqueActions;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DoctorService;