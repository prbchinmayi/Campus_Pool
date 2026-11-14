require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// --- Route Imports ---
const authRoutes         = require('./routes/auth');
const rideRoutes         = require('./routes/rides');
const bookingRoutes      = require('./routes/bookings');
const ratingRoutes       = require('./routes/ratings');
const reportRoutes       = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const adminRoutes        = require('./routes/admin');

const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());

// --- Health Check ---
app.get('/', (req, res) => {
  res.json({ message: 'CampusPool API is running 🚗', version: '1.0.0' });
});

// --- Route Mounting ---
app.use('/api/auth',          authRoutes);
app.use('/api/rides',         rideRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/ratings',       ratingRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Global Error Handler (must be last) ---
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ CampusPool server listening on port ${PORT}`);
});

module.exports = app;
