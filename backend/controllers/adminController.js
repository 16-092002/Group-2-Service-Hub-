const User = require('../models/User');
const Technician = require('../models/Technician');
const ServiceRequest = require('../models/ServiceRequest');
const Appointment = require('../models/Appointment');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalTechnicians, activeRequests, completedRequests] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      User.countDocuments({ role: 'technician' }),
      ServiceRequest.countDocuments({ status: { $in: ['pending', 'assigned', 'in_progress'] } }),
      ServiceRequest.countDocuments({ status: 'completed' })
    ]);

    res.json({
      totalUsers,
      totalTechnicians,
      activeRequests,
      completedRequests
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get all users with pagination
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: skip + users.length < totalUsers,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all technicians with their user data
exports.getTechnicians = async (req, res) => {
  try {
    const { page = 1, limit = 10, verified, service } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }
    if (service) {
      query.service = { $in: [service] };
    }

    const [technicians, totalTechnicians] = await Promise.all([
      Technician.find(query)
        .populate('user', 'name email createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Technician.countDocuments(query)
    ]);

    res.json({
      technicians,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTechnicians / limit),
        totalTechnicians,
        hasNext: skip + technicians.length < totalTechnicians,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
};

// Get all service requests
exports.getServiceRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, serviceType } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (serviceType) {
      query.serviceType = serviceType;
    }

    const [requests, totalRequests] = await Promise.all([
      ServiceRequest.find(query)
        .populate('user', 'name email')
        .populate('assignedTechnician', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceRequest.countDocuments(query)
    ]);

    res.json({
      requests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        hasNext: skip + requests.length < totalRequests,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get service requests error:', error);
    res.status(500).json({ error: 'Failed to fetch service requests' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role, isActive },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting admin users
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Delete related data
    await Promise.all([
      Technician.deleteOne({ user: id }),
      ServiceRequest.deleteMany({ user: id }),
      Appointment.deleteMany({ user: id })
    ]);

    await User.findByIdAndDelete(id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Verify technician
exports.verifyTechnician = async (req, res) => {
  try {
    const { id } = req.params;

    const technician = await Technician.findByIdAndUpdate(
      id,
      { isVerified: true, verifiedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    res.json({
      message: 'Technician verified successfully',
      technician
    });
  } catch (error) {
    console.error('Verify technician error:', error);
    res.status(500).json({ error: 'Failed to verify technician' });
  }
};

// Update service request status
exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTechnician } = req.body;

    const updateData = { status };
    if (assignedTechnician) {
      updateData.assignedTechnician = assignedTechnician;
    }
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate('user', 'name email')
      .populate('assignedTechnician', 'name email');

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({
      message: 'Service request updated successfully',
      serviceRequest
    });
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({ error: 'Failed to update service request' });
  }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      userGrowth,
      technicianGrowth,
      requestsByService,
      requestsByStatus,
      revenueData
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            role: { $ne: 'admin' }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Technician growth
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            role: 'technician'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Requests by service type
      ServiceRequest.aggregate([
        {
          $match: { createdAt: { $gte: startDate } }
        },
        {
          $group: {
            _id: "$serviceType",
            count: { $sum: 1 },
            totalValue: { $sum: "$estimatedCost" }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Requests by status
      ServiceRequest.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]),

      // Revenue data (mock calculation)
      ServiceRequest.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            revenue: { $sum: "$estimatedCost" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      userGrowth,
      technicianGrowth,
      requestsByService,
      requestsByStatus,
      revenueData,
      period: parseInt(period)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Bulk actions
exports.bulkUpdateUsers = async (req, res) => {
  try {
    const { userIds, action, value } = req.body;

    let updateData = {};
    switch (action) {
      case 'activate':
        updateData.isActive = true;
        break;
      case 'deactivate':
        updateData.isActive = false;
        break;
      case 'changeRole':
        updateData.role = value;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    res.json({
      message: `${result.modifiedCount} users updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update users' });
  }
};

// Export users data
exports.exportUsers = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      // Convert to CSV format
      const csv = users.map(user => 
        `${user.name},${user.email},${user.role},${user.createdAt}`
      ).join('\n');
      
      const header = 'Name,Email,Role,Created At\n';
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(header + csv);
    } else {
      res.json(users);
    }
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ error: 'Failed to export users' });
  }
};

// System settings
exports.getSystemSettings = async (req, res) => {
  try {
    // This would typically come from a settings collection
    const settings = {
      siteName: 'ServiceHub',
      supportEmail: 'support@servicehub.com',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: false,
      maxFileUploadSize: 5, // MB
      supportedServices: ['plumbing', 'electrical', 'hvac', 'gas'],
      emergencyServiceAvailable: true
    };

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real app, you'd save these to a settings collection
    // For now, just return the updated settings
    
    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};