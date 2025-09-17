const express = require('express');
const router = express.Router();
const { createRequest, getUserRequests } = require('../controllers/serviceRequestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);
router.get('/', protect, getUserRequests);

module.exports = router;
