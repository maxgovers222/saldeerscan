ALTER TABLE leads ADD COLUMN IF NOT EXISTS huidige_panelen_aantal INTEGER
  CHECK (huidige_panelen_aantal IS NULL OR (huidige_panelen_aantal >= 1 AND huidige_panelen_aantal <= 200));

COMMENT ON COLUMN leads.huidige_panelen_aantal IS 'Aantal bestaande zonnepanelen op dak (alleen als heeft_panelen = true)';
