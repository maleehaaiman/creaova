-- Payment system migration for the existing payments/collaborations tables.
-- Apply once against creator_platform before enabling a provider.

ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'INR';

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS campaign_id INT NULL,
  ADD COLUMN IF NOT EXISTS brand_user_id INT NULL,
  ADD COLUMN IF NOT EXISTS creator_user_id INT NULL,
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS provider VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS provider_payment_id VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS transaction_reference VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS paid_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS refund_reference VARCHAR(191) NULL,
  ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(500) NULL;

UPDATE payments SET status = 'PAID' WHERE LOWER(status) IN ('completed', 'complete', 'paid');
UPDATE payments SET status = 'PENDING' WHERE status IS NULL OR LOWER(status) = 'pending';

CREATE INDEX IF NOT EXISTS idx_payments_brand_user ON payments (brand_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_creator_user ON payments (creator_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments (provider_order_id);