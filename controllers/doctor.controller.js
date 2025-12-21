const DoctorService = require('../services/doctor.service');

class DoctorController {
  // Authentification
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await DoctorService.login(email, password);
      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // Inscription
  static async register(req, res) {
    try {
      const doctor = await DoctorService.createDoctor(req.body);
      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès. Attente validation administrateur.',
        data: doctor
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Obtenir profil
  static async getProfile(req, res) {
    try {
      const doctor = await DoctorService.getDoctorById(req.user.id);
      res.status(200).json({
        success: true,
        data: doctor
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mettre à jour profil
  static async updateProfile(req, res) {
    try {
      const doctor = await DoctorService.updateDoctor(req.user.id, req.body);
      
      // Ajouter à l'historique
      await DoctorService.addActionToHistory(req.user.id, 'MISE_A_JOUR_PROFIL', {
        updatedFields: Object.keys(req.body)
      });
      
      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: doctor
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Pour admin: Obtenir tous les médecins
  static async getAllDoctors(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Admin seulement.'
        });
      }
      
      const doctors = await DoctorService.getAllDoctors();
      res.status(200).json({
        success: true,
        data: doctors
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Pour admin: Valider/activer un médecin
  static async activateDoctor(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Admin seulement.'
        });
      }
      
      const { id } = req.params;
      const doctor = await DoctorService.toggleActive(id, true);
      
      res.status(200).json({
        success: true,
        message: 'Médecin activé avec succès',
        data: doctor
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Pour admin: Archiver un médecin
  static async archiveDoctor(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Admin seulement.'
        });
      }
      
      const { id } = req.params;
      const { archived } = req.body;
      
      const doctor = await DoctorService.toggleArchive(id, archived);
      
      res.status(200).json({
        success: true,
        message: archived ? 'Médecin archivé' : 'Médecin désarchivé',
        data: doctor
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Pour admin: Obtenir les statistiques
  static async getStats(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Admin seulement.'
        });
      }
      
      const stats = await DoctorService.getStats();
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

  // Pour admin: Obtenir l'historique d'un médecin
  static async getDoctorHistory(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé. Admin seulement.'
        });
      }
      
      const { id } = req.params;
      const history = await DoctorService.getDoctorHistory(id);
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = DoctorController;