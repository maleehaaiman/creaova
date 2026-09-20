const express = require('express');
const router = express.Router();
const { applyToCampaign, getCampaignApplications, getMyApplications, updateApplicationStatus } = require('../controllers/application.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, requireRole('creator'), applyToCampaign);
router.get('/my', authenticateToken, getMyApplications);
router.get('/campaign/:campaignId', authenticateToken, getCampaignApplications);
router.put('/:id/status', authenticateToken, updateApplicationStatus);

module.exports = router;
