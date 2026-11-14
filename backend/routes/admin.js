const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAnalytics, getUsers, suspendUser, getFlaggedReviews, deleteReview
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// GET /api/admin/analytics
router.get('/analytics', getAnalytics);

// GET /api/admin/users
router.get('/users', getUsers);

// PATCH /api/admin/users/:id/suspend
router.patch('/users/:id/suspend', suspendUser);

// GET /api/admin/reviews — flagged reviews
router.get('/reviews', getFlaggedReviews);

// DELETE /api/admin/reviews/:id — remove abusive review
router.delete('/reviews/:id', deleteReview);

module.exports = router;
