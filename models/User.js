const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  brukernavn: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  epost: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passord: {
    type: String,
    required: true
  },
  rolle: {
    type: String,
    enum: ['bruker', 'admin'],
    default: 'bruker'
  },
  profilbilde: {
    type: String,
    default: 'default.png'
  },
  opprettetDato: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
