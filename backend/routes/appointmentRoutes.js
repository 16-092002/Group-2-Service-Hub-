const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getUserAppointments,
  getTechnicianAppointments
} = require('../controllers/appointmentController');

router.post('/', protect, createAppointment);
router.get('/user', protect, getUserAppointments);
router.get('/technician', protect, getTechnicianAppointments);

module.exports = router;
