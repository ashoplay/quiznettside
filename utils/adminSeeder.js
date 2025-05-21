const mongoose = require('mongoose');
const User = require('../models/User');
const argon2 = require('argon2');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Function to create admin user
const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ rolle: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists:', adminExists.brukernavn);
      mongoose.connection.close();
      return;
    }
    
    // Create admin user
    const adminUser = {
      brukernavn: 'admin',
      epost: 'admin@quiznettside.no',
      passord: await argon2.hash('admin123'), // Change this in production!
      rolle: 'admin'
    };
    
    await User.create(adminUser);
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Email: admin@quiznettside.no');
    console.log('Password: admin123');
    console.log('IMPORTANT: Change this password immediately after first login!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
createAdminUser();
