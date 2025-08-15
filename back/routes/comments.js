
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

// GET comments for a game
router.get('/events/:gameId/comments', async function (req, res) {
    const gameId = req.params.gameId;
    try {
        const comments = await dataPool.getCommentsForGame(gameId);
        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
});

// POST a new comment for a game (requires auth)
router.post('/events/:gameId/comments', verifyToken, async function (req, res) {
    const gameId = req.params.gameId;
    const userId = req.user.id;
    const username = req.user.username;
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Comment text required' });
    }
    try {
        const result = await dataPool.addCommentToGame(gameId, userId, username, text);
        if (result && result.insertId) {
            res.status(201).json({ success: true, message: 'Comment added' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to add comment' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
});

module.exports = router;
