-- Enable RLS on all public tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pseo_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE netcongestie_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE kennisbank_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nieuws_articles ENABLE ROW LEVEL SECURITY;

-- service_role bypasses RLS automatically — no policy needed for it.
-- Deny all access to the anon and authenticated roles (server-side only via service_role).

CREATE POLICY "no_anon_leads" ON leads FOR ALL TO anon USING (false);
CREATE POLICY "no_anon_pseo_pages" ON pseo_pages FOR ALL TO anon USING (false);
CREATE POLICY "no_anon_netcongestie_cache" ON netcongestie_cache FOR ALL TO anon USING (false);
CREATE POLICY "no_anon_b2b_partners" ON b2b_partners FOR ALL TO anon USING (false);
CREATE POLICY "no_anon_kennisbank_articles" ON kennisbank_articles FOR ALL TO anon USING (false);
CREATE POLICY "no_anon_nieuws_articles" ON nieuws_articles FOR ALL TO anon USING (false);
