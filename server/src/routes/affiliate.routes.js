const express = require('express');
const router = express.Router();
const {
  createAffiliateProduct,
  updateAffiliateProduct,
  getBrandAffiliateProducts,
  getAllAffiliateProducts,
  saveAffiliateLink,
  unsaveAffiliateLink,
  getMyAffiliateLinks,
  getCreatorPublicAffiliateLinks,
  getBrandPublicAffiliateProducts,
  deleteAffiliateProduct
} = require('../controllers/affiliate.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Public — all active affiliate products (for creators to browse)
router.get('/', getAllAffiliateProducts);
router.get('/creators/:id', getCreatorPublicAffiliateLinks);
router.get('/brands/:id', getBrandPublicAffiliateProducts);

// Brand — manage their own products
router.get('/my-products', authenticateToken, requireRole('brand'), getBrandAffiliateProducts);
router.post('/', authenticateToken, requireRole('brand'), createAffiliateProduct);
router.put('/:id', authenticateToken, requireRole('brand'), updateAffiliateProduct);
router.delete('/:id', authenticateToken, requireRole('brand'), deleteAffiliateProduct);

// Creator — manage their saved links
router.get('/my-links', authenticateToken, requireRole('creator'), getMyAffiliateLinks);
router.post('/:id/save', authenticateToken, requireRole('creator'), saveAffiliateLink);
router.delete('/:id/save', authenticateToken, requireRole('creator'), unsaveAffiliateLink);

module.exports = router;
