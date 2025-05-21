const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// FAQ side - tilgjengelig for alle
router.get('/', faqController.visFAQ);

module.exports = router;
