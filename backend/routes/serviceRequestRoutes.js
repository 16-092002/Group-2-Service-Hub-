const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createServiceRequest,
  getMyServiceRequests,
  getAllRequests
} = require('../controllers/serviceRequestController');

// Create a request (user)
router.post('/', protect, createServiceRequest);

// Get all requests by logged-in user
router.get('/my', protect, getMyServiceRequests);

// Get all (admin/dev only for now)
router.get('/all', protect, getAllRequests); 

module.exports = router;
