const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requestSeat, getMyBookings, respondToRequest } = require('../controllers/bookingController');

// POST /api/bookings — Rider requests a seat (uses SELECT FOR UPDATE)
router.post('/', authenticate, authorize('rider'), requestSeat);

// GET /api/bookings/mine — Get my requests (rider sees own; driver sees requests on their rides)
router.get('/mine', authenticate, getMyBookings);

// PATCH /api/bookings/:id/respond — Driver accepts or rejects a request
router.patch('/:id/respond', authenticate, authorize('driver'), respondToRequest);

module.exports = router;
