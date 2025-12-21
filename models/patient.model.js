const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },
  heureRendezVous: {
    type: Date,
    required: [true, 'L\'heure du rendez-vous est requise']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirme', 'annule', 'retarde', 'termine'],
    default: 'en_attente'
  },
  smsEnvoye: {
    type: Boolean,
    default: false
  },
  dateSMS: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les recherches
patientSchema.index({ doctorId: 1, heureRendezVous: 1 });
patientSchema.index({ statut: 1 });

// Middleware pour mettre à jour updatedAt
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour vérifier si le rendez-vous est en retard
patientSchema.methods.isRetarde = function() {
  return this.statut === 'retarde';
};

module.exports = mongoose.model('Patient', patientSchema);