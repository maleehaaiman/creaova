const { pool } = require('../../db');

async function addColumn(table, definition) {
  try {
    await pool.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch (error) {
    if (!/duplicate column|already exists/i.test(error.message)) throw error;
  }
}

async function ensurePaymentSchema() {
  await addColumn('collaborations', 'currency CHAR(3) NOT NULL DEFAULT \'INR\'');
  await addColumn('payments', 'campaign_id INT NULL');
  await addColumn('payments', 'brand_user_id INT NULL');
  await addColumn('payments', 'creator_user_id INT NULL');
  await addColumn('payments', 'currency CHAR(3) NOT NULL DEFAULT \'INR\'');
  await addColumn('payments', 'provider VARCHAR(40) NULL');
  await addColumn('payments', 'provider_order_id VARCHAR(191) NULL');
  await addColumn('payments', 'provider_payment_id VARCHAR(191) NULL');
  await addColumn('payments', 'transaction_reference VARCHAR(191) NULL');
  await addColumn('payments', 'paid_at DATETIME NULL');
  await addColumn('payments', 'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  await addColumn('payments', 'refund_reference VARCHAR(191) NULL');
  await addColumn('payments', 'failure_reason VARCHAR(500) NULL');
  await pool.execute(
    `UPDATE payments p
     JOIN collaborations col ON p.collaboration_id = col.id
     JOIN campaigns c ON col.campaign_id = c.id
     LEFT JOIN brand_profiles bp ON c.brand_id = bp.id OR c.brand_id = bp.user_id
     LEFT JOIN creator_profiles cp ON col.creator_id = cp.id OR col.creator_id = cp.user_id
     SET p.campaign_id = col.campaign_id,
         p.brand_user_id = COALESCE(bp.user_id, c.brand_id),
         p.creator_user_id = COALESCE(cp.user_id, col.creator_id)
     WHERE p.campaign_id IS NULL OR p.brand_user_id IS NULL OR p.creator_user_id IS NULL`
  );
  await pool.execute(`UPDATE payments SET status = 'PAID' WHERE LOWER(status) IN ('completed', 'complete', 'paid')`);
  await pool.execute(`UPDATE payments SET status = 'PENDING' WHERE status IS NULL OR LOWER(status) = 'pending'`);
}

module.exports = { ensurePaymentSchema };