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

/* GET all events */
router.get('/', async function(req, res, next) {
  try {
    const result = await dataPool.getAllEvents();
    
    res.json({
      success: true,
      events: result || []
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching events'
    });
  }
});

/* POST create event - protected route */
router.post('/create', verifyToken, async function(req, res, next) {
  const { title, sport, location, datetime, max_players, skill_level } = req.body;
  
  // Basic validation
  if (!title || !sport || !location || !datetime || !max_players || !skill_level) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: title, sport, location, datetime, max_players, skill_level'
    });
  }
  
  // Validate max_players is a positive number
  if (isNaN(max_players) || max_players <= 0) {
    return res.status(400).json({
      success: false,
      message: 'max_players must be a positive number'
    });
  }
  
  try {
    // Find or create sport
    let sportId;
    const existingSport = await dataPool.getSportByName(sport);
    
    if (existingSport && existingSport.length > 0) {
      // Sport exists, use its ID
      sportId = existingSport[0].id;
    } else {
      // Sport doesn't exist, create it
      const sportResult = await dataPool.createSport(req.user.id, sport);
      if (sportResult && sportResult.insertId) {
        sportId = sportResult.insertId;
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to create sport'
        });
      }
    }

    // Create event with the sport ID
    const result = await dataPool.createEvent(
      req.user.id, // organizer_id from JWT token
      title,
      sportId, // sport_id instead of sport name
      location,
      datetime,
      parseInt(max_players),
      skill_level
    );
    
    if (result && result.insertId) {
      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event: {
          id: result.insertId,
          organizer_id: req.user.id,
          title,
          sport: sportId,
          sport_name: sport,
          location,
          datetime,
          max_players: parseInt(max_players),
          skill_level,
          created_at: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create event'
      });
    }
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the event'
    });
  }
});

module.exports = router;
