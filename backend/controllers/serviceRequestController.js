const ServiceRequest = require('../models/ServiceRequest');

exports.createRequest = async (req, res) => {
  const { serviceType, description, phone } = req.body;

  try {
    const request = new ServiceRequest({
      user: req.user._id,
      serviceType,
      description,
      phone,
      status: 'pending',
    });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ user: req.user._id }).populate('assignedTechnician', 'user service phone');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
