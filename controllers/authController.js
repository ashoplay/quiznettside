const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

// Generer JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Vis login-side
exports.loginSide = (req, res) => {
  res.render('login', {
    title: 'Logg inn'
  });
};

// Login bruker
exports.login = exports.loginBruker = async (req, res) => {
  try {
    const { epost, passord } = req.body;

    // Valider input
    const errors = [];
    if (!epost || !passord) {
      errors.push({ msg: 'Vennligst fyll ut alle felt' });
    }

    if (errors.length > 0) {
      return res.render('login', {
        errors,
        epost,
        title: 'Logg Inn'
      });
    }

    // Finn bruker
    const user = await User.findOne({ epost });
    if (!user) {
      errors.push({ msg: 'Ugyldig e-post eller passord' });
      return res.render('login', {
        errors,
        epost,
        title: 'Logg Inn'
      });
    }

    // Valider passord
    const isMatch = await argon2.verify(user.passord, passord);
    if (!isMatch) {
      errors.push({ msg: 'Ugyldig e-post eller passord' });
      return res.render('login', {
        errors,
        epost,
        title: 'Logg Inn'
      });
    }

    // Generer token
    const token = generateToken(user._id);

    // Sett token som cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dager
      secure: process.env.NODE_ENV === 'production'
    });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Innloggingsfeil, prøv igjen');
    res.redirect('/login');
  }
};

// Vis registreringside
exports.registrerSide = (req, res) => {
  res.render('register', {
    title: 'Registrer deg'
  });
};

// Registrer bruker
exports.register = exports.registrerBruker = async (req, res) => {
  try {
    const { brukernavn, epost, passord, passord2 } = req.body;

    // Valider input
    const errors = [];
    if (!brukernavn || !epost || !passord || !passord2) {
      errors.push({ msg: 'Vennligst fyll ut alle felt' });
    }
    if (passord !== passord2) {
      errors.push({ msg: 'Passordene stemmer ikke overens' });
    }
    if (passord.length < 6) {
      errors.push({ msg: 'Passordet må være minst 6 tegn' });
    }

    if (errors.length > 0) {
      return res.render('register', {
        errors,
        brukernavn,
        epost,
        title: 'Registrer deg'
      });
    }

    // Sjekk om bruker allerede eksisterer
    let user = await User.findOne({ epost });
    if (user) {
      errors.push({ msg: 'E-post er allerede registrert' });
      return res.render('register', {
        errors,
        brukernavn,
        epost,
        title: 'Registrer deg'
      });
    }

    user = await User.findOne({ brukernavn });
    if (user) {
      errors.push({ msg: 'Brukernavnet er allerede tatt' });
      return res.render('register', {
        errors,
        brukernavn,
        epost,
        title: 'Registrer deg'
      });
    }

    // Hash passord
    const hashedPassword = await argon2.hash(passord);

    // Opprett ny bruker
    const newUser = new User({
      brukernavn,
      epost,
      passord: hashedPassword
    });

    await newUser.save();

    req.flash('success_msg', 'Du er nå registrert og kan logge inn');
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'En feil oppstod ved registrering');
    res.redirect('/register');
  }
};

// Logg ut bruker
exports.logout = exports.loggUt = (req, res) => {
  res.clearCookie('token');
  req.flash('success_msg', 'Du er nå logget ut');
  res.redirect('/login');
};
