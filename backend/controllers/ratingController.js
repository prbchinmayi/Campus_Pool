const pool = require('../db');

/**
 * POST /api/ratings
 * Body: { ride_id, reviewed_user_id, rating, comment }
 * Business rules:
 *  - Ride must be 'completed'
 *  - Reviewer must be a participant (driver or accepted rider)
 *  - Only one review per reviewer-reviewedUser pair per ride
 */
const addRating = async (req, res, next) => {
  try {
    const reviewerId = req.user.userId;
    const { ride_id, reviewed_user_id, rating, comment } = req.body;

    if (!ride_id || !reviewed_user_id || !rating) {
      return res.status(400).json({ error: 'ride_id, reviewed_user_id, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (reviewerId === reviewed_user_id) {
      return res.status(400).json({ error: 'You cannot rate yourself' });
    }

    // Check ride is completed
    const rideResult = await pool.query(
      `SELECT * FROM rides WHERE ride_id = $1 AND ride_status = 'completed'`,
      [ride_id]
    );
    if (rideResult.rows.length === 0) {
      return res.status(400).json({ error: 'You can only rate after a completed ride' });
    }

    const ride = rideResult.rows[0];

    // Check reviewer is a participant
    const isDriver = ride.driver_id === reviewerId;
    const isRider = await pool.query(
      `SELECT 1 FROM seat_requests
       WHERE ride_id = $1 AND rider_id = $2 AND request_status = 'accepted'`,
      [ride_id, reviewerId]
    );
    if (!isDriver && isRider.rows.length === 0) {
      return res.status(403).json({ error: 'You were not a participant in this ride' });
    }

    const result = await pool.query(
      `INSERT INTO ratings_reviews (ride_id, reviewer_id, reviewed_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ride_id, reviewerId, reviewed_user_id, rating, comment || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ratings/user/:userId
 * Returns all ratings for a user along with their average.
 */
const getUserRatings = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT rr.*, u.name AS reviewer_name
       FROM ratings_reviews rr
       JOIN users u ON rr.reviewer_id = u.user_id
       WHERE rr.reviewed_user_id = $1 AND rr.flagged = FALSE
       ORDER BY rr.review_date DESC`,
      [userId]
    );

    const avgResult = await pool.query(
      `SELECT ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS total_reviews
       FROM ratings_reviews
       WHERE reviewed_user_id = $1 AND flagged = FALSE`,
      [userId]
    );

    res.json({
      reviews: result.rows,
      average_rating: avgResult.rows[0].average_rating,
      total_reviews: avgResult.rows[0].total_reviews
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { addRating, getUserRatings };
