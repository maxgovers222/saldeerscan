-- Voeg status-kolom toe aan pseo_pages voor draft/published workflow
-- De andere gewenste kolommen (wijk_naam, bouwjaar_avg, ai_content) bestaan al
-- als wijk, gem_bouwjaar, hoofdtekst — lib/pseo.ts mapt deze via PseoPageData.

ALTER TABLE pseo_pages
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published'));

CREATE INDEX IF NOT EXISTS pseo_status_idx ON pseo_pages (status);
