const express = require('express');
const router = express.Router();
const { getSocialAccounts, addSocialAccount, deleteSocialAccount } = require('../controllers/social.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, getSocialAccounts);
router.post('/', authenticateToken, requireRole('creator'), addSocialAccount);
router.delete('/:id', authenticateToken, requireRole('creator'), deleteSocialAccount);

module.exports = router;
