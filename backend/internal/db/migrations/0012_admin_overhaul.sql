-- Soft-delete for users (replaces hard DELETE; content authored by a deleted user is kept)
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- SEO field parity: apps and blog_posts only had meta_title/meta_description/og_image_url,
-- pages already had canonical_url/noindex/structured_data.
ALTER TABLE apps ADD COLUMN canonical_url TEXT;
ALTER TABLE apps ADD COLUMN noindex BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE apps ADD COLUMN structured_data JSONB;

ALTER TABLE blog_posts ADD COLUMN canonical_url TEXT;
ALTER TABLE blog_posts ADD COLUMN noindex BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN structured_data JSONB;

-- Trash (WordPress-style soft-delete) for content, instead of immediate hard delete.
ALTER TABLE pages ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE apps ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE blog_posts ADD COLUMN deleted_at TIMESTAMPTZ;

-- Redirects: wildcard/regex matching support.
ALTER TABLE redirects ADD COLUMN is_regex BOOLEAN NOT NULL DEFAULT false;

-- Simple review/approval workflow: editor submits for review, admin approves or requests changes.
ALTER TABLE pages ADD COLUMN review_status TEXT NOT NULL DEFAULT 'none'
    CHECK (review_status IN ('none','pending_review','changes_requested','approved'));
ALTER TABLE pages ADD COLUMN review_note TEXT;
ALTER TABLE pages ADD COLUMN review_requested_by UUID REFERENCES users(id);

ALTER TABLE apps ADD COLUMN review_status TEXT NOT NULL DEFAULT 'none'
    CHECK (review_status IN ('none','pending_review','changes_requested','approved'));
ALTER TABLE apps ADD COLUMN review_note TEXT;
ALTER TABLE apps ADD COLUMN review_requested_by UUID REFERENCES users(id);

ALTER TABLE blog_posts ADD COLUMN review_status TEXT NOT NULL DEFAULT 'none'
    CHECK (review_status IN ('none','pending_review','changes_requested','approved'));
ALTER TABLE blog_posts ADD COLUMN review_note TEXT;
ALTER TABLE blog_posts ADD COLUMN review_requested_by UUID REFERENCES users(id);

-- Make roles.permissions a real, enforced capability list instead of decorative data.
-- Editor gets write/publish/delete on every content area it could already reach via the UI
-- (canEdit === role !== 'viewer') — this is a like-for-like codification of existing UI intent,
-- not a behavior change. Admin keeps the "*" wildcard (matches everything).
UPDATE roles SET permissions = '[
    "pages.write", "pages.publish", "pages.delete",
    "apps.write", "apps.publish", "apps.delete",
    "blog.write", "blog.publish", "blog.delete",
    "media.write", "media.delete",
    "redirects.write", "redirects.delete",
    "nav.write", "nav.delete",
    "testimonials.write", "testimonials.delete",
    "templates.write",
    "settings.write"
]' WHERE name = 'editor';

-- Settings change history (Shopify-style audit trail for site-wide config).
CREATE TABLE settings_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_settings_history_key ON settings_history(key, created_at DESC);
