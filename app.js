const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const flash = require('connect-flash');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const User = require('./models/User');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const adminRoutes = require('./routes/adminRoutes');
const faqRoutes = require('./routes/faqRoutes');
const userRoutes = require('./routes/userRoutes');

// Last miljøvariabler
dotenv.config();

// Koble til database
connectDB();

const app = express();

// EJS
app.set('view engine', 'ejs');

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Ensure profile image directory exists
const profileImgDir = path.join(__dirname, 'public/img/profile');
if (!fs.existsSync(profileImgDir)) {
  fs.mkdirSync(profileImgDir, { recursive: true });
}

// Set up static file serving for public directory - make sure this comes early in the middleware chain
app.use(express.static(path.join(__dirname, 'public')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Session
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

// CSRF protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Flash meldinger
app.use(flash());

// Globale variabler
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.csrfToken = req.csrfToken(); // Make CSRF token available to all views
  next();
});

// Sjekk bruker på hver forespørsel
app.use(async (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passord');
      req.user = user;
      res.locals.user = user;
    } catch (err) {
      console.error('JWT Verifiseringsfeil:', err);
    }
  }
  next();
});

// Add compatibility with passport's isAuthenticated()
app.use(async (req, res, next) => {
  req.isAuthenticated = function() {
    return !!req.user;
  };
  next();
});

// Use routes - make sure this is before any error handlers
app.use('/', authRoutes);
app.use('/quizzes', quizRoutes);
app.use('/admin', adminRoutes);
app.use('/faq', faqRoutes);
app.use('/', userRoutes);
// Or if you prefer to have a prefix:
// app.use('/user', userRoutes); // Then the profile route would be /user/profile

// Hjem-side
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Hjem'
  });
});

// Håndter 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Side ikke funnet'
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, () => console.log(`Server kjører på ${HOST}:${PORT}`));
