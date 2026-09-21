const express = require('express');
const router = express.Router();
const { getPayments, getPaymentById, createPaymentOrder, verifyPayment, handleWebhook, refundPayment } = require('../controllers/payment.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticateToken, getPayments);
router.get('/:id', authenticateToken, getPaymentById);
router.post('/create', authenticateToken, requireRole('brand'), createPaymentOrder);
router.post('/verify', authenticateToken, requireRole('brand'), verifyPayment);
router.post('/webhook', handleWebhook);
router.post('/:id/refund', authenticateToken, requireRole('brand'), refundPayment);

module.exports = router;
