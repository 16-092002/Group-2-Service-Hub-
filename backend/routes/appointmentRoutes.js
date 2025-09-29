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
      todayAppointments,
      thisWeekAppointments,
      thisMonthAppointments,
      upcomingAppointments
    ] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.countDocuments({ ...query, status: 'scheduled' }),
      Appointment.countDocuments({ ...query, status: 'completed' }),
      Appointment.countDocuments({ ...query, status: 'cancelled' }),
      Appointment.countDocuments({
        ...query,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Appointment.countDocuments({
        ...query,
        date: {
          $gte: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
          $lt: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 7))
        }
      }),
      Appointment.countDocuments({
        ...query,
        date: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        }
      }),
      Appointment.countDocuments({
        ...query,
        status: 'scheduled',
        date: { $gte: new Date() }
      })
    ]);

    // Calculate completion rate
    const completionRate = totalAppointments > 0 ? 
      Math.round((completedAppointments / totalAppointments) * 100) : 0;

    res.json({
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      upcomingAppointments,
      todayAppointments,
      thisWeekAppointments,
      thisMonthAppointments,
      completionRate,
      stats: {
        avgResponseTime: '15 minutes', // This would be calculated from actual data
        topServiceType: 'plumbing', // This would be calculated from actual data
        busyDays: ['Monday', 'Tuesday', 'Friday'] // This would be calculated from actual data
      }
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment statistics' });
  }
});

// Monthly statistics for charts/graphs
router.get('/stats/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), months = 12 } = req.query;
    const Appointment = require('../models/Appointment');
    
    let query = {};
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    } else if (req.user.role === 'user') {
      query.user = req.user._id;
    }

    const monthlyData = [];
    
    for (let i = 0; i < months; i++) {
      const startDate = new Date(year, i, 1);
      const endDate = new Date(year, i + 1, 1);
      
      const [total, completed, cancelled] = await Promise.all([
        Appointment.countDocuments({
          ...query,
          date: { $gte: startDate, $lt: endDate }
        }),
        Appointment.countDocuments({
          ...query,
          status: 'completed',
          date: { $gte: startDate, $lt: endDate }
        }),
        Appointment.countDocuments({
          ...query,
          status: 'cancelled',
          date: { $gte: startDate, $lt: endDate }
        })
      ]);

      monthlyData.push({
        month: startDate.toLocaleString('default', { month: 'long' }),
        total,
        completed,
        cancelled,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      });
    }

    res.json({
      year: parseInt(year),
      monthlyData
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly statistics' });
  }
});

// Service type breakdown
router.get('/stats/services', async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    
    let matchQuery = {};
    if (req.user.role === 'technician') {
      matchQuery.technician = req.user._id;
    } else if (req.user.role === 'user') {
      matchQuery.user = req.user._id;
    }

    const serviceStats = await Appointment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$serviceType',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgDuration: { $avg: '$estimatedDuration' },
          totalRevenue: { $sum: '$cost' }
        }
      },
      {
        $project: {
          serviceType: '$_id',
          total: 1,
          completed: 1,
          cancelled: 1,
          avgDuration: { $round: ['$avgDuration', 0] },
          totalRevenue: { $round: ['$totalRevenue', 2] },
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(serviceStats);
  } catch (error) {
    console.error('Service stats error:', error);
    res.status(500).json({ error: 'Failed to fetch service statistics' });
  }
});

