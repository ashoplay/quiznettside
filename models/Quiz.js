const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  tittel: {
    type: String,
    required: true,
    trim: true
  },
  beskrivelse: {
    type: String,
    required: true
  },
  opprettetAv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  kategori: {
    type: String,
    enum: ['Utvikling og standardisering', 'Planlegging og dokumentasjon', 'Teknologiforståelse', 'Annet'],
    required: true
  },
  spørsmål: [{
    tekst: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['flervalg', 'sant_usant', 'tekstsvar'],
      required: true
    },
    alternativer: [{
      tekst: { type: String },
      erRiktig: { type: Boolean, default: false }
    }],
    riktigSvar: { type: String }, // For tekstsvar type
    poeng: {
      type: Number,
      default: 1
    },
    bilde: {
      type: String
    }
  }],
  erPublisert: {
    type: Boolean,
    default: true
  },
  opprettetDato: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);
