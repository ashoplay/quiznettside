const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');

// Profile routes
router.get('/profile', ensureAuthenticated, userController.profilSide);
router.post('/profile/update', ensureAuthenticated, userController.oppdaterProfil);

module.exports = router;
