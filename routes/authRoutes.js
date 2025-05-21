const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');

// Authentication routes
router.get('/login', authController.loginSide);
router.post('/login', authController.loginBruker); // Changed from login to loginBruker
router.get('/register', authController.registrerSide); // Changed from registerSide to registrerSide
router.post('/register', authController.registrerBruker); // Changed from register to registrerBruker
router.get('/logout', authController.loggUt); // Changed from logout to loggUt

module.exports = router;
