const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const {
  getDashboardStats,
  getUsers,
  getTechnicians,
  getServiceRequests,
  updateUser,
  deleteUser,
  verifyTechnician,
  updateServiceRequestStatus,
  getAnalytics,
  bulkUpdateUsers,
  exportUsers,
  getSystemSettings,
  updateSystemSettings
} = require('../controllers/adminController');

// Apply middleware to all admin routes
router.use(protect);
router.use(allowRoles('admin'));

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// User management routes
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/bulk', bulkUpdateUsers);
router.get('/users/export', exportUsers);

// Technician management routes
router.get('/technicians', getTechnicians);
router.put('/technicians/:id/verify', verifyTechnician);

// Service request management routes
router.get('/service-requests', getServiceRequests);
router.put('/service-requests/:id', updateServiceRequestStatus);

// System settings routes
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// Legacy dashboard route (for backwards compatibility)
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Admin dashboard - use /stats for dashboard data' });
});

module.exports = router;