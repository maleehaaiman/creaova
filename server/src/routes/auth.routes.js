const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateCurrentUser, deleteCurrentUser } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/me', authenticateToken, updateCurrentUser);
router.delete('/me', authenticateToken, deleteCurrentUser);

module.exports = router;
