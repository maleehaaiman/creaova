const { pool } = require('../db');

// GET /api/brands - Get list of brand profiles
async function getAllBrands(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT bp.id, bp.user_id, bp.company_name, bp.description, bp.website, bp.logo, u.email, u.created_at
       FROM brand_profiles bp
       JOIN users u ON bp.user_id = u.id
       ORDER BY bp.id DESC`
    );
    return res.json({ brands: rows });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/brands/:id - Get brand profile by ID or user_id
async function getBrandById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT bp.id, bp.user_id, bp.company_name, bp.description, bp.website, bp.logo, u.email, u.created_at
       FROM brand_profiles bp
       JOIN users u ON bp.user_id = u.id
       WHERE bp.id = ? OR bp.user_id = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Brand profile not found.' });
    }

    return res.json({ brand: rows[0] });
  } catch (error) {
    console.error('Error fetching brand profile:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/brands/profile - Update logged in brand's profile
async function updateMyBrandProfile(req, res) {
  try {
    const userId = req.user.id;
    const { company_name, description, website, logo } = req.body;

    const [existing] = await pool.execute('SELECT id FROM brand_profiles WHERE user_id = ?', [userId]);

    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO brand_profiles (user_id, company_name, description, website, logo) VALUES (?, ?, ?, ?, ?)',
        [userId, company_name || req.user.name || 'Company', description || '', website || '', logo || '']
      );
    } else {
      await pool.execute(
        `UPDATE brand_profiles
         SET company_name = ?, description = ?, website = ?, logo = ?
         WHERE user_id = ?`,
        [
          company_name !== undefined ? company_name : '',
          description !== undefined ? description : '',
          website !== undefined ? website : '',
          logo !== undefined ? logo : '',
          userId
        ]
      );
    }

    const [updated] = await pool.execute(
      `SELECT bp.id, bp.user_id, bp.company_name, bp.description, bp.website, bp.logo, u.email
       FROM brand_profiles bp
       JOIN users u ON bp.user_id = u.id
       WHERE bp.user_id = ?`,
      [userId]
    );

    return res.json({
      message: 'Brand profile updated successfully',
      brand: updated[0]
    });
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getAllBrands,
  getBrandById,
  updateMyBrandProfile
};
