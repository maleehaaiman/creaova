const express = require('express');
const router = express.Router();
const { getAllBrands, getBrandById, updateMyBrandProfile } = require('../controllers/brand.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', getAllBrands);
router.get('/:id', getBrandById);
router.put('/profile', authenticateToken, requireRole('brand'), updateMyBrandProfile);

module.exports = router;
