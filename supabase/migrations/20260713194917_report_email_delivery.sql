ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS report_email_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS report_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_email_error TEXT;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_report_email_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_report_email_status_check
  CHECK (
    report_email_status IN ('pending', 'sent', 'failed', 'not_configured')
  );

CREATE INDEX IF NOT EXISTS leads_report_email_failed_idx
  ON leads (created_at DESC)
  WHERE report_email_status = 'failed';
