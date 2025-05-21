const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  tekst: {
    type: String,
    required: true
  },
  alternativer: [{
    tekst: String,
    erRiktig: Boolean
  }],
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  opprettetAv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  opprettetDato: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', QuestionSchema);
