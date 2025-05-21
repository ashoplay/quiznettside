const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes requiring login
const beskyttetRute = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      req.flash('error_msg', 'Du må være logget inn for å få tilgang');
      return res.redirect('/login');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      req.flash('error_msg', 'Bruker ikke funnet');
      return res.redirect('/login');
    }

    // Add user to request object
    req.user = user;
    // Make user available to views
    res.locals.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.flash('error_msg', 'Ugyldig token, vennligst logg inn på nytt');
    res.redirect('/login');
  }
};

// Check if user is admin
const erAdmin = (req, res, next) => {
  if (req.user && req.user.rolle === 'admin') {
    return next();
  }
  
  req.flash('error_msg', 'Du må være administrator for å få tilgang');
  res.redirect('/');
};

// Forward authenticated middleware
const forwardAuthenticated = function(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// Ensure authenticated middleware (passport style)
const ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  // If not authenticated, redirect to login page
  req.flash('error_msg', 'Du må være logget inn for å se denne siden');
  res.redirect('/login');
};

// Export all middleware functions
module.exports = {
  beskyttetRute,
  erAdmin,
  forwardAuthenticated,
  ensureAuthenticated
};
