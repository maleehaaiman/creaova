const express = require('express');
const router = express.Router();
const { getAllCampaigns, getCampaignById, createCampaign, updateCampaign } = require('../controllers/campaign.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);
router.post('/', authenticateToken, requireRole('brand'), createCampaign);
router.put('/:id', authenticateToken, updateCampaign);

module.exports = router;
