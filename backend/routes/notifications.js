const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyNotifications, markRead } = require('../controllers/notificationController');

// GET /api/notifications/mine
router.get('/mine', authenticate, getMyNotifications);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, markRead);

module.exports = router;
