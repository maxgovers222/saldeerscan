CREATE TABLE kennisbank_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  titel         TEXT NOT NULL,
  meta_description TEXT,
  intro         TEXT,
  hoofdtekst    TEXT,
  faq_items     JSONB DEFAULT '[]'::jsonb,
  json_ld       JSONB DEFAULT '{}'::jsonb,
  category      TEXT DEFAULT 'algemeen' CHECK (category IN ('saldering', 'zonnepanelen', 'netcongestie', 'subsidie', 'algemeen')),
  related_slugs TEXT[] DEFAULT '{}',
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  generated_at  TIMESTAMPTZ,
  revalidate_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX kennisbank_slug_idx    ON kennisbank_articles(slug);
CREATE INDEX kennisbank_status_idx  ON kennisbank_articles(status);
CREATE INDEX kennisbank_category_idx ON kennisbank_articles(category);
