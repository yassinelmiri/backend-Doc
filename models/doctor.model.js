const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({

  /** =======================
   *  INFORMATIONS PRINCIPALES
   *  ======================= */
  nomComplet: {
    type: String,
    required: [true, 'Le nom complet est requis'],
    trim: true
  },

  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },

  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: 6
  },

  /** =======================
   *  ADRESSE
   *  ======================= */
  address: {
    type: String,
    trim: true,
    default: ''
  },

  postalCode: {
    type: String,
    trim: true,
    default: ''
  },

  city: {
    type: String,
    trim: true,
    default: ''
  },

  /** =======================
   *  SPÉCIALITÉS
   *  ======================= */
  specialties: {
    type: [String], // ex: ["Cardiologie", "Dermatologie"]
    default: []
  },

  /** =======================
   *  STATUT & RÔLES
   *  ======================= */
  isAdmin: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: false // activé par l'admin
  },

  isArchived: {
    type: Boolean,
    default: false
  },

  /** =======================
   *  SUIVI & HISTORIQUE
   *  ======================= */
  lastLogin: {
    type: Date
  },

  smsSentCount: {
    type: Number,
    default: 0
  },

  historiqueActions: [
    {
      action: {
        type: String
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: mongoose.Schema.Types.Mixed
    }
  ],

  /** =======================
   *  DATES
   *  ======================= */
  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

/** =======================
 *  HASH PASSWORD
 *  ======================= */
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/** =======================
 *  UPDATE updatedAt
 *  ======================= */
doctorSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

/** =======================
 *  COMPARE PASSWORD
 *  ======================= */
doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/** =======================
 *  CREATE DEFAULT ADMIN
 *  ======================= */
doctorSchema.statics.createDefaultAdmin = async function () {
  const adminExists = await this.findOne({ email: 'admin@doc.com' });

  if (!adminExists) {
    await this.create({
      nomComplet: 'Administrateur',
      email: 'admin@doc.com',
      password: '0000',
      isAdmin: true,
      isActive: true,
      specialties: []
    });

    console.log('✅ Admin par défaut créé');
  }
};

module.exports = mongoose.model('Doctor', doctorSchema);
 