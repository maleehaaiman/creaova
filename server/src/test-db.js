const { pool, testConnection } = require('./db');

async function runDiagnostics() {
  console.log('--- Creova DB Connection Diagnostics ---');
  console.log(`DB Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`DB Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`DB User: ${process.env.DB_USER || 'creator_app'}`);
  console.log(`DB Name: ${process.env.DB_NAME || 'creator_platform'}`);

  const isConnected = await testConnection();

  if (isConnected) {
    try {
      const [tables] = await pool.execute('SHOW TABLES');
      console.log('\n Found existing tables in DB:');
      tables.forEach(t => console.log(' - ' + Object.values(t)[0]));
    } catch (err) {
      console.error('Error querying metadata:', err.message);
    }
  } else {
    console.log('\n Failed to connect to MySQL. Ensure MySQL service is running.');
  }

  process.exit(0);
}

runDiagnostics();
