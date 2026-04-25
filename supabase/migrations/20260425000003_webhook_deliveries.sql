-- Webhook delivery tracking voor retry-systeem
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  partner_naam TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'pending_retry')),
  attempts SMALLINT NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_webhook_deliveries_lead_partner ON webhook_deliveries(lead_id, partner_id);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending_retry';
