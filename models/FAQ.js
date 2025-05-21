const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
  spørsmål: {
    type: String,
    required: true,
    trim: true
  },
  svar: {
    type: String,
    required: true,
    trim: true
  },
  rekkefølge: {
    type: Number,
    default: 0
  },
  aktiv: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('FAQ', FAQSchema);
