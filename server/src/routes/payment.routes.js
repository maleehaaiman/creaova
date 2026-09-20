const express = require('express');
const router = express.Router();
const { getPayments, createPayment } = require('../controllers/payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);

module.exports = router;
