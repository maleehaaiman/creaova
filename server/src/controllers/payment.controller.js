const { pool } = require('../db');
const { getPaymentProvider } = require('../services/payment');

const paymentSelect = `
  SELECT p.id, p.collaboration_id, p.campaign_id, p.brand_user_id, p.creator_user_id,
         p.amount, p.currency, p.status, p.provider, p.provider_order_id,
         p.provider_payment_id, p.transaction_reference, p.payment_date, p.paid_at,
         p.refund_reference, p.failure_reason, p.created_at, p.updated_at,
         c.title AS campaign_title, bp.company_name, u.name AS creator_name
  FROM payments p
  JOIN collaborations col ON p.collaboration_id = col.id
  JOIN campaigns c ON col.campaign_id = c.id
  LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
  LEFT JOIN creator_profiles cp ON col.creator_id = cp.id OR col.creator_id = cp.user_id
  LEFT JOIN users u ON cp.user_id = u.id OR col.creator_id = u.id
`;

async function getCollaborationPaymentContext(collaborationId) {
  const [rows] = await pool.execute(
    `SELECT col.id, col.campaign_id, col.creator_id, col.agreed_amount, col.currency,
            c.title AS campaign_title, c.brand_id,
            COALESCE(bp.user_id, c.brand_id) AS brand_user_id,
            COALESCE(cp.user_id, col.creator_id) AS creator_user_id
     FROM collaborations col
     JOIN campaigns c ON col.campaign_id = c.id
     LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
     LEFT JOIN creator_profiles cp ON col.creator_id = cp.id OR col.creator_id = cp.user_id
     WHERE col.id = ?`,
    [collaborationId]
  );
  return rows[0];
}

function normaliseStatus(status) {
  const value = String(status || '').toUpperCase();
  return value === 'COMPLETED' ? 'PAID' : value;
}

function providerError(error, res) {
  return res.status(error.statusCode || 500).json({ error: error.message || 'Payment provider error' });
}

