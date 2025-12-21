const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const doctorSchema = new mongoose.Schema({
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
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false // Doit être validé par admin
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  smsSentCount: {
    type: Number,
    default: 0
  },
  historiqueActions: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
});

// Hachage du mot de passe avant sauvegarde
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Création de l'admin par défaut
doctorSchema.statics.createDefaultAdmin = async function() {
  const adminExists = await this.findOne({ email: 'admin@doc.com' });
  
  if (!adminExists) {
    await this.create({
      nomComplet: 'Administrateur',
      email: 'admin@doc.com',
      password: '0000',
      isAdmin: true,
      isActive: true
    });
    console.log('✅ Admin par défaut créé');
  }
};

// Middleware pour mettre à jour updatedAt
doctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);