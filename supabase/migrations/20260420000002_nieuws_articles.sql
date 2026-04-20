CREATE TABLE nieuws_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  titel         TEXT NOT NULL,
  meta_description TEXT,
  intro         TEXT,
  hoofdtekst    TEXT,
  faq_items     JSONB DEFAULT '[]'::jsonb,
  json_ld       JSONB DEFAULT '{}'::jsonb,
  topic_seed    TEXT,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at  TIMESTAMPTZ,
  generated_at  TIMESTAMPTZ,
  revalidate_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX nieuws_slug_idx      ON nieuws_articles(slug);
CREATE INDEX nieuws_status_idx    ON nieuws_articles(status);
CREATE INDEX nieuws_published_idx ON nieuws_articles(published_at DESC) WHERE status = 'published';
