const { pool } = require('../db');

// GET /api/meta/tables - List database tables and status
async function getTableStatus(req, res) {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    const tableList = tables.map(t => Object.values(t)[0]);

    return res.json({
      database: process.env.DB_NAME || 'creator_platform',
      tables: tableList
    });
  } catch (error) {
    console.error('Error fetching meta table status:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

// GET /api/meta/describe/:table - Describe table schema dynamically
async function describeTable(req, res) {
  try {
    const tableName = req.params.table;
    // Basic SQL injection protection for table names
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: 'Invalid table name format' });
    }

    const [columns] = await pool.execute(`DESCRIBE \`${tableName}\``);
    return res.json({
      table: tableName,
      columns
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error describing table: ' + error.message });
  }
}

module.exports = {
  getTableStatus,
  describeTable
};
