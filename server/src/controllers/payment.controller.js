const { pool } = require('../db');

// GET /api/payments - List payments for logged-in user
async function getPayments(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT p.id, p.collaboration_id, p.amount, p.status, p.payment_date, p.created_at,
             c.title AS campaign_title,
             bp.company_name,
             u.name AS creator_name
      FROM payments p
      JOIN collaborations col ON p.collaboration_id = col.id
      JOIN campaigns c ON col.campaign_id = c.id
      LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
      LEFT JOIN creator_profiles cp ON col.creator_id = cp.id OR col.creator_id = cp.user_id
      LEFT JOIN users u ON cp.user_id = u.id OR col.creator_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (userRole === 'creator') {
      const [cpRows] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);
      const creatorId = cpRows.length > 0 ? cpRows[0].id : userId;
      query += ' AND (col.creator_id = ? OR col.creator_id = ?)';
      queryParams.push(creatorId, userId);
    } else if (userRole === 'brand') {
      const [bpRows] = await pool.execute('SELECT id FROM brand_profiles WHERE user_id = ?', [userId]);
      const brandId = bpRows.length > 0 ? bpRows[0].id : userId;
      query += ' AND (c.brand_id = ? OR c.brand_id = ?)';
      queryParams.push(brandId, userId);
    }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(query, queryParams);
    return res.json({ payments: rows });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/payments - Create/release a payment for a collaboration
async function createPayment(req, res) {
  try {
    const { collaboration_id, amount, payment_date, status } = req.body;

    if (!collaboration_id || !amount) {
      return res.status(400).json({ error: 'collaboration_id and amount are required.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO payments (collaboration_id, amount, status, payment_date) VALUES (?, ?, ?, ?)',
      [collaboration_id, amount, status || 'completed', payment_date || new Date().toISOString().split('T')[0]]
    );

    return res.status(201).json({
      message: 'Payment recorded successfully',
      paymentId: result.insertId
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getPayments,
  createPayment
};
