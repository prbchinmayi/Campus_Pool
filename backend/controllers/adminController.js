const pool = require('../db');

/** GET /api/admin/analytics */
const getAnalytics = async (req, res, next) => {
  try {
    const [totalRides, activeUsers, popularRoutes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total_rides FROM rides`),
      pool.query(`SELECT COUNT(*) AS active_users FROM users WHERE account_status = 'active'`),
      pool.query(
        `SELECT source, destination, COUNT(*) AS ride_count
         FROM rides
         GROUP BY source, destination
         ORDER BY ride_count DESC
         LIMIT 5`
      )
    ]);

    res.json({
      total_rides: parseInt(totalRides.rows[0].total_rides),
      active_users: parseInt(activeUsers.rows[0].active_users),
      popular_routes: popularRoutes.rows
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/users */
const getUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name, college_id, email, phone, role, account_status, registration_date
       FROM users ORDER BY registration_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/users/:id/suspend */
const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'suspend' | 'activate'

    if (!['suspend', 'activate'].includes(action)) {
      return res.status(400).json({ error: 'action must be suspend or activate' });
    }

    const newStatus = action === 'suspend' ? 'suspended' : 'active';
    const result = await pool.query(
      `UPDATE users SET account_status = $1 WHERE user_id = $2 AND role != 'admin' RETURNING user_id, name, account_status`,
      [newStatus, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or cannot modify admin accounts' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/** GET /api/admin/reviews — flagged reviews */
const getFlaggedReviews = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT rr.*, ur.name AS reviewer_name, uu.name AS reviewed_name
       FROM ratings_reviews rr
       JOIN users ur ON rr.reviewer_id = ur.user_id
       JOIN users uu ON rr.reviewed_user_id = uu.user_id
       WHERE rr.flagged = TRUE
       ORDER BY rr.review_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/admin/reviews/:id */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM ratings_reviews WHERE review_id = $1 RETURNING review_id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review removed', review_id: id });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics, getUsers, suspendUser, getFlaggedReviews, deleteReview };
