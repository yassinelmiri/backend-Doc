const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration Mongoose pour Vercel
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 30000);

// Variable pour suivre l’état MongoDB
let mongoStatus = '❌ MongoDB non connecté';

// Fonction de connexion MongoDB optimisée pour Vercel
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB déjà connecté');
      mongoStatus = '✅ MongoDB connecté';
      return;
    }

    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://docnotif:P6cqZYX9333WTR23@cluster0.m6ao73h.mongodb.net/?appName=Cluster0',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
      }
    );

    mongoStatus = '✅ MongoDB connecté';
    console.log(mongoStatus);
  } catch (err) {
    mongoStatus = '❌ Erreur MongoDB';
    console.error('Erreur de connexion MongoDB:', err);
  }
};

// Connexion MongoDB au démarrage
connectDB();

// Gestion des erreurs de connexion MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err);
  mongoStatus = '❌ Erreur MongoDB';
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté');
  mongoStatus = '❌ MongoDB déconnecté';
});

// Tentative de reconnexion
mongoose.connection.on('disconnected', () => {
  setTimeout(() => {
    console.log('🔄 Tentative de reconnexion MongoDB...');
    connectDB();
  }, 5000);
});

// Routes API
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/patients', require('./routes/patient.routes'));

// Route racine (status serveur + MongoDB)
app.get('/', async (req, res) => {
  try {
    // Vérifie si MongoDB est connecté
    const isConnected = mongoose.connection.readyState === 1;
    
    if (!isConnected) {
      await connectDB();
    }
    
    res.send(`
      🚀 Serveur DocNoti en marche !<br/>
      📦 Statut base de données : <b>${mongoStatus}</b><br/>
      📍 Environnement : ${process.env.NODE_ENV || 'production'}<br/>
      🕒 Dernière vérification : ${new Date().toLocaleTimeString()}
    `);
  } catch (error) {
    res.send(`
      🚀 Serveur DocNoti en marche !<br/>
      📦 Statut base de données : <b>❌ Erreur MongoDB - Reconnexion en cours</b><br/>
      📍 Environnement : ${process.env.NODE_ENV || 'production'}
    `);
  }
});

// Route de santé (pour Vercel)
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'production'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'production' ? 'Erreur interne' : err.message
  });
});

// Export pour Vercel (important !)
if (process.env.NODE_ENV === 'production') {
  // Pour Vercel serverless
  module.exports = app;
} else {
  // Pour le développement local
  app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  });
}