const User = require('../models/User');
const argon2 = require('argon2');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Quiz = require('../models/Quiz');

// Konfigurer fillagring for profilbilder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/profile/');
  },
  filename: function (req, file, cb) {
    cb(null, `user-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtrer tillatte filtyper
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Bare bilder er tillatt (jpg, jpeg, png, gif)'));
};

// Initialiser multer med konfigurasjon
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB maks
  fileFilter: fileFilter
}).single('profilbilde');

// Vis profilside
exports.profilSide = async (req, res) => {
  try {
    // Hent quizzer som er opprettet av brukeren
    const mineQuizzer = await Quiz.find({ opprettetAv: req.user._id })
      .sort({ opprettetDato: -1 });
    
    res.render('profile', {
      title: 'Min Profil',
      user: req.user,
      mineQuizzer
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'En feil oppstod ved lasting av profilsiden');
    res.redirect('/');
  }
};

// Oppdater profil
exports.oppdaterProfil = async (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      req.flash('error_msg', `Opplastingsfeil: ${err.message}`);
      return res.redirect('/profile');
    } else if (err) {
      req.flash('error_msg', err.message);
      return res.redirect('/profile');
    }
    
    try {
      const { brukernavn, epost } = req.body;
      
      // Finn og oppdater bruker
      const user = await User.findById(req.user._id);
      
      // Sjekk om brukernavnet allerede er tatt
      if (brukernavn !== user.brukernavn) {
        const eksisterendeBruker = await User.findOne({ brukernavn });
        if (eksisterendeBruker) {
          req.flash('error_msg', 'Brukernavnet er allerede tatt');
          return res.redirect('/profile');
        }
      }
      
      // Sjekk om epostadressen allerede er tatt
      if (epost !== user.epost) {
        const eksisterendeBruker = await User.findOne({ epost });
        if (eksisterendeBruker) {
          req.flash('error_msg', 'E-postadressen er allerede registrert');
          return res.redirect('/profile');
        }
      }
      
      user.brukernavn = brukernavn;
      user.epost = epost;
      
      // Oppdater passord hvis det er angitt
      if (req.body.passord) {
        user.passord = await argon2.hash(req.body.passord);
      }
      
      // Oppdater profilbilde hvis lastet opp
      if (req.file) {
        // Slett gammelt profilbilde hvis det ikke er standard
        if (user.profilbilde !== 'default.png') {
          const oldImagePath = path.join(__dirname, '../public/img/profile/', user.profilbilde);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Kunne ikke slette gammelt profilbilde:', err);
          });
        }
        
        user.profilbilde = req.file.filename;
      }
      
      await user.save();
      
      req.flash('success_msg', 'Profilen din er oppdatert');
      res.redirect('/profile');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'En feil oppstod ved oppdatering av profil');
      res.redirect('/profile');
    }
  });
};
