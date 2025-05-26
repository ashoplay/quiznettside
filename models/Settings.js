const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'Quiz Nettside'
  },
  contactEmail: {
    type: String,
    default: 'kontakt@quiznettside.no'
  },
  maxQuizzesPerUser: {
    type: Number,
    default: 50
  },
  maxQuestionsPerQuiz: {
    type: Number,
    default: 100
  },
  enableRegistrations: {
    type: Boolean,
    default: true
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  lastBackup: {
    type: Date,
    default: null
  },
  oppdatertAv: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  oppdatertDato: {
    type: Date,
    default: Date.now
  }
});

// Since there's only one settings document, provide a static method to load it
SettingsSchema.statics.getSettings = async function() {
  // Find the first document or create a new one if none exists
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', SettingsSchema);
