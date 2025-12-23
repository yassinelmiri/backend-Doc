const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  nomComplet: {
    type: String,
    required: true,
    trim: true
  },
  telephone: {
    type: String,
    required: true,
    trim: true
  },
  heureRendezVous: {
    type: String,
    required: true
  },
  heureEstimee: {
    type: String,
    required: true
  },
  termine: {
    type: Boolean,
    default: false
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctorName: {
    type: String,
    default: 'Docteur'
  },
  importFileName: String,
  importDate: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['en_attente', 'en_cours', 'retarde', 'termine'],
    default: 'en_attente'
  },
  smsEnvoye: {
    type: Boolean,
    default: false
  },
  dateSMS: Date,
  messageSMS: String,
  retardMinutes: {
    type: Number,
    default: 0
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);