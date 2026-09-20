const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage, getConversations } = require('../controllers/message.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/conversations', authenticateToken, getConversations);
router.get('/:otherUserId', authenticateToken, getChatHistory);
router.post('/', authenticateToken, sendMessage);

module.exports = router;
