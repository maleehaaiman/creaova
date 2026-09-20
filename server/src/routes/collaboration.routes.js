const express = require('express');
const router = express.Router();
const { getCollaborations, updateCollaboration } = require('../controllers/collaboration.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, getCollaborations);
router.put('/:id', authenticateToken, updateCollaboration);

module.exports = router;
