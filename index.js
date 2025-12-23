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

// Variable pour suivre l’état MongoDB
let mongoStatus = '❌ MongoDB non connecté';

// Connexion MongoDB
mongoose.connect(
  'mongodb+srv://docnotif:P6cqZYX9333WTR23@cluster0.m6ao73h.mongodb.net/?appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
.then(() => {
  mongoStatus = '✅ MongoDB connecté';
  console.log(mongoStatus);
})
.catch(err => {
  mongoStatus = '❌ Erreur MongoDB';
  console.error('Erreur de connexion MongoDB:', err);
});

// Routes API
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/patients', require('./routes/patient.routes'));

// Route racine (status serveur + MongoDB)
app.get('/', (req, res) => {
  res.send(`
    🚀 Serveur DocNoti en marche !<br/>
    📦 Statut base de données : <b>${mongoStatus}</b>
  `);
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
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
