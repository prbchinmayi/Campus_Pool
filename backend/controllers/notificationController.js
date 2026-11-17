const pool = require('../db');

/** GET /api/notifications/mine */
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_time DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/notifications/read-all */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `UPDATE notifications SET read_status = TRUE
       WHERE user_id = $1 RETURNING *`,
      [userId]
    );
    res.json({ message: 'All notifications marked as read', count: result.rowCount });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/notifications/:id/read */
const markRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notifications SET read_status = TRUE
       WHERE notification_id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotifications, markRead, markAllRead };
