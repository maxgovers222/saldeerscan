-- Voeg last_pinged_at toe aan pseo_pages zodat de indexing-cron
-- nooit-gepingde pagina's altijd voor kan laten gaan op al-eerder-gepingde.
ALTER TABLE pseo_pages
  ADD COLUMN IF NOT EXISTS last_pinged_at timestamptz DEFAULT NULL;

-- Index zodat de cron efficiënt kan filteren op NULL-waarden
CREATE INDEX IF NOT EXISTS idx_pseo_pages_last_pinged_at
  ON pseo_pages (last_pinged_at ASC NULLS FIRST);

COMMENT ON COLUMN pseo_pages.last_pinged_at IS
  'Tijdstip van meest recente succesvolle Google Indexing API ping. NULL = nog nooit gepingt.';
