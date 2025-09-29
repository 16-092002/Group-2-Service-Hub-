const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { allowRoles } = require('../middleware/roleMiddleware');
const Technician = require('../models/Technician');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

// Get all technicians (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, service, location } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    
    if (service) {
      query.service = service;
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const technicians = await Technician.find(query)
      .populate('user', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ averageRating: -1 });

    const total = await Technician.countDocuments(query);

    res.json({
      technicians,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
});

// Get technician profile (own profile)
router.get('/me', protect, allowRoles('technician'), async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id })
      .populate('user', 'name email');

    if (!technician) {
      return res.status(404).json({ error: 'Technician profile not found' });
    }

    res.json(technician);
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update technician profile
router.post('/me', protect, allowRoles('technician'), async (req, res) => {
  try {
    const { service, phone, location } = req.body;

    // Check if profile already exists
    let technician = await Technician.findOne({ user: req.user._id });

    if (technician) {
      // Update existing profile
      technician.service = service || technician.service;
      technician.phone = phone || technician.phone;
      technician.location = location || technician.location;
      await technician.save();
    } else {
      // Create new profile
      technician = new Technician({
        user: req.user._id,
        service,
        phone,
        location
      });
      await technician.save();
    }

    const populatedTechnician = await Technician.findById(technician._id)
      .populate('user', 'name email');

    res.status(201).json({
      message: 'Profile saved successfully',
      technician: populatedTechnician
    });
  } catch (error) {
    console.error('Create/Update profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Get technician statistics
router.get('/stats', protect, allowRoles('technician'), async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id });
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician profile not found' });
    }

    // Get all service requests
    const totalRequests = await ServiceRequest.countDocuments({
      assignedTechnician: req.user._id
    });

    const completedJobs = await ServiceRequest.countDocuments({
      assignedTechnician: req.user._id,
      status: 'completed'
    });

    const pendingRequests = await ServiceRequest.countDocuments({
      assignedTechnician: req.user._id,
      status: { $in: ['pending', 'assigned', 'in_progress'] }
    });

    const completionRate = totalRequests > 0 
      ? Math.round((completedJobs / totalRequests) * 100) 
      : 0;

    res.json({
      totalRequests,
      completedJobs,
      pendingRequests,
      completionRate,
      averageRating: technician.averageRating || 0,
      totalRatings: technician.totalRatings || 0,
      monthlyEarnings: 0 // Placeholder for future implementation
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Toggle technician active status
router.put('/toggle-active', protect, allowRoles('technician'), async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id });
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician profile not found' });
    }

    technician.isActive = !technician.isActive;
    await technician.save();

    res.json({
      message: `Status updated to ${technician.isActive ? 'active' : 'inactive'}`,
      isActive: technician.isActive
    });
  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Search technicians by service and location
router.get('/search', async (req, res) => {
  try {
    const { service, location, minRating } = req.query;

    let query = { isActive: true };

    if (service) {
      query.service = service;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    const technicians = await Technician.find(query)
      .populate('user', 'name email')
      .sort({ averageRating: -1, completedJobs: -1 })
      .limit(20);

    res.json({
      technicians,
      count: technicians.length
    });
  } catch (error) {
    console.error('Search technicians error:', error);
    res.status(500).json({ error: 'Failed to search technicians' });
  }
});

// Get technician by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const technician = await Technician.findById(req.params.id)
      .populate('user', 'name email createdAt');

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Get recent completed jobs count
    const recentJobs = await ServiceRequest.countDocuments({
      assignedTechnician: technician.user,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      ...technician.toObject(),
      recentJobsCount: recentJobs
    });
  } catch (error) {
    console.error('Get technician by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch technician' });
  }
});

module.exports = router;