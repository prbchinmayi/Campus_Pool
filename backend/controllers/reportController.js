const pool = require('../db');

/** POST /api/reports */
const createReport = async (req, res, next) => {
  try {
    const reporterId = req.user.userId;
    const { reported_user_id, reported_ride_id, reason, description } = req.body;

    if (!reason || (typeof reason === 'string' && !reason.trim())) {
      return res.status(400).json({ error: 'reason is required' });
    }
    if (!reported_user_id && !reported_ride_id) {
      return res.status(400).json({ error: 'Must report a user or a ride' });
    }
    if (reported_user_id && Number(reporterId) === Number(reported_user_id)) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    if (reported_user_id) {
      const userCheck = await pool.query(
        `SELECT user_id FROM users WHERE user_id = $1`,
        [reported_user_id]
      );
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Reported user not found' });
      }
    }

    if (reported_ride_id) {
      const rideCheck = await pool.query(
        `SELECT ride_id FROM rides WHERE ride_id = $1`,
        [reported_ride_id]
      );
      if (rideCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Reported ride not found' });
      }
    }

    const result = await pool.query(
      `INSERT INTO reports_complaints (reporter_id, reported_user_id, reported_ride_id, reason, description)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [reporterId, reported_user_id || null, reported_ride_id || null, typeof reason === 'string' ? reason.trim() : reason, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Invalid reference to user or ride' });
    }
    next(err);
  }
};

/** GET /api/reports — Admin only */
const getReports = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT rc.*,
              ur.name AS reporter_name,
              uu.name AS reported_user_name
       FROM reports_complaints rc
       JOIN users ur ON rc.reporter_id = ur.user_id
       LEFT JOIN users uu ON rc.reported_user_id = uu.user_id
       ORDER BY rc.report_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/reports/:id/resolve — Admin only */
const resolveReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { admin_remarks } = req.body;

    const result = await pool.query(
      `UPDATE reports_complaints
       SET resolution_status = 'resolved', admin_remarks = $1
       WHERE report_id = $2 RETURNING *`,
      [admin_remarks || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { createReport, getReports, resolveReport };
