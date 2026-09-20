const { pool } = require('../db');

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
    const { bio, niche, profile_image, instagram, youtube, tiktok } = req.body;

    // Check if profile exists
    const [existing] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);

    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO creator_profiles (user_id, bio, niche, profile_image, instagram, youtube, tiktok) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          bio || '',
          niche || '',
          profile_image || '',
          instagram || '',
          youtube || '',
          tiktok || ''
        ]
      );
    } else {
      await pool.execute(
        `UPDATE creator_profiles 
         SET bio = ?, niche = ?, profile_image = ?, instagram = ?, youtube = ?, tiktok = ?
         WHERE user_id = ?`,
        [
          bio !== undefined ? bio : '',
          niche !== undefined ? niche : '',
          profile_image !== undefined ? profile_image : '',
          instagram !== undefined ? instagram : '',
          youtube !== undefined ? youtube : '',
          tiktok !== undefined ? tiktok : '',
          userId
        ]
      );
    }

    // Fetch updated profile
    const [updated] = await pool.execute(
      `SELECT 
        c.id, c.user_id, c.bio, c.niche, c.profile_image, c.instagram, c.youtube, c.tiktok,
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