// GET /api/payments - List only payments belonging to the authenticated user.
async function getPayments(req, res) {
  try {
    const field = req.user.role === 'brand' ? 'p.brand_user_id' : req.user.role === 'creator' ? 'p.creator_user_id' : null;
    if (!field) return res.status(403).json({ error: 'Payments are available only to brands and creators.' });
    const [rows] = await pool.execute(`${paymentSelect} WHERE ${field} = ? ORDER BY p.created_at DESC`, [req.user.id]);
    return res.json({ payments: rows.map((row) => ({ ...row, status: normaliseStatus(row.status) })) });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/payments/:id - Read a payment only from the user's side of the collaboration.
async function getPaymentById(req, res) {
  try {
    const field = req.user.role === 'brand' ? 'p.brand_user_id' : req.user.role === 'creator' ? 'p.creator_user_id' : null;
    if (!field) return res.status(403).json({ error: 'Payment access denied.' });
    const [rows] = await pool.execute(`${paymentSelect} WHERE p.id = ? AND ${field} = ?`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found.' });
    return res.json({ payment: { ...rows[0], status: normaliseStatus(rows[0].status) } });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/payments/create - Brand creates a provider order using the server-side agreed amount.
async function createPaymentOrder(req, res) {
  try {
    const collaborationId = Number.parseInt(req.body.collaboration_id, 10);
    if (!Number.isInteger(collaborationId)) return res.status(400).json({ error: 'A valid collaboration_id is required.' });

    const collaboration = await getCollaborationPaymentContext(collaborationId);
    if (!collaboration) return res.status(404).json({ error: 'Collaboration not found.' });
    if (Number(collaboration.brand_user_id) !== Number(req.user.id)) return res.status(403).json({ error: 'You do not own this collaboration.' });

    const amount = Number(collaboration.agreed_amount);
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'The collaboration has no valid agreed payment amount.' });

    const [existing] = await pool.execute(
      `SELECT id, provider_order_id, status FROM payments
       WHERE collaboration_id = ? AND status IN ('PENDING', 'PROCESSING')
       ORDER BY id DESC LIMIT 1`,
      [collaborationId]
    );
    if (existing.length) {
      const provider = getPaymentProvider();
      return res.json({
        payment: existing[0],
        requiresExistingOrder: true,
        checkout: {
          provider: provider.name,
          providerOrderId: existing[0].provider_order_id,
          publicKey: process.env.PAYMENT_PROVIDER_KEY,
          amount: Math.round(amount * 100),
          currency: collaboration.currency || 'INR'
        }
      });
    }

    const provider = getPaymentProvider();
    const order = await provider.createOrder({
      amount: Math.round(amount * 100),
      currency: collaboration.currency || 'INR',
      receipt: `creova_collaboration_${collaborationId}_${Date.now()}`
    });

    const [result] = await pool.execute(
      `INSERT INTO payments
       (collaboration_id, campaign_id, brand_user_id, creator_user_id, amount, currency, status, provider, provider_order_id)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
      [collaborationId, collaboration.campaign_id, collaboration.brand_user_id, collaboration.creator_user_id, amount, collaboration.currency || 'INR', order.provider, order.providerOrderId]
    );
    return res.status(201).json({ payment: { id: result.insertId, collaboration_id: collaborationId, amount, currency: collaboration.currency || 'INR', status: 'PENDING', provider: order.provider, provider_order_id: order.providerOrderId }, checkout: order });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return providerError(error, res);
  }
}

// POST /api/payments/verify - Provider signature is verified on the server before PAID.
async function verifyPayment(req, res) {
  try {
    const { payment_id: paymentId, order_id: orderId, signature } = req.body;
    if (!paymentId || !orderId || !signature) return res.status(400).json({ error: 'Provider verification fields are required.' });
    const [rows] = await pool.execute('SELECT * FROM payments WHERE provider_order_id = ? AND brand_user_id = ?', [orderId, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment order not found.' });
    const payment = rows[0];
    const provider = getPaymentProvider();
    if (!provider.verifyPayment({ orderId, paymentId, signature })) {
      await pool.execute('UPDATE payments SET status = \'FAILED\', failure_reason = ? WHERE id = ?', ['Provider signature verification failed', payment.id]);
      return res.status(400).json({ error: 'Payment verification failed.' });
    }
    await pool.execute(
      `UPDATE payments SET status = 'PAID', provider_payment_id = ?, transaction_reference = ?, payment_date = CURRENT_DATE, paid_at = NOW(), failure_reason = NULL WHERE id = ? AND status IN ('PENDING', 'PROCESSING')`,
      [paymentId, paymentId, payment.id]
    );
    const [updated] = await pool.execute(`${paymentSelect} WHERE p.id = ?`, [payment.id]);
    return res.json({ payment: { ...updated[0], status: 'PAID' } });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return providerError(error, res);
  }
}

// POST /api/payments/webhook - Provider webhook is independently verified using the raw body.
async function handleWebhook(req, res) {
  try {
    const provider = getPaymentProvider();
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-payment-signature'];
    if (!provider.verifyWebhook(req.rawBody || Buffer.from(JSON.stringify(req.body)), signature)) return res.status(400).json({ error: 'Invalid webhook signature.' });
    const event = req.body;
    const entity = event.payload?.payment?.entity || event.payload?.refund?.entity;
    const orderId = entity?.order_id;
    if (orderId) {
      if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
        await pool.execute(`UPDATE payments SET status = 'PAID', provider_payment_id = ?, transaction_reference = ?, payment_date = CURRENT_DATE, paid_at = NOW() WHERE provider_order_id = ? AND status IN ('PENDING', 'PROCESSING')`, [entity.id, entity.id, orderId]);
      } else if (event.event === 'payment.failed') {
        await pool.execute(`UPDATE payments SET status = 'FAILED', failure_reason = ? WHERE provider_order_id = ? AND status IN ('PENDING', 'PROCESSING')`, [entity.error_description || 'Payment failed', orderId]);
      }
    }
    return res.json({ received: true });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return providerError(error, res);
  }
}

// POST /api/payments/:id/refund - Provider refund structure; original payment remains stored.
async function refundPayment(req, res) {
  try {
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ? AND brand_user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Payment not found.' });
    if (!['PAID', 'PROCESSING', 'RELEASED'].includes(normaliseStatus(rows[0].status))) return res.status(400).json({ error: 'Only a paid payment can be refunded.' });
    const provider = getPaymentProvider();
    const refund = await provider.refund({ paymentId: rows[0].provider_payment_id, amount: Math.round(Number(rows[0].amount) * 100), currency: rows[0].currency });
    await pool.execute(`UPDATE payments SET status = 'REFUNDED', refund_reference = ? WHERE id = ?`, [refund.reference, rows[0].id]);
    return res.json({ message: 'Refund requested.', refundReference: refund.reference });
  } catch (error) {
    console.error('Error refunding payment:', error);
    return providerError(error, res);
  }
}

module.exports = { getPayments, getPaymentById, createPaymentOrder, verifyPayment, handleWebhook, refundPayment };
