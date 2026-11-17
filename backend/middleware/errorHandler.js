/**
 * Global Express error handler.
 * Must be registered LAST (after all routes).
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err);

  // PostgreSQL unique-violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry: ' + (err.detail || err.message) });
  }
  // PostgreSQL foreign-key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  // PostgreSQL check-constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Constraint violated: ' + (err.constraint || err.message) });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
