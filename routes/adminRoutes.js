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

// Spørsmålsadministrasjon
router.get('/sporsmal', adminController.alleSporsmal);
router.get('/sporsmal/:id', adminController.visSporsmal);
router.get('/sporsmal/:id/rediger', adminController.visRedigerSporsmal);
router.put('/sporsmal/:id', adminController.oppdaterSporsmal);
router.delete('/sporsmal/:id', adminController.slettSporsmal);

// Systeminnstillinger
router.get('/system', adminController.systemInnstillinger);
router.post('/system', adminController.oppdaterSystemInnstillinger);
router.post('/system/backup', adminController.taSikkerhetskopi);
router.post('/system/restore', adminController.gjenopprettFraSikkerhetskopi);

// Aktivitetslogg
router.get('/aktivitetslogg', adminController.aktivitetslogg);
router.post('/aktivitetslogg/eksport', adminController.eksporterAktivitetslogg);
router.delete('/aktivitetslogg/slett', adminController.slettGamleAktiviteter);

module.exports = router;
