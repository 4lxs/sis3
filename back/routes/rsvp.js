var express = require('express');
var router = express.Router();
var dataPool = require('../db/conn');
var jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// POST join a game (requires auth)
router.post('/events/:gameId/join', verifyToken, async function (req, res) {
    const gameId = req.params.gameId;
    const userId = req.user.id;

    try {
        // Check if user has already joined
        const hasJoined = await dataPool.hasUserJoinedGame(gameId, userId);
        if (hasJoined) {
            return res.status(400).json({ success: false, message: 'You have already joined this game' });
        }

        const result = await dataPool.joinGame(gameId, userId);
        if (result && result.insertId) {
            res.status(201).json({ success: true, message: 'Successfully joined game' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to join game' });
        }
    } catch (error) {
        console.error('Join game error:', error);
        res.status(500).json({ success: false, message: 'Failed to join game' });
    }
});

// POST leave a game (requires auth)
router.post('/events/:gameId/leave', verifyToken, async function (req, res) {
    const gameId = req.params.gameId;
    const userId = req.user.id;

    try {
        const result = await dataPool.leaveGame(gameId, userId);
        res.json({ success: true, message: 'Successfully left game' });
    } catch (error) {
        console.error('Leave game error:', error);
        res.status(500).json({ success: false, message: 'Failed to leave game' });
    }
});

// GET check if user has joined a game (requires auth)
router.get('/events/:gameId/joined', verifyToken, async function (req, res) {
    const gameId = req.params.gameId;
    const userId = req.user.id;

    try {
        const hasJoined = await dataPool.hasUserJoinedGame(gameId, userId);
        res.json({ success: true, hasJoined });
    } catch (error) {
        console.error('Check join status error:', error);
        res.status(500).json({ success: false, message: 'Failed to check join status' });
    }
});

// GET user's joined games (requires auth)
router.get('/users/joined-games', verifyToken, async function (req, res) {
    const userId = req.user.id;

    try {
        const games = await dataPool.getUserJoinedGames(userId);
        res.json({ success: true, games });
    } catch (error) {
        console.error('Get joined games error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch joined games' });
    }
});

module.exports = router;
