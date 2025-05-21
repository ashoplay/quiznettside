const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { beskyttetRute, erAdmin } = require('../middleware/auth');

// Offentlige ruter
router.get('/', quizController.alleQuizzer);

// Beskyttede ruter (kun for innloggede brukere)
router.get('/mine/quizzer', beskyttetRute, quizController.mineQuizzer);
router.get('/create', beskyttetRute, quizController.visSkapQuiz);
router.post('/create', beskyttetRute, quizController.opprettQuiz);

// Admin ruter
router.delete('/admin/:id', beskyttetRute, erAdmin, quizController.adminSlettQuiz);

// Parameterized routes - these must come AFTER specific paths
router.get('/:id', quizController.visQuiz);
router.get('/:id/ta', quizController.taQuiz);
router.post('/:id/svar', beskyttetRute, quizController.leverSvar);
router.get('/:id/rediger', beskyttetRute, quizController.visRedigerQuiz);
router.get('/:id/statistikk', beskyttetRute, quizController.visStatistikk);
router.put('/:id', beskyttetRute, quizController.oppdaterQuiz);
router.delete('/:id', beskyttetRute, quizController.slettQuiz);

module.exports = router;
