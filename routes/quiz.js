const express = require('express');
const router = express.Router();
const { getQuizById } = require('../utils/quizUtils'); // Assuming this utility function exists
const session = require('express-session');

// Add body parser middleware
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

// Middleware to set up session
router.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Route to handle quiz submission
router.post('/submit', (req, res) => {
  try {
    console.log('Quiz submission received in routes:', req.body);
    
    const answers = req.body;
    console.log('Raw answers data:', JSON.stringify(answers));
    
    // Validate that we received proper answer data
    if (!answers || Object.keys(answers).length === 0) {
      console.error('No answers received in submission');
      return res.status(400).send('Ingen svar mottatt. Vennligst prøv igjen.');
    }
    
    // Process answers and calculate score
    const quizId = req.body.quizId || req.query.quizId;
    const quiz = getQuizById(quizId); // Implement this function based on your setup
    
    if (!quiz) {
      return res.status(404).send('Quiz not found');
    }
    
    let score = 0;
    const results = quiz.questions.map(question => {
      // Improved answer extraction - check for both formats 
      // (question-X format and svar[X] format)
      let userAnswer = answers[`question-${question.id}`];
      if (userAnswer === undefined) {
        // Try the alternative format
        userAnswer = answers[`svar[${question.id}]`];
      }
      
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.points || 1;
      }
      
      return {
        question: question.text,
        userAnswer: userAnswer || null,
        correctAnswer: question.correctAnswer,
        points: question.points || 1,
        isCorrect
      };
    });
    
    // Store results (to session, database, etc.)
    req.session.quizResults = {
      score,
      totalPoints: quiz.questions.reduce((sum, q) => sum + (q.points || 1), 0),
      results
    };
    
    res.redirect('/quiz/results');
  } catch (error) {
    console.error('Error processing quiz submission:', error);
    res.status(500).send('Det oppstod en feil. Vennligst prøv igjen.');
  }
});

module.exports = router;