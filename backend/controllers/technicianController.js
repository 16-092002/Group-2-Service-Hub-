// backend/controllers/technicianController.js (Enhanced)
const Technician = require('../models/Technician');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

// Get all technicians with filtering and pagination
exports.getTechnicians = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      service,
      city,
      minRating,
      maxDistance,
      sortBy = 'averageRating',
      order = 'desc',
      latitude,
      longitude,
      emergency = false
    } = req.query;

    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Build query
    let query = { isActive: true };
    
    if (service) {
      query.service = { $in: [service] };
    }
    
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    
    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    if (emergency === 'true') {
      query['availability.emergencyAvailable'] = true;
    }

    let technicians;
    
    // If location provided, use geospatial query
    if (latitude && longitude) {
      const maxDist = maxDistance ? parseInt(maxDistance) : 25;
      technicians = await Technician.findNearby(
        parseFloat(latitude), 
        parseFloat(longitude), 
        maxDist,
        service
      );
      
      // Apply additional filters
      technicians = technicians.filter(tech => {
        if (minRating && tech.averageRating < parseFloat(minRating)) return false;
        if (emergency === 'true' && !tech.availability?.emergencyAvailable) return false;
        return true;
      });
      
      // Apply pagination
      const total = technicians.length;
      technicians = technicians.slice(skip, skip + parseInt(limit));
      
      return res.json({
        technicians,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTechnicians: total,
          hasNext: skip + technicians.length < total,
          hasPrev: page > 1
        }
      });
    } else {
      // Regular query without geolocation
      technicians = await Technician.find(query)
        .populate('user', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit));
    }

    const totalTechnicians = await Technician.countDocuments(query);

    res.json({
      technicians,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTechnicians / limit),
        totalTechnicians,
        hasNext: skip + technicians.length < totalTechnicians,
        hasPrev: page > 1
      },
      filters: {
        services: await Technician.distinct('service'),
        cities: await Technician.distinct('location.city'),
        averageRating: {
          min: await Technician.findOne().sort({ averageRating: 1 }).select('averageRating'),
          max: await Technician.findOne().sort({ averageRating: -1 }).select('averageRating')
        }
      }
    });
  } catch (err) {
    console.error('Get technicians error:', err);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  }
};

// Get technician profile by ID
exports.getTechnicianById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const technician = await Technician.findById(id)
      .populate('user', 'name email createdAt');

    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Get recent completed jobs count
    const recentJobs = await ServiceRequest.countDocuments({
      assignedTechnician: technician.user,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    res.json({
      ...technician.toObject(),
      recentJobsCount: recentJobs
    });
  } catch (err) {
    console.error('Get technician by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch technician' });
  }
};

// Get current technician's profile
exports.getMyProfile = async (req, res) => {
  try {
    const technician = await Technician.findOne({ user: req.user._id })
      .populate('user', 'name email');

    if (!technician) {
      return res.status(404).json({ error: 'Technician profile not found' });
    }

    res.json(technician);
  } catch (err) {
    console.error('Get my profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Create or update technician profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      service,
      phone,
      whatsappNumber,
      location,
      experience,
      certifications,
      availability,
      pricing,
      profileImage,
      gallery,
      languages,
      tools,
      serviceAreas,
      businessLicense,
      insurance
    } = req.body;

    // Verify user is a technician
    const user = await User.findById(userId);
    if (user.role !== 'technician') {
      return res.status(400).json({ error: 'User must have technician role' });
    }

    let technician = await Technician.findOne({ user: userId });

    const technicianData = {
      user: userId,
      service: Array.isArray(service) ? service : [service],
      phone,
      whatsappNumber: whatsappNumber || '+13828850973',
      location,
      experience,
      certifications,
      availability,
      pricing,
      profileImage,
      gallery,
      languages,
      tools,
      serviceAreas,
      businessLicense,
      insurance
    };

    if (technician) {
      // Update existing profile
      Object.assign(technician, technicianData);
      await technician.save();
      
      res.json({
        message: 'Profile updated successfully',
        technician
      });
    } else {
      // Create new profile
      technician = new Technician(technicianData);
      await technician.save();
      
      res.status(201).json({
        message: 'Profile created successfully',
        technician
      });
    }
  } catch (err) {
    console.error('Create/update profile error:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};

// Update availability
exports.updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    
    const technician = await Technician.findOne({ user: req.user._id });
    if (!technician) {
      return res.status(404).json({ error: 'Technician profile not found' });
    }

    technician.availability = { ...technician.availability, ...availability };
    await technician.save();

    res.json({
      message: 'Availability updated successfully',
      availability: technician.availability
    });
  } catch (err) {
    console.error('Update availability error:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Get technician statistics
exports.getStatistics = async (req, res) => {
  try {
    const technicianId = req.user._id;
    
    const [
      totalRequests,
      completedJobs,
      pendingRequests,
      avgRating,
      monthlyEarnings
    ] = await Promise.all([
      ServiceRequest.countDocuments({ assignedTechnician: technicianId }),
      ServiceRequest.countDocuments({ 
        assignedTechnician: technicianId, 
        status: 'completed' 
      }),
      ServiceRequest.countDocuments({ 
        assignedTechnician: technicianId, 
        status: { $in: ['assigned', 'in_progress'] }
      }),
      Technician.findOne({ user: technicianId }).select('averageRating totalRatings'),
      ServiceRequest.aggregate([
        {
          $match: {
            assignedTechnician: technicianId,
            status: 'completed',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$cost' },
            jobCount: { $sum: 1 }
          }
        }
      ])
    ]);

    const completionRate = totalRequests > 0 ? 
      Math.round((completedJobs / totalRequests) * 100) : 0;

    res.json({
      totalRequests,
      completedJobs,
      pendingRequests,
      completionRate,
      averageRating: avgRating?.averageRating || 0,
      totalRatings: avgRating?.totalRatings || 0,
      monthlyStats: monthlyEarnings[0] || { totalEarnings: 0, jobCount: 0 }
    });
  } catch (err) {
    console.error('Get statistics error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Search technicians by service and location
exports.searchTechnicians = async (req, res) => {
  try {
    const { 
      serviceType, 
      latitude, 
      longitude, 
      radius = 25,
      emergency = false 
    } = req.query;

    if (!serviceType) {
      return res.status(400).json({ error: 'Service type is required' });
    }

    let query = {
      service: { $in: [serviceType] },
      isActive: true
    };

    if (emergency === 'true') {
      query['availability.emergencyAvailable'] = true;
    }

    let technicians;

    if (latitude && longitude) {
      technicians = await Technician.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseInt(radius),
        serviceType
      );
      
      if (emergency === 'true') {
        technicians = technicians.filter(
          tech => tech.availability?.emergencyAvailable
        );
      }
    } else {
      technicians = await Technician.find(query)
        .populate('user', 'name email')
        .sort({ averageRating: -1, completedJobs: -1 })
        .limit(20);
    }

    res.json({
      technicians,
      count: technicians.length,
      searchCriteria: {
        serviceType,
        location: latitude && longitude ? { latitude, longitude, radius } : null,
        emergency
      }
    });
  } catch (err) {
    console.error('Search technicians error:', err);
    res.status(500).json({ error: 'Failed to search technicians' });
  }
};

// Toggle technician active status
exports.toggleActiveStatus = async (req, res) => {
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
  } catch (err) {
    console.error('Toggle active status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};