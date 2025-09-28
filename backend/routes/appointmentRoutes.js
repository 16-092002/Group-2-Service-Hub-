const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const {
  createAppointment,
  getUserAppointments,
  getTechnicianAppointments,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots
} = require('../controllers/appointmentController');

// Apply auth middleware to all routes
router.use(protect);

// Public appointment routes (authenticated users)
router.post('/', createAppointment);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', getAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', cancelAppointment);

// User-specific routes
router.get('/user/my', getUserAppointments);
router.get('/user/upcoming', async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const appointments = await Appointment.findUpcoming(req.user._id, 'user');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming appointments' });
  }
});

// Technician-specific routes
router.get('/technician/my', allowRoles('technician', 'admin'), getTechnicianAppointments);
router.get('/technician/schedule', allowRoles('technician', 'admin'), async (req, res) => {
  try {
    const { date } = req.query;
    const Appointment = require('../models/Appointment');
    
    const technicianId = req.user.role === 'admin' ? req.query.technicianId : req.user._id;
    const schedule = await Appointment.getTechnicianSchedule(technicianId, date || new Date());
    
    res.json({
      date: date || new Date().toISOString().split('T')[0],
      appointments: schedule
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch technician schedule' });
  }
});

// Admin routes
router.get('/admin/all', allowRoles('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, serviceType, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const Appointment = require('../models/Appointment');
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('user', 'name email phone')
        .populate('technician', 'name email phone')
        .populate('serviceRequest', 'serviceType description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Appointment.countDocuments(query)
    ]);
    
    res.json({
      appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAppointments: total,
        hasNext: skip + appointments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all appointments' });
  }
});

// Statistics routes
router.get('/stats/overview', async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    
    let query = {};
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    } else if (req.user.role === 'user') {
      query.user = req.user._id;
    }
    // Admin sees all stats
    
    const [
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      todayAppointments
    ] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.countDocuments({ ...query, status: 'scheduled' }),
      Appointment.