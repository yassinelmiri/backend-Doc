const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const xlsx = require('xlsx');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

class PatientService {
  // Créer un patient
  static async createPatient(data, doctorId) {
    try {
      const patientData = {
        ...data,
        doctorId
      };
      
      const patient = new Patient(patientData);
      return await patient.save();
    } catch (error) {
      throw error;
    }
  }

  // Obtenir tous les patients d'un médecin
  static async getPatientsByDoctor(doctorId, filters = {}) {
    try {
      const query = { doctorId };
      
      // Appliquer les filtres
      if (filters.statut) {
        query.statut = filters.statut;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.heureRendezVous = {};
        if (filters.dateFrom) {
          query.heureRendezVous.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          query.heureRendezVous.$lte = new Date(filters.dateTo);
        }
      }
      
      return await Patient.find(query)
        .sort({ heureRendezVous: 1 })
        .populate('doctorId', 'nomComplet email');
    } catch (error) {
      throw error;
    }
  }

  // Obtenir un patient par ID
  static async getPatientById(id, doctorId) {
    try {
      const patient = await Patient.findOne({ _id: id, doctorId });
      if (!patient) throw new Error('Patient non trouvé');
      return patient;
    } catch (error) {
      throw error;
    }
  }

  // Mettre à jour un patient
  static async updatePatient(id, doctorId, data) {
    try {
      const patient = await Patient.findOneAndUpdate(
        { _id: id, doctorId },
        { $set: data },
        { new: true, runValidators: true }
      );
      
      if (!patient) throw new Error('Patient non trouvé');
      return patient;
    } catch (error) {
      throw error;
    }
  }

  // Supprimer un patient
  static async deletePatient(id, doctorId) {
    try {
      const patient = await Patient.findOneAndDelete({ _id: id, doctorId });
      if (!patient) throw new Error('Patient non trouvé');
      return patient;
    } catch ( error) {
      throw error;
    }
  }

  // Envoyer SMS
  static async sendSMS(patientId, doctorId, message) {
    try {
      const patient = await Patient.findOne({ _id: patientId, doctorId });
      if (!patient) throw new Error('Patient non trouvé');
      
      // Ici, vous utiliseriez Twilio pour envoyer le SMS
      // Exemple avec Twilio:
      /*
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: patient.telephone
      });
      */
      
      // Pour le moment, simulons l'envoi
      console.log(`📱 SMS envoyé à ${patient.telephone}: ${message}`);
      
      // Mettre à jour le patient
      patient.smsEnvoye = true;
      patient.dateSMS = new Date();
      await patient.save();
      
      // Incrémenter le compteur SMS du médecin
      await Doctor.findByIdAndUpdate(doctorId, {
        $inc: { smsSentCount: 1 }
      });
      
      return { success: true, message: 'SMS envoyé avec succès' };
    } catch (error) {
      throw error;
    }
  }

  // Exporter les patients en CSV
  static async exportToCSV(doctorId) {
    try {
      const patients = await Patient.find({ doctorId })
        .select('nom telephone email heureRendezVous statut notes')
        .lean();
      
      const fields = ['nom', 'telephone', 'email', 'heureRendezVous', 'statut', 'notes'];
      const parser = new Parser({ fields });
      const csv = parser.parse(patients);
      
      return csv;
    } catch (error) {
      throw error;
    }
  }

  // Exporter les patients en Excel
  static async exportToExcel(doctorId) {
    try {
      const patients = await Patient.find({ doctorId })
        .select('nom telephone email heureRendezVous statut notes')
        .lean();
      
      // Convertir les dates en string
      const formattedPatients = patients.map(patient => ({
        ...patient,
        heureRendezVous: patient.heureRendezVous.toISOString()
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(formattedPatients);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Patients');
      
      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return excelBuffer;
    } catch (error) {
      throw error;
    }
  }

  // Importer des patients depuis un fichier
  static async importFromFile(filePath, doctorId) {
    try {
      const extension = path.extname(filePath).toLowerCase();
      let patientsData = [];
      
      if (extension === '.csv') {
        // Importer CSV
        const csvData = fs.readFileSync(filePath, 'utf8');
        const rows = csvData.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i].trim()) {
            const values = rows[i].split(',');
            const patient = {};
            
            headers.forEach((header, index) => {
              patient[header] = values[index] ? values[index].trim() : '';
            });
            
            patientsData.push(patient);
          }
        }
      } else if (extension === '.xlsx' || extension === '.xls') {
        // Importer Excel
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        patientsData = xlsx.utils.sheet_to_json(worksheet);
      }
      
      // Créer les patients
      const createdPatients = [];
      for (const data of patientsData) {
        try {
          const patient = await this.createPatient({
            nom: data.nom,
            telephone: data.telephone,
            email: data.email,
            heureRendezVous: new Date(data.heureRendezVous),
            notes: data.notes || ''
          }, doctorId);
          
          createdPatients.push(patient);
        } catch (error) {
          console.error(`Erreur création patient ${data.nom}:`, error.message);
        }
      }
      
      return createdPatients;
    } catch (error) {
      throw error;
    }
  }

  // Marquer un rendez-vous comme retardé
  static async markAsDelayed(patientId, doctorId) {
    try {
      const patient = await Patient.findOneAndUpdate(
        { _id: patientId, doctorId },
        { $set: { statut: 'retarde' } },
        { new: true }
      );
      
      if (!patient) throw new Error('Patient non trouvé');
      return patient;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PatientService;