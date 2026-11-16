const { pool } = require('../db');

/**
 * POST /api/bookings
 * Rider requests seats on a ride.
 * Uses BEGIN + SELECT ... FOR UPDATE to prevent double-booking.
 */
const requestSeat = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const riderId = req.user.userId;
    const { ride_id, seats_requested } = req.body;

    const seats = Number(seats_requested);
    if (
      !ride_id ||
      typeof seats_requested === 'boolean' ||
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      return res.status(400).json({ error: 'ride_id and a positive integer seats_requested (>= 1) are required' });
    }

    await client.query('BEGIN');

    // Lock the ride row to prevent concurrent overbooking
    const rideResult = await client.query(
      `SELECT * FROM rides WHERE ride_id = $1 AND ride_status = 'scheduled' FOR UPDATE`,
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ride not found or not available for booking' });
    }

    const ride = rideResult.rows[0];

    // Business rule: driver cannot request seat on own ride
    if (ride.driver_id === riderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Drivers cannot request seats on their own ride' });
    }

    // Check available seats
    if (ride.available_seats < seats) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Only ${ride.available_seats} seat(s) available`
      });
    }

    // Check for existing request by this rider on this ride
    const existing = await client.query(
      `SELECT request_id, request_status FROM seat_requests
       WHERE ride_id = $1 AND rider_id = $2
       FOR UPDATE`,
      [ride_id, riderId]
    );

    let requestResult;
    if (existing.rows.length > 0) {
      const existingReq = existing.rows[0];

      // Keep 409 for active requests
      if (['pending', 'accepted'].includes(existingReq.request_status)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'You already have an active request for this ride' });
      }

      // If previous request was rejected or cancelled, update row back to pending
      requestResult = await client.query(
        `UPDATE seat_requests
         SET seats_requested = $1, request_status = 'pending', request_time = NOW()
         WHERE request_id = $2
         RETURNING *`,
        [seats, existingReq.request_id]
      );
    } else {
      // Insert seat request
      requestResult = await client.query(
        `INSERT INTO seat_requests (ride_id, rider_id, seats_requested)
         VALUES ($1, $2, $3) RETURNING *`,
        [ride_id, riderId, seats]
      );
    }

    // Notify the driver
    await client.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'seat_request')`,
      [ride.driver_id, `A rider has requested ${seats} seat(s) on your ride to ${ride.destination}.`]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Seat request submitted successfully',
      request: requestResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/bookings/mine
 * Riders: see their own requests.
 * Drivers: see requests on their rides.
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { userId, role } = req.user;
    let result;

    if (role === 'rider') {
      result = await pool.query(
        `SELECT sr.*, r.source, r.destination, r.date, r.departure_time, r.cost_per_seat,
                u.name AS driver_name
         FROM seat_requests sr
         JOIN rides r ON sr.ride_id = r.ride_id
         JOIN users  u ON r.driver_id = u.user_id
         WHERE sr.rider_id = $1
         ORDER BY sr.request_time DESC`,
        [userId]
      );
    } else {
      // driver — see requests on their rides
      result = await pool.query(
        `SELECT sr.*, r.source, r.destination, r.date, r.departure_time,
                u.name AS rider_name, u.phone AS rider_phone
         FROM seat_requests sr
         JOIN rides r ON sr.ride_id = r.ride_id
         JOIN users u ON sr.rider_id = u.user_id
         WHERE r.driver_id = $1
         ORDER BY sr.request_time DESC`,
        [userId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/bookings/:id/respond
 * Driver accepts or rejects a seat request.
 */
const respondToRequest = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const driverId = req.user.userId;
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or reject' });
    }

    await client.query('BEGIN');

    // Verify driver owns the ride this request belongs to and ride is scheduled
    const reqResult = await client.query(
      `SELECT sr.*, r.driver_id, r.available_seats, r.destination, r.ride_status
       FROM seat_requests sr
       JOIN rides r ON sr.ride_id = r.ride_id
       WHERE sr.request_id = $1 AND sr.request_status = 'pending'
       FOR UPDATE`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending request not found' });
    }

    const request = reqResult.rows[0];

    if (request.driver_id !== driverId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your ride' });
    }

    // Require ride's status to be scheduled
    if (request.ride_status !== 'scheduled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Ride is no longer scheduled' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    if (action === 'accept') {
      // Check seats again (another accept may have run concurrently)
      if (request.available_seats < request.seats_requested) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Not enough seats available' });
      }
      // Deduct seats
      await client.query(
        `UPDATE rides SET available_seats = available_seats - $1 WHERE ride_id = $2`,
        [request.seats_requested, request.ride_id]
      );
    }

    // Update request status
    await client.query(
      `UPDATE seat_requests SET request_status = $1 WHERE request_id = $2`,
      [newStatus, id]
    );

    // Notify rider
    const msg = action === 'accept'
      ? `Your seat request for the ride to ${request.destination} has been ACCEPTED!`
      : `Your seat request for the ride to ${request.destination} has been rejected.`;

    await client.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, $3)`,
      [request.rider_id, msg, `booking_${newStatus}`]
    );

    await client.query('COMMIT');
    res.json({ message: `Request ${newStatus}`, requestId: id });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/bookings/:id/cancel
 * Rider cancels their own pending or accepted seat request.
 * If accepted, returns seats to rides.available_seats in a transaction with FOR UPDATE.
 */
const cancelBooking = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const riderId = req.user.userId;
    const { id } = req.params;

    await client.query('BEGIN');

    // Lock and retrieve the seat request along with ride details
    const reqResult = await client.query(
      `SELECT sr.*, r.driver_id, r.available_seats, r.destination, r.ride_status
       FROM seat_requests sr
       JOIN rides r ON sr.ride_id = r.ride_id
       WHERE sr.request_id = $1
       FOR UPDATE`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Seat request not found' });
    }

    const request = reqResult.rows[0];

    // Verify rider owns the request
    if (request.rider_id !== riderId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not your booking request' });
    }

    // Must be pending or accepted
    if (!['pending', 'accepted'].includes(request.request_status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot cancel a request that is already ${request.request_status}` });
    }

    // If accepted, return the seats to rides.available_seats
    if (request.request_status === 'accepted') {
      await client.query(
        `UPDATE rides SET available_seats = available_seats + $1 WHERE ride_id = $2`,
        [request.seats_requested, request.ride_id]
      );
    }

    // Update seat request status to cancelled
    const updatedResult = await client.query(
      `UPDATE seat_requests SET request_status = 'cancelled' WHERE request_id = $1 RETURNING *`,
      [id]
    );

    // Notify the driver
    await client.query(
      `INSERT INTO notifications (user_id, message, type)
       VALUES ($1, $2, 'booking_cancelled')`,
      [
        request.driver_id,
        `A rider has cancelled their booking (${request.seats_requested} seat(s)) for your ride to ${request.destination}.`
      ]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Booking request cancelled successfully',
      request: updatedResult.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { requestSeat, getMyBookings, respondToRequest, cancelBooking };
