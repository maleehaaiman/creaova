const { pool } = require('../db');

// GET /api/campaigns - List all campaigns
async function getAllCampaigns(req, res) {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT c.id, c.brand_id, c.title, c.description, c.budget, c.deadline, c.status, c.created_at,
             bp.company_name, bp.logo, bp.website
      FROM campaigns c
      LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
      WHERE 1=1
    `;

    const queryParams = [];

    if (status) {
      query += ' AND c.status = ?';
      queryParams.push(status);
    }

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ? OR bp.company_name LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.execute(query, queryParams);
    return res.json({ campaigns: rows });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/campaigns/:id - Get specific campaign details
async function getCampaignById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT c.id, c.brand_id, c.title, c.description, c.budget, c.deadline, c.status, c.created_at,
              bp.company_name, bp.logo, bp.website, bp.description AS brand_description
       FROM campaigns c
       LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
       WHERE c.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    return res.json({ campaign: rows[0] });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/campaigns - Create a new campaign (Brand only)
async function createCampaign(req, res) {
  try {
    const userId = req.user.id;
    const { title, description, budget, deadline } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Campaign title is required.' });
    }

    // Get brand profile id for this user
    const [brandRows] = await pool.execute('SELECT id FROM brand_profiles WHERE user_id = ?', [userId]);
    const brandId = brandRows.length > 0 ? brandRows[0].id : userId;

    const [result] = await pool.execute(
      `INSERT INTO campaigns (brand_id, title, description, budget, deadline, status)
       VALUES (?, ?, ?, ?, ?, 'open')`,
      [brandId, title, description || '', budget || null, deadline || null]
    );

    const newCampaignId = result.insertId;

    const [newCampaign] = await pool.execute('SELECT * FROM campaigns WHERE id = ?', [newCampaignId]);

    return res.status(201).json({
      message: 'Campaign created successfully',
      campaign: newCampaign[0]
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/campaigns/:id - Update campaign details or status
async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    const { title, description, budget, deadline, status } = req.body;

    await pool.execute(
      `UPDATE campaigns
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           budget = COALESCE(?, budget),
           deadline = COALESCE(?, deadline),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [title || null, description || null, budget || null, deadline || null, status || null, id]
    );

    const [updated] = await pool.execute('SELECT * FROM campaigns WHERE id = ?', [id]);

    return res.json({
      message: 'Campaign updated successfully',
      campaign: updated[0]
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign
};
