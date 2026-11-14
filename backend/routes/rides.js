const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getRides, postRide, updateRide, cancelRide, updateRideStatus, getRideHistory
} = require('../controllers/rideController');

// GET /api/rides?source=&destination=&date=&maxCost=
router.get('/', authenticate, getRides);

// GET /api/rides/history — my ride history (driver or rider)
router.get('/history', authenticate, getRideHistory);

// POST /api/rides — Driver posts a new ride
router.post('/', authenticate, authorize('driver'), postRide);

// PUT /api/rides/:id — Driver edits a scheduled ride
router.put('/:id', authenticate, authorize('driver'), updateRide);

// DELETE /api/rides/:id — Driver cancels a ride
router.delete('/:id', authenticate, authorize('driver'), cancelRide);

// PATCH /api/rides/:id/status — Driver updates ride status
router.patch('/:id/status', authenticate, authorize('driver'), updateRideStatus);

module.exports = router;
