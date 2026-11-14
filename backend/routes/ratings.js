const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { addRating, getUserRatings } = require('../controllers/ratingController');

// POST /api/ratings — Submit a rating after a completed ride
router.post('/', authenticate, addRating);

// GET /api/ratings/user/:userId — Get a user's ratings
router.get('/user/:userId', authenticate, getUserRatings);

module.exports = router;
