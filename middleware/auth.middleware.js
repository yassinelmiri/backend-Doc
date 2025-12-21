const jwt = require('jsonwebtoken');
const Doctor = require('../models/doctor.model');

const authMiddleware = async (req, res, next) => {
  try {
    // Routes publiques - pas besoin d'authentification
    const publicRoutes = [
      '/api/doctors/login',
      '/api/doctors/register'
    ];
    
    // Vérifier si la route est publique
    if (publicRoutes.includes(req.path)) {
      return next(); // Passer au contrôleur
    }
    
    // Récupérer le token depuis l'en-tête
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Token manquant');
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Chercher le médecin
    const doctor = await Doctor.findOne({ 
      _id: decoded.id,
      isActive: true 
    }).select('-password');
    
    if (!doctor) {
      throw new Error('Utilisateur non trouvé ou non activé');
    }
    
    // Ajouter le médecin à la requête
    req.user = doctor;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Veuillez vous authentifier'
    });
  }
};

module.exports = authMiddleware;