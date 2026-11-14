const pool = require('../db');

/** GET /api/rides — search with optional filters */
const getRides = async (req, res, next) => {
  try {
    const { source, destination, date, maxCost } = req.query;
    let query = `
      SELECT r.*, u.name AS driver_name, v.model, v.vehicle_type
      FROM rides r
      JOIN users    u ON r.driver_id  = u.user_id
      JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      WHERE r.ride_status = 'scheduled'
        AND r.available_seats > 0
        AND u.account_status = 'active'
    `;
    const params = [];
    if (source) {
      params.push(`%${source}%`);
      query += ` AND r.source ILIKE $${params.length}`;
    }
    if (destination) {
      params.push(`%${destination}%`);
      query += ` AND r.destination ILIKE $${params.length}`;
    }
    if (date) {
      params.push(date);
      query += ` AND r.date = $${params.length}`;
    }
    if (maxCost) {
      params.push(parseFloat(maxCost));
      query += ` AND r.cost_per_seat <= $${params.length}`;
    }
    query += ` ORDER BY r.date, r.departure_time`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/** GET /api/rides/history — rides where user is driver or accepted rider */
const getRideHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT DISTINCT r.*, u.name AS driver_name
       FROM rides r
       JOIN users u ON r.driver_id = u.user_id
       LEFT JOIN seat_requests sr ON sr.ride_id = r.ride_id AND sr.rider_id = $1 AND sr.request_status = 'accepted'
       WHERE r.driver_id = $1 OR sr.rider_id = $1
       ORDER BY r.date DESC, r.departure_time DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/** POST /api/rides — Driver posts a ride */
const postRide = async (req, res, next) => {
  try {
    const driverId = req.user.userId;
    const { vehicle_id, source, destination, date, departure_time, total_seats, cost_per_seat } = req.body;

    if (!vehicle_id || !source || !destination || !date || !departure_time || !total_seats || cost_per_seat === undefined) {
      return res.status(400).json({ error: 'All ride fields are required' });
    }

    // Verify driver owns the vehicle
    const vCheck = await pool.query(
      `SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1 AND owner_id = $2`,
      [vehicle_id, driverId]
    );
    if (vCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Vehicle not found or not owned by you' });
    }

    const result = await pool.query(
      `INSERT INTO rides (driver_id, vehicle_id, source, destination, date, departure_time, total_seats, available_seats, cost_per_seat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8)
       RETURNING *`,
      [driverId, vehicle_id, source, destination, date, departure_time, total_seats, cost_per_seat]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/rides/:id — Driver edits a scheduled ride */
const updateRide = async (req, res, next) => {
  try {
    const driverId = req.user.userId;
    const { id } = req.params;
    const { source, destination, date, departure_time, cost_per_seat } = req.body;

    const rideCheck = await pool.query(
      `SELECT * FROM rides WHERE ride_id = $1 AND driver_id = $2 AND ride_status = 'scheduled'`,
      [id, driverId]
    );
    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled ride not found or not yours' });
    }

    const result = await pool.query(
      `UPDATE rides SET source=$1, destination=$2, date=$3, departure_time=$4, cost_per_seat=$5
       WHERE ride_id=$6 RETURNING *`,
      [
        source || rideCheck.rows[0].source,
        destination || rideCheck.rows[0].destination,
        date || rideCheck.rows[0].date,
        departure_time || rideCheck.rows[0].departure_time,
        cost_per_seat !== undefined ? cost_per_seat : rideCheck.rows[0].cost_per_seat,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/rides/:id — Driver cancels a ride */
const cancelRide = async (req, res, next) => {
  try {
    const driverId = req.user.userId;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE rides SET ride_status = 'cancelled'
       WHERE ride_id = $1 AND driver_id = $2 AND ride_status = 'scheduled'
       RETURNING *`,
      [id, driverId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or cannot be cancelled' });
    }

    // Notify all pending/accepted riders
    const riders = await pool.query(
      `SELECT rider_id FROM seat_requests WHERE ride_id = $1 AND request_status IN ('pending','accepted')`,
      [id]
    );
    for (const { rider_id } of riders.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, 'ride_cancelled')`,
        [rider_id, `The ride to ${result.rows[0].destination} on ${result.rows[0].date} has been cancelled by the driver.`]
      );
    }

    res.json({ message: 'Ride cancelled', ride: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/rides/:id/status — Driver updates ride status */
const updateRideStatus = async (req, res, next) => {
  try {
    const driverId = req.user.userId;
    const { id } = req.params;
    const { ride_status } = req.body;

    const allowed = ['ongoing', 'completed', 'cancelled'];
    if (!allowed.includes(ride_status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE rides SET ride_status = $1
       WHERE ride_id = $2 AND driver_id = $3
       RETURNING *`,
      [ride_status, id, driverId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found or not yours' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRides, postRide, updateRide, cancelRide, updateRideStatus, getRideHistory };
