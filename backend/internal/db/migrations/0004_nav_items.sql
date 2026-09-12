CREATE TABLE nav_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT NOT NULL CHECK (location IN ('header', 'footer')),
    parent_id UUID REFERENCES nav_items(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nav_items_location ON nav_items(location, sort_order);

-- Seed: reproduce the footer structure already hardcoded on the public site,
-- so switching to DB-driven nav is visually invisible until someone edits it.
INSERT INTO nav_items (id, label, url, location, parent_id, sort_order) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Product', '#', 'footer', NULL, 0),
    ('00000000-0000-0000-0000-000000000002', 'Company', '#', 'footer', NULL, 1),
    ('00000000-0000-0000-0000-000000000003', 'Legal', '#', 'footer', NULL, 2);

INSERT INTO nav_items (label, url, location, parent_id, sort_order) VALUES
    ('Apps', '/#apps', 'footer', '00000000-0000-0000-0000-000000000001', 0),
    ('About', '/about', 'footer', '00000000-0000-0000-0000-000000000002', 0),
    ('Contact', '/contact', 'footer', '00000000-0000-0000-0000-000000000002', 1),
    ('Privacy policy', '/privacy', 'footer', '00000000-0000-0000-0000-000000000003', 0),
    ('Terms of service', '/terms', 'footer', '00000000-0000-0000-0000-000000000003', 1);
