CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  naam TEXT,
  email TEXT,
  telefoon TEXT,

  adres TEXT NOT NULL,
  postcode TEXT,
  huisnummer TEXT,
  stad TEXT,
  provincie TEXT,
  lat FLOAT,
  lon FLOAT,

  bag_data JSONB DEFAULT '{}'::jsonb,
  energielabel TEXT,
  ep_data JSONB DEFAULT '{}'::jsonb,

  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  netcongestie_status TEXT CHECK (netcongestie_status IN ('ROOD', 'ORANJE', 'GROEN')),
  roi_berekening JSONB DEFAULT '{}'::jsonb,

  meterkast_analyse JSONB DEFAULT '{}'::jsonb,
  plaatsing_analyse JSONB DEFAULT '{}'::jsonb,
  omvormer_analyse JSONB DEFAULT '{}'::jsonb,

  isde_pre_fill JSONB DEFAULT '{}'::jsonb,

  b2b_exported_at TIMESTAMPTZ,
  b2b_export_status TEXT DEFAULT 'pending',
  b2b_partner_id UUID,

  gdpr_consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  consent_ip INET,
  consent_tekst TEXT,

  funnel_step INTEGER DEFAULT 1,
  funnel_completed BOOLEAN DEFAULT FALSE,

  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT
);

CREATE INDEX leads_postcode_idx ON leads(postcode);
CREATE INDEX leads_b2b_export_idx ON leads(b2b_export_status) WHERE funnel_completed = TRUE AND gdpr_consent = TRUE;
ALTER TABLE leads ADD CONSTRAINT b2b_requires_consent
  CHECK (b2b_export_status = 'pending' OR gdpr_consent = TRUE);
