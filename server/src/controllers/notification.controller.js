const { pool } = require('../db');

// GET /api/notifications - Get logged-in user's notifications
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      'SELECT id, user_id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const unreadCount = rows.filter(n => !n.is_read).length;

    return res.json({
      notifications: rows,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/notifications/:id/read - Mark notification as read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// PUT /api/notifications/read-all - Mark all as read
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
