const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { JWT_SECRET } = require('../middleware/auth.middleware');

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['creator', 'brand'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "creator" or "brand".' });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user strictly using defined columns: name, email, password, role
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const userId = result.insertId;

    // Initialize corresponding profile table
    if (role === 'creator') {
      await pool.execute(
        'INSERT INTO creator_profiles (user_id, bio, niche, profile_image, instagram, youtube, tiktok) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, '', '', '', '', '', '']
      );
    } else if (role === 'brand') {
      await pool.execute(
        'INSERT INTO brand_profiles (user_id, company_name, description, website, logo) VALUES (?, ?, ?, ?, ?)',
        [userId, name, '', '', '']
      );
    }

    // Generate JWT token
    const token = jwt.sign({ id: userId, email, role, name }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name,
        email,
        role
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Server error during registration: ' + error.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, created_at FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Server error during login: ' + error.message });
  }
}

// GET /api/auth/me
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS creator_profile_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        creator_user_id INT NOT NULL,
        viewer_user_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY daily_creator_view (creator_user_id, viewer_user_id, viewed_at)
      )`
    );
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = rows[0];
    let profile = null;

    if (user.role === 'creator') {
      const [creatorRows] = await pool.execute(
        'SELECT id, bio, niche, profile_image, instagram, youtube, tiktok FROM creator_profiles WHERE user_id = ?',
        [userId]
      );
      if (creatorRows.length > 0) profile = creatorRows[0];
    } else if (user.role === 'brand') {
      const [brandRows] = await pool.execute(
        'SELECT id, company_name, description, website, logo FROM brand_profiles WHERE user_id = ?',
        [userId]
      );
      if (brandRows.length > 0) profile = brandRows[0];
    }

    const [messageRows] = await pool.execute(
      user.role === 'creator'
        ? `SELECT COUNT(*) AS total FROM messages m
           JOIN users sender ON sender.id = m.sender_id
           WHERE m.receiver_id = ? AND sender.role = 'brand'`
        : 'SELECT COUNT(*) AS total FROM messages WHERE sender_id = ? OR receiver_id = ?',
      user.role === 'creator' ? [userId] : [userId, userId]
    );
    const [collaborationRows] = await pool.execute(
      user.role === 'creator'
        ? `SELECT COUNT(*) AS total FROM collaborations col
           LEFT JOIN creator_profiles cp ON col.creator_id = cp.id OR col.creator_id = cp.user_id
           WHERE cp.user_id = ?`
        : `SELECT COUNT(*) AS total FROM collaborations col
           JOIN campaigns c ON col.campaign_id = c.id
           LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
           WHERE bp.user_id = ?`,
      [userId]
    );
    const [viewRows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM creator_profile_views WHERE creator_user_id = ?',
      [userId]
    );
    const [applicationRows] = await pool.execute(
      user.role === 'creator'
        ? `SELECT COUNT(*) AS total FROM campaign_applications ca
           LEFT JOIN creator_profiles cp ON ca.creator_id = cp.id OR ca.creator_id = cp.user_id
           WHERE cp.user_id = ?`
        : `SELECT COUNT(*) AS total FROM campaign_applications ca
           JOIN campaigns c ON ca.campaign_id = c.id
           LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
           WHERE bp.user_id = ?`,
      [userId]
    );

    return res.json({
      user,
      profile,
      stats: {
        profileViews: Number(viewRows[0]?.total || 0),
        messages: Number(messageRows[0]?.total || 0),
        collaborations: Number(collaborationRows[0]?.total || 0),
        applications: Number(applicationRows[0]?.total || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/auth/me - Update the logged in user's display name
async function updateCurrentUser(req, res) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';

    if (!name) {
      return res.status(400).json({ error: 'Display name is required.' });
    }

    if (name.length > 80) {
      return res.status(400).json({ error: 'Display name must be 80 characters or fewer.' });
    }

    await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json({ message: 'Display name updated successfully', user: rows[0] });
  } catch (error) {
    console.error('Error updating current user:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateCurrentUser
};
