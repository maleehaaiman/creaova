const { pool } = require('../db');

// GET /api/messages/:otherUserId - Get chat messages with a specific user
async function getChatHistory(req, res) {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const [rows] = await pool.execute(
      `SELECT m.id, m.sender_id, m.receiver_id, m.message, m.sent_at,
              su.name AS sender_name, ru.name AS receiver_name
       FROM messages m
       JOIN users su ON m.sender_id = su.id
       JOIN users ru ON m.receiver_id = ru.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.sent_at ASC`,
      [userId, otherUserId, otherUserId, userId]
    );

    return res.json({ messages: rows });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// POST /api/messages - Send a direct message
async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { receiver_id, message } = req.body;

    if (!receiver_id || !message) {
      return res.status(400).json({ error: 'receiver_id and message are required.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [senderId, receiver_id, message]
    );

    // Send notification to receiver
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, 0)',
      [
        receiver_id,
        'New Message Received',
        `You received a new message from ${req.user.name || 'a user'}.`
      ]
    );

    return res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/messages/conversations - List user's recent conversations
async function getConversations(req, res) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT DISTINCT 
         CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS contact_id,
         u.name AS contact_name, u.email AS contact_email, u.role AS contact_role
       FROM messages m
       JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
       WHERE m.sender_id = ? OR m.receiver_id = ?`,
      [userId, userId, userId, userId]
    );

    return res.json({ conversations: rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

module.exports = {
  getChatHistory,
  sendMessage,
  getConversations
};
