const { pool } = require('../db');

// GET /api/social-accounts - Get logged-in creator's social accounts
async function getSocialAccounts(req, res) {
  try {
    const userId = req.user.id;
    const [cpRows] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);
    const creatorId = cpRows.length > 0 ? cpRows[0].id : userId;

    const [rows] = await pool.execute(
      'SELECT id, creator_id, platform, username, profile_url FROM social_accounts WHERE creator_id = ? OR creator_id = ?',
      [creatorId, userId]
    );

    return res.json({ socialAccounts: rows });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/social-accounts - Add social account for logged in creator
async function addSocialAccount(req, res) {
  try {
    const userId = req.user.id;
    const { platform, username, profile_url } = req.body;

    if (!platform || !username) {
      return res.status(400).json({ error: 'Platform and username are required.' });
    }

    const [cpRows] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);
    const creatorId = cpRows.length > 0 ? cpRows[0].id : userId;

    const [result] = await pool.execute(
      'INSERT INTO social_accounts (creator_id, platform, username, profile_url) VALUES (?, ?, ?, ?)',
      [creatorId, platform, username, profile_url || '']
    );

    return res.status(201).json({
      message: 'Social account added successfully',
      socialAccountId: result.insertId
    });
  } catch (error) {
    console.error('Error adding social account:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// DELETE /api/social-accounts/:id - Remove social account
async function deleteSocialAccount(req, res) {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM social_accounts WHERE id = ?', [id]);
    return res.json({ message: 'Social account deleted successfully' });
  } catch (error) {
    console.error('Error deleting social account:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getSocialAccounts,
  addSocialAccount,
  deleteSocialAccount
};
