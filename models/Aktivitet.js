const mongoose = require('mongoose');

const AktivitetSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      // User-related
      'user_login',
      'user_register',
      'user_password_change',
      'user_profile_update',
      
      // Quiz-related
      'quiz_create',
      'quiz_update',
      'quiz_delete',
      'quiz_attempt',
      'quiz_complete',
      
      // Admin actions
      'admin_login',
      'admin_action',
      'system_settings_update',
      'backup_created',
      'restore_completed',
      'logs_deleted',
      'log_export',
      
      // Other
      'general'
    ]
  },
  bruker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dato: {
    type: Date,
    default: Date.now
  },
  detaljer: {
    type: String
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  ip: {
    type: String
  }
});

// Add index for better query performance
AktivitetSchema.index({ dato: -1 });
AktivitetSchema.index({ bruker: 1, dato: -1 });
AktivitetSchema.index({ type: 1, dato: -1 });

module.exports = mongoose.model('Aktivitet', AktivitetSchema);
