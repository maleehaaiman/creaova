const { pool } = require('../db');

// POST /api/applications - Creator applies to a campaign
async function applyToCampaign(req, res) {
  try {
    const userId = req.user.id;
    const { campaign_id, message } = req.body;

    if (!campaign_id) {
      return res.status(400).json({ error: 'Campaign ID is required.' });
    }

    // Get creator_profiles ID or user_id
    const [creatorRows] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);
    const creatorId = creatorRows.length > 0 ? creatorRows[0].id : userId;

    // Check if already applied
    const [existing] = await pool.execute(
      'SELECT id FROM campaign_applications WHERE campaign_id = ? AND (creator_id = ? OR creator_id = ?)',
      [campaign_id, creatorId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already applied to this campaign.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO campaign_applications (campaign_id, creator_id, message, status) VALUES (?, ?, ?, "pending")',
      [campaign_id, creatorId, message || '']
    );

    // Create notification for brand user
    const [campRows] = await pool.execute(
      `SELECT c.title, bp.user_id 
       FROM campaigns c 
       LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
       WHERE c.id = ?`,
      [campaign_id]
    );

    if (campRows.length > 0 && campRows[0].user_id) {
      await pool.execute(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, 0)',
        [
          campRows[0].user_id,
          'New Campaign Application',
          `A creator applied to your campaign "${campRows[0].title}".`
        ]
      );
    }

    return res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: result.insertId
    });
  } catch (error) {
    console.error('Error applying to campaign:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/applications/campaign/:campaignId - Get applications for a campaign
async function getCampaignApplications(req, res) {
  try {
    const { campaignId } = req.params;

    const [rows] = await pool.execute(
      `SELECT ca.id, ca.campaign_id, ca.creator_id, ca.message, ca.status, ca.applied_at,
              cp.bio, cp.niche, cp.profile_image, cp.instagram, cp.youtube, cp.tiktok,
              u.name AS creator_name, u.email AS creator_email
       FROM campaign_applications ca
       LEFT JOIN creator_profiles cp ON ca.creator_id = cp.id OR ca.creator_id = cp.user_id
       LEFT JOIN users u ON cp.user_id = u.id OR ca.creator_id = u.id
       WHERE ca.campaign_id = ?
       ORDER BY ca.applied_at DESC`,
      [campaignId]
    );

    return res.json({ applications: rows });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/applications/my - Get logged in creator's applications
async function getMyApplications(req, res) {
  try {
    const userId = req.user.id;
    const [creatorRows] = await pool.execute('SELECT id FROM creator_profiles WHERE user_id = ?', [userId]);
    const creatorId = creatorRows.length > 0 ? creatorRows[0].id : userId;

    const [rows] = await pool.execute(
      `SELECT ca.id, ca.campaign_id, ca.creator_id, ca.message, ca.status, ca.applied_at,
              c.title AS campaign_title, c.budget, c.status AS campaign_status,
              bp.company_name, bp.logo
       FROM campaign_applications ca
       JOIN campaigns c ON ca.campaign_id = c.id
       LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
       WHERE ca.creator_id = ? OR ca.creator_id = ?
       ORDER BY ca.applied_at DESC`,
      [creatorId, userId]
    );

    return res.json({ applications: rows });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/applications/:id/status - Update application status (accepted / rejected)
async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted, rejected, or pending.' });
    }

    await pool.execute('UPDATE campaign_applications SET status = ? WHERE id = ?', [status, id]);

    // Fetch application details
    const [appRows] = await pool.execute('SELECT * FROM campaign_applications WHERE id = ?', [id]);
    if (appRows.length > 0 && status === 'accepted') {
      const app = appRows[0];
      // Get campaign budget
      const [cRows] = await pool.execute('SELECT budget FROM campaigns WHERE id = ?', [app.campaign_id]);
      const budget = cRows.length > 0 ? cRows[0].budget : 0;

      // Auto-create collaboration if not already existing
      const [collabExisting] = await pool.execute(
        'SELECT id FROM collaborations WHERE campaign_id = ? AND creator_id = ?',
        [app.campaign_id, app.creator_id]
      );

      if (collabExisting.length === 0) {
        await pool.execute(
          'INSERT INTO collaborations (campaign_id, creator_id, status, agreed_amount) VALUES (?, ?, "active", ?)',
          [app.campaign_id, app.creator_id, budget]
        );
      }
    }

    return res.json({ message: `Application status updated to ${status}` });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  applyToCampaign,
  getCampaignApplications,
  getMyApplications,
  updateApplicationStatus
};
