const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { beskyttetRute, erAdmin } = require('../middleware/auth');

// Alle admin ruter krever både innlogging og admin-rolle
router.use(beskyttetRute, erAdmin);

// Admin dashboard
router.get('/', adminController.dashboard);

// Brukeradministrasjon
router.get('/brukere', adminController.alleBrukere);
router.get('/brukere/:id', adminController.visBruker);
router.put('/brukere/:id', adminController.oppdaterBruker);
router.delete('/brukere/:id', adminController.slettBruker);

// Quizadministrasjon
router.get('/quizzer', adminController.alleQuizzer);
router.delete('/quizzer/:id', adminController.slettQuiz);

// Aktivitetslogg
router.get('/aktivitetslogg', adminController.aktivitetslogg);

module.exports = router;
