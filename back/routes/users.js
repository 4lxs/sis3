var express = require('express');
var router = express.Router();
var dataPool = require('../db/conn');
var jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET user profile - protected route */
router.get('/profile', verifyToken, function(req, res, next) {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username
    }
  });
});

/* POST login route */
router.post('/login', async function(req, res, next) {
  const { username, password } = req.body;
  
  // Basic validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  try {
    // Authenticate user with database
    const users = await dataPool.authUser(username, password);
    
    if (users && users.length > 0) {
      // User found - login successful
      const user = users[0];
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username 
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: '24h' // Token expires in 24 hours
        }
      );
      
      // Set JWT token as HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true, // Prevents client-side JavaScript access
        secure: false, // Set to false for development (HTTP), true for production (HTTPS)
        sameSite: 'lax', // More permissive for development, use 'strict' in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      });
      
      // Debug: Log cookie setting
      console.log('Setting cookie with token:', token.substring(0, 20) + '...');
      console.log('Cookie headers:', res.getHeaders()['set-cookie']);
      
      // Store user in session (optional - you can use JWT only)
      req.session.user = { 
        id: user.id,
        username: user.username 
      };
      
      res.json({
        success: true,
        message: 'Login successful',
        user: { 
          id: user.id,
          username: user.username 
        }
      });
    } else {
      // No user found - invalid credentials
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
});

/* POST register route */
router.post('/register', async function(req, res, next) {
  const { username, password } = req.body;
  
  // Basic validation
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  try {
    // Check if user already exists
    const existingUsers = await dataPool.authUser(username, ''); // Check with empty password to see if username exists
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    // Register new user
    const result = await dataPool.registerUser(username, password);
    
    if (result && result.insertId) {
      // Registration successful
      const newUser = {
        id: result.insertId,
        username: username,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          createdAt: newUser.createdAt
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register user'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate entry error (MySQL error code 1062)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
});

/* POST logout route */
router.post('/logout', function(req, res, next) {
  // Clear JWT cookie
  res.clearCookie('token');
  
  // Clear session
  if (req.session) {
    req.session.destroy(function(err) {
      if (err) { 
        return res.status(500).json({
          success: false,
          message: 'Could not log out, please try again'
        });
      }
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });
  } else {
    res.json({
      success: true,
      message: 'Already logged out'
    });
  }
});

/* GET logout route (alternative for simple logout links) */
router.get('/logout', function(req, res, next) {
  // Clear JWT cookie
  res.clearCookie('token');
  
  if (req.session) {
    req.session.destroy(function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Could not log out, please try again'
        });
      }
      
      res.redirect('/'); // Redirect to home page after logout
    });
  } else {
    res.redirect('/');
  }
});

module.exports = router;