// Revenue statistics (for technicians and admins)
router.get('/stats/revenue', allowRoles('technician', 'admin'), async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    const Appointment = require('../models/Appointment');
    
    let query = { status: 'completed' };
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }

    if (period === 'yearly') {
      const yearlyRevenue = await Appointment.aggregate([
        {
          $match: {
            ...query,
            date: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$date' },
            revenue: { $sum: '$cost' },
            appointments: { $sum: 1 }
          }
        },
        {
          $project: {
            month: '$_id',
            revenue: { $round: ['$revenue', 2] },
            appointments: 1,
            avgPerAppointment: { $round: [{ $divide: ['$revenue', '$appointments'] }, 2] }
          }
        },
        { $sort: { month: 1 } }
      ]);

      res.json({
        period: 'yearly',
        year: parseInt(year),
        data: yearlyRevenue,
        totalRevenue: yearlyRevenue.reduce((sum, item) => sum + item.revenue, 0),
        totalAppointments: yearlyRevenue.reduce((sum, item) => sum + item.appointments, 0)
      });
    } else {
      // Monthly breakdown for current year
      const monthlyRevenue = await Appointment.aggregate([
        {
          $match: {
            ...query,
            date: {
              $gte: new Date(`${year}-01-01`),
              $lt: new Date(`${parseInt(year) + 1}-01-01`)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            revenue: { $sum: '$cost' },
            appointments: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: { year: '$_id.year', month: '$_id.month' },
            dailyAverage: { $avg: '$revenue' },
            totalRevenue: { $sum: '$revenue' },
            totalAppointments: { $sum: '$appointments' },
            workingDays: { $sum: 1 }
          }
        },
        {
          $project: {
            month: '$_id.month',
            year: '$_id.year',
            totalRevenue: { $round: ['$totalRevenue', 2] },
            dailyAverage: { $round: ['$dailyAverage', 2] },
            totalAppointments: 1,
            workingDays: 1,
            avgPerAppointment: {
              $round: [{ $divide: ['$totalRevenue', '$totalAppointments'] }, 2]
            }
          }
        },
        { $sort: { year: 1, month: 1 } }
      ]);

      res.json({
        period: 'monthly',
        year: parseInt(year),
        data: monthlyRevenue,
        summary: {
          totalRevenue: monthlyRevenue.reduce((sum, item) => sum + item.totalRevenue, 0),
          totalAppointments: monthlyRevenue.reduce((sum, item) => sum + item.totalAppointments, 0),
          avgMonthlyRevenue: monthlyRevenue.length > 0 ? 
            monthlyRevenue.reduce((sum, item) => sum + item.totalRevenue, 0) / monthlyRevenue.length : 0
        }
      });
    }
  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

// Availability and booking patterns
router.get('/stats/patterns', allowRoles('technician', 'admin'), async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    
    let query = {};
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }

    // Day of week patterns
    const dayPatterns = await Appointment.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id',
          total: 1,
          completed: 1,
          completionRate: {
            $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 1]
          }
        }
      },
      { $sort: { dayOfWeek: 1 } }
    ]);

    // Hour of day patterns
    const hourPatterns = await Appointment.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: '$date' },
          total: { $sum: 1 },
          avgDuration: { $avg: '$estimatedDuration' }
        }
      },
      {
        $project: {
          hour: '$_id',
          total: 1,
          avgDuration: { $round: ['$avgDuration', 0] }
        }
      },
      { $sort: { hour: 1 } }
    ]);

    res.json({
      dayPatterns,
      hourPatterns,
      insights: {
        busiestDay: dayPatterns.reduce((max, day) => 
          day.total > max.total ? day : max, dayPatterns[0] || {}),
        busiestHour: hourPatterns.reduce((max, hour) => 
          hour.total > max.total ? hour : max, hourPatterns[0] || {}),
        recommendedHours: hourPatterns
          .filter(h => h.total >= 3)
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .map(h => h.hour)
      }
    });
  } catch (error) {
    console.error('Pattern stats error:', error);
    res.status(500).json({ error: 'Failed to fetch booking patterns' });
  }
});

// Bulk operations for admin
router.post('/admin/bulk-update', allowRoles('admin'), async (req, res) => {
  try {
    const { appointmentIds, updates } = req.body;
    const Appointment = require('../models/Appointment');
    
    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({ error: 'Appointment IDs are required' });
    }

    const result = await Appointment.updateMany(
      { _id: { $in: appointmentIds } },
      { $set: updates },
      { runValidators: true }
    );

    res.json({
      message: 'Bulk update completed',
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to perform bulk update' });
  }
});

// Export appointments data
router.get('/export', allowRoles('technician', 'admin'), async (req, res) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    const Appointment = require('../models/Appointment');
    
    let query = {};
    if (req.user.role === 'technician') {
      query.technician = req.user._id;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .populate('user', 'name email phone')
      .populate('technician', 'name email phone')
      .populate('serviceRequest', 'serviceType description')
      .sort({ date: -1 });

    if (format === 'csv') {
      const csv = appointments.map(apt => ({
        id: apt._id,
        date: apt.date,
        customer: apt.user?.name,
        technician: apt.technician?.name,
        service: apt.serviceType,
        status: apt.status,
        cost: apt.cost
      }));
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
      // You would use a CSV library here to format the response
      res.json(csv); // Simplified for this example
    } else {
      res.json({
        exportDate: new Date().toISOString(),
        totalRecords: appointments.length,
        appointments
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export appointments' });
  }
});

module.exports = router;