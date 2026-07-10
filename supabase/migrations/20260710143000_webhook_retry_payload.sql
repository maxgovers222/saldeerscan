ALTER TABLE webhook_deliveries
  ADD COLUMN IF NOT EXISTS payload_body TEXT,
  ADD COLUMN IF NOT EXISTS payload_signature TEXT;
