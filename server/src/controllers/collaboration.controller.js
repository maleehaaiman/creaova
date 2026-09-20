const { pool } = require('../db');

// GET /api/collaborations - List active collaborations
async function getCollaborations(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = `
      SELECT col.id, col.campaign_id, col.creator_id, col.start_date, col.end_date, col.status, col.agreed_amount, col.created_at,
             c.title AS campaign_title, c.description AS campaign_description,
             bp.company_name, bp.logo,
             u.name AS creator_name, u.email AS creator_email,
             cp.profile_image, cp.niche
      FROM collaborations col
      JOIN campaigns c ON col.campaign_id = c.id
      LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
      LEFT JOIN creator_profiles cp ON col.creator_id = cp.id OR col.creator_id = cp.user_id
      LEFT JOIN users u ON cp.user_id = u.id OR col.creator_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];

    if (userRole === 'creator') {
      // Find creator profile ID
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

    query += ' ORDER BY col.created_at DESC';

    const [rows] = await pool.execute(query, queryParams);
    return res.json({ collaborations: rows });
  } catch (error) {
    console.error('Error fetching collaborations:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/collaborations/:id - Update collaboration details (dates, agreed amount, status)
async function updateCollaboration(req, res) {
  try {
    const { id } = req.params;
    const { start_date, end_date, status, agreed_amount } = req.body;

    await pool.execute(
      `UPDATE collaborations
       SET start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date),
           status = COALESCE(?, status),
           agreed_amount = COALESCE(?, agreed_amount)
       WHERE id = ?`,
      [start_date || null, end_date || null, status || null, agreed_amount || null, id]
    );

    const [updated] = await pool.execute('SELECT * FROM collaborations WHERE id = ?', [id]);

    return res.json({
      message: 'Collaboration updated successfully',
      collaboration: updated[0]
    });
  } catch (error) {
    console.error('Error updating collaboration:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getCollaborations,
  updateCollaboration
};
