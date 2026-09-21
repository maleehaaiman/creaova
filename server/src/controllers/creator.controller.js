const { pool } = require('../db');
const { encrypt, lastFour } = require('../services/payout-details');

async function ensurePayoutColumns() {
  for (const definition of [
    'payout_method VARCHAR(40) NULL',
    'payout_account_name VARCHAR(160) NULL',
    'payout_bank_name VARCHAR(160) NULL',
    'payout_account_encrypted TEXT NULL',
    'payout_account_last4 CHAR(4) NULL',
    'payout_ifsc VARCHAR(20) NULL',
    'payout_upi_id VARCHAR(255) NULL',
    'payout_email VARCHAR(255) NULL',
    'payout_updated_at TIMESTAMP NULL'
  ]) {
    try {
      await pool.execute(`ALTER TABLE creator_profiles ADD COLUMN ${definition}`);
    } catch (error) {
      if (!/duplicate column|already exists/i.test(error.message)) throw error;
    }
  }
}

ensurePayoutColumns().catch((error) => console.error('Creator payout schema error:', error.message));

// GET /api/creators - List/search creators
async function getAllCreators(req, res) {
  try {
    const { niche, search } = req.query;

    let query = `
      SELECT 
        c.id, c.user_id, c.bio, c.niche, c.profile_image, c.instagram, c.youtube, c.tiktok,
        u.name, u.email, u.created_at
      FROM creator_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE u.role = 'creator'
    `;

    const queryParams = [];

    if (niche) {
      query += ' AND c.niche LIKE ?';
      queryParams.push(`%${niche}%`);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR c.bio LIKE ? OR c.niche LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY u.created_at DESC';

    const [creators] = await pool.execute(query, queryParams);

    return res.json({ creators });
  } catch (error) {
    console.error('Error fetching creators:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/creators/:id - Get specific creator profile
async function getCreatorById(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT 
        c.id, c.user_id, c.bio, c.niche, c.profile_image, c.instagram, c.youtube, c.tiktok,
        u.name, u.email, u.created_at
      FROM creator_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ? OR c.user_id = ?`,
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Creator profile not found.' });
    }

    return res.json({ creator: rows[0] });
  } catch (error) {
    console.error('Error fetching creator by ID:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/creators/:id/view - Record a brand viewing a creator profile
async function recordCreatorView(req, res) {
  try {
    if (req.user.role !== 'brand') {
      return res.status(403).json({ error: 'Only brands can record creator profile views.' });
    }

    const { id } = req.params;
    const [creatorRows] = await pool.execute(
      'SELECT user_id FROM creator_profiles WHERE id = ? OR user_id = ?',
      [id, id]
    );
    if (creatorRows.length === 0) return res.status(404).json({ error: 'Creator profile not found.' });

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS creator_profile_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_user_id INT NOT NULL,
        viewer_user_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY daily_creator_view (creator_user_id, viewer_user_id, viewed_at)
      )`
    );
    await pool.execute(
      `INSERT INTO creator_profile_views (creator_user_id, viewer_user_id, viewed_at)
       SELECT ?, ?, CURRENT_TIMESTAMP
       WHERE NOT EXISTS (
         SELECT 1 FROM creator_profile_views
         WHERE creator_user_id = ? AND viewer_user_id = ? AND DATE(viewed_at) = CURRENT_DATE
       )`,
      [creatorRows[0].user_id, req.user.id, creatorRows[0].user_id, req.user.id]
    );
    return res.json({ message: 'Creator profile view recorded' });
  } catch (error) {
    console.error('Error recording creator profile view:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/creators/profile - Update logged in creator's profile
async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const { bio, niche, profile_image, instagram, youtube, tiktok, payout_method, payout_account_name, payout_bank_name, payout_account_number, payout_ifsc, payout_upi_id, payout_email } = req.body;
    const allowedMethods = ['bank_transfer', 'upi', 'paypal'];
    if (payout_method !== undefined && payout_method !== '' && !allowedMethods.includes(payout_method)) {
      return res.status(400).json({ error: 'Unsupported payout method.' });
    }
    if (payout_account_number !== undefined && payout_account_number !== '' && !/^\d{6,34}$/.test(String(payout_account_number).replace(/\s+/g, ''))) {
      return res.status(400).json({ error: 'Bank account number must contain 6 to 34 digits.' });
    }
    if (payout_ifsc !== undefined && payout_ifsc !== '' && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(payout_ifsc)) {
      return res.status(400).json({ error: 'Enter a valid IFSC code.' });
    }
    const encryptedAccount = payout_account_number ? encrypt(String(payout_account_number).replace(/\s+/g, '')) : undefined;
    const accountLast4 = payout_account_number ? lastFour(payout_account_number) : undefined;

    // Check if profile exists
    const [existing] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO creator_profiles
         (user_id, bio, niche, profile_image, instagram, youtube, tiktok, payout_method, payout_account_name, payout_bank_name, payout_account_encrypted, payout_account_last4, payout_ifsc, payout_upi_id, payout_email, payout_updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          bio || '',
          niche || '',
          profile_image || '',
          instagram || '',
          youtube || '',
          tiktok || '', payout_method || null, payout_account_name || null, payout_bank_name || null, encryptedAccount || null, accountLast4 || null, payout_ifsc || null, payout_upi_id || null, payout_email || null
        ]
      );
    } else {
      await pool.execute(
        `UPDATE creator_profiles 
         SET bio = ?, niche = ?, profile_image = ?, instagram = ?, youtube = ?, tiktok = ?,
           payout_method = COALESCE(?, payout_method), payout_account_name = COALESCE(?, payout_account_name),
           payout_bank_name = COALESCE(?, payout_bank_name), payout_account_encrypted = COALESCE(?, payout_account_encrypted),
           payout_account_last4 = COALESCE(?, payout_account_last4), payout_ifsc = COALESCE(?, payout_ifsc),
           payout_upi_id = COALESCE(?, payout_upi_id), payout_email = COALESCE(?, payout_email), payout_updated_at = NOW()
         WHERE user_id = ?`,
        [
          bio !== undefined ? bio : '',
          niche !== undefined ? niche : '',
          profile_image !== undefined ? profile_image : '',
          instagram !== undefined ? instagram : '',
          youtube !== undefined ? youtube : '',
          tiktok !== undefined ? tiktok : '',
          payout_method || null, payout_account_name || null, payout_bank_name || null, encryptedAccount || null, accountLast4 || null, payout_ifsc || null, payout_upi_id || null, payout_email || null, userId
        ]
      );
    }

    // Fetch updated profile
    const [updated] = await pool.execute(
      `SELECT 
        c.id, c.user_id, c.bio, c.niche, c.profile_image, c.instagram, c.youtube, c.tiktok,
        c.payout_method, c.payout_account_name, c.payout_bank_name, c.payout_account_last4,
        c.payout_ifsc, c.payout_upi_id, c.payout_email, c.payout_updated_at,
        u.name, u.email
      FROM creator_profiles c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?`,
      [userId]
    );

    return res.json({
      message: 'Profile updated successfully',
      creator: updated[0]
    });
  } catch (error) {
    console.error('Error updating creator profile:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getAllCreators,
  getCreatorById,
  recordCreatorView,
  updateMyProfile
};
