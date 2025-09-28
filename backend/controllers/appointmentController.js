const Appointment = require('../models/Appointment');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Technician = require('../models/Technician');

// Create appointment
exports.createAppointment = async (req, res) => {
  try {
    const { 
      technicianId, 
      serviceType, 
      date, 
      timeSlot,
      description,
      address,
      estimatedDuration,
      serviceRequestId 
    } = req.body;

    // Validate required fields
    if (!technicianId || !serviceType || !date) {
      return res.status(400).json({ 
        error: 'Technician, service type, and date are required' 
      });
    }

    // Check if technician exists
    const technician = await User.findOne({ 
      _id: technicianId, 
      role: 'technician' 
    });
    
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }

    // Check for conflicting appointments
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      technician: technicianId,
      date: {
        $gte: new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
        $lte: new Date(appointmentDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
      },
      status: { $in: ['scheduled', 'in_progress'] }
    });

    if (existingAppointment) {
      return res.status(409).json({ 
        error: 'Technician is not available at this time. Please choose a different time slot.' 
      });
    }

    // Create appointment
    const newAppointment = new Appointment({
      user: req.user._id,
      technician: technicianId,
      serviceType,
      date: appointmentDate,
      timeSlot: timeSlot || 'anytime',
      description: description || '',
      address: address || '',
      estimatedDuration: estimatedDuration || 2, // Default 2 hours
      serviceRequest: serviceRequestId || null,
      status: 'scheduled'
    });

    const savedAppointment = await newAppointment.save();

    // Populate the appointment with user and technician details
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate('user', 'name email phone')
      .populate('technician', 'name email phone')
      .populate('serviceRequest');

    // If this appointment is linked to a service request, update its status
    if (serviceRequestId) {
      await ServiceRequest.findByIdAndUpdate(serviceRequestId, {
        status: 'assigned',
        assignedTechnician: technicianId,
        appointmentId: savedAppointment._id
      });
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// Get user appointments
exports.getUserAppointments = async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { user: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query)
      .populate('technician', 'name email phone')
      .populate('serviceRequest', 'serviceType description')
      .sort({ date: upcoming === 'true' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

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
    console.error('Get user appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get technician appointments
exports.getTechnicianAppointments = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { technician: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('user', 'name email phone')
      .populate('serviceRequest', 'serviceType description')
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

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
    console.error('Get technician appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get single appointment
exports.getAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id)
      .populate('user', 'name email phone')
      .populate('technician', 'name email phone')
      .populate('serviceRequest');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user has permission to view this appointment
    if (
      appointment.user._id.toString() !== req.user._id.toString() &&
      appointment.technician._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ error: 'Not authorized to view this appointment' });
    }

    res.json(appointment);

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

// Update appointment
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permissions
    const canUpdate = 
      appointment.user.toString() === req.user._id.toString() ||
      appointment.technician.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this appointment' });
    }

    // Validate status transitions
    const validTransitions = {
      'scheduled': ['confirmed', 'cancelled', 'rescheduled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': ['scheduled'], // Allow rescheduling
      'rescheduled': ['scheduled', 'cancelled']
    };

    if (updates.status && !validTransitions[appointment.status].includes(updates.status)) {
      return res.status(400).json({ 
        error: `Cannot change status from ${appointment.status} to ${updates.status}` 
      });
    }

    // Handle status-specific updates
    if (updates.status === 'completed') {
      updates.completedAt = new Date();
      
      // Update linked service request
      if (appointment.serviceRequest) {
        await ServiceRequest.findByIdAndUpdate(appointment.serviceRequest, {
          status: 'completed',
          completedAt: new Date()
        });
      }
    }

    if (updates.status === 'cancelled') {
      updates.cancelledAt = new Date();
      updates.cancellationReason = updates.cancellationReason || 'No reason provided';
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('technician', 'name email phone')
      .populate('serviceRequest');

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });

  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check permissions
    const canCancel = 
      appointment.user.toString() === req.user._id.toString() ||
      appointment.technician.toString() === req.user._id.toString();

    if (!canCancel) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed appointment' });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledAt = new Date();
    appointment.cancellationReason = reason || 'No reason provided';
    appointment.cancelledBy = req.user._id;

    await appointment.save();

    // Update linked service request if exists
    if (appointment.serviceRequest) {
      await ServiceRequest.findByIdAndUpdate(appointment.serviceRequest, {
        status: 'pending',
        assignedTechnician: null,
        appointmentId: null
      });
    }

    res.json({
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get available time slots for a technician
exports.getAvailableSlots = async (req, res) => {
  try {
    const { technicianId, date } = req.query;

    if (!technicianId || !date) {
      return res.status(400).json({ error: 'Technician ID and date are required' });
    }

    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    // Get existing appointments for the technician on this date
    const existingAppointments = await Appointment.find({
      technician: technicianId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
    }).sort({ date: 1 });

    // Generate available time slots (9 AM to 6 PM, 2-hour slots)
    const timeSlots = [];
    const startHour = 9;
    const endHour = 18;
    const slotDuration = 2; // hours

    for (let hour = startHour; hour < endHour; hour += slotDuration) {
      const slotStart = new Date(searchDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + slotDuration, 0, 0, 0);

      // Check if slot conflicts with existing appointments
      const isAvailable = !existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentStart);
        appointmentEnd.setHours(appointmentStart.getHours() + (appointment.estimatedDuration || 2));

        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        );
      });

      timeSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        label: `${hour}:00 - ${hour + slotDuration}:00`,
        available: isAvailable
      });
    }

    res.json({
      date: searchDate,
      timeSlots,
      existingAppointments: existingAppointments.length
    });

  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available time slots' });
  }
};