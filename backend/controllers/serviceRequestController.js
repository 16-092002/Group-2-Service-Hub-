const ServiceRequest = require('../models/ServiceRequest');

exports.createServiceRequest = async (req, res) => {
  try {
    const { serviceType, description, location, preferredDate } = req.body;

    const newRequest = new ServiceRequest({
      user: req.user._id,
      serviceType,
      description,
      location,
      preferredDate
    });

    const saved = await newRequest.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ user: req.user._id });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find().populate('user').populate('assignedTechnician');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
