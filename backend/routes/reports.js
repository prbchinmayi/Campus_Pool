const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createReport, getReports, resolveReport } = require('../controllers/reportController');

// POST /api/reports — Any user creates a report
router.post('/', authenticate, createReport);

// GET /api/reports — Admin views all reports
router.get('/', authenticate, authorize('admin'), getReports);

// PATCH /api/reports/:id/resolve — Admin resolves a report
router.patch('/:id/resolve', authenticate, authorize('admin'), resolveReport);

module.exports = router;
