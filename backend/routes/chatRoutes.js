const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getOrCreateChat,
  getUserChats,
  getChat,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  searchChats,
  getChatStats,
  createSupportChat
} = require('../controllers/chatController');

// Apply auth middleware to all routes
router.use(protect);

// Chat management routes
router.post('/create', getOrCreateChat);
router.get('/my', getUserChats);
router.get('/search', searchChats);
router.get('/stats', getChatStats);
router.post('/support', createSupportChat);

// Specific chat routes
router.get('/:chatId', getChat);
router.post('/:chatId/messages', sendMessage);
router.put('/:chatId/read', markAsRead);

// Message management routes
router.put('/:chatId/messages/:messageId', editMessage);
router.delete('/:chatId/messages/:messageId', deleteMessage);

module.exports = router;