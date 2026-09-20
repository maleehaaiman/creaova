const express = require('express');
const router = express.Router();
const { getAllCreators, getCreatorById, recordCreatorView, updateMyProfile } = require('../controllers/creator.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', getAllCreators);
router.post('/:id/view', authenticateToken, recordCreatorView);
router.get('/:id', getCreatorById);
router.put('/profile', authenticateToken, requireRole('creator'), updateMyProfile);

module.exports = router;
