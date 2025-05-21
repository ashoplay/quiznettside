const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  bruker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  poengOppnådd: {
    type: Number,
    required: true
  },
  maksPoeng: {
    type: Number,
    required: true
  },
  prosentRiktig: {
    type: Number,
    required: true
  },
  tidBrukt: {
    type: Number // Tid brukt i sekunder
  },
  fullført: {
    type: Boolean,
    default: true
  },
  dato: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
