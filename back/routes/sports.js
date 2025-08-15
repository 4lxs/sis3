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

/* GET all sports */
router.get('/', async function(req, res, next) {
  try {
    const result = await dataPool.getAllSports();
    
    res.json({
      success: true,
      sports: result || []
    });
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching sports'
    });
  }
});

/* POST create sport - protected route */
router.post('/create', verifyToken, async function(req, res, next) {
  const { name } = req.body;
  
  // Basic validation
  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Sport name is required'
    });
  }
  
  try {
    // Check if sport already exists
    const existingSport = await dataPool.getSportByName(name.trim());
    if (existingSport && existingSport.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Sport already exists'
      });
    }

    // Create sport
    const result = await dataPool.createSport(req.user.id, name.trim());
    
    if (result && result.insertId) {
      res.status(201).json({
        success: true,
        message: 'Sport created successfully',
        sport: {
          id: result.insertId,
          user_id: req.user.id,
          name: name.trim()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create sport'
      });
    }
  } catch (error) {
    console.error('Create sport error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the sport'
    });
  }
});

module.exports = router;
