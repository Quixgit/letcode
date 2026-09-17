-- Submissions from any "contact_form" page-builder block. One table for every form on the
-- site — form_key (set per-block by the admin) is what groups them in the admin inbox.
CREATE TABLE form_submissions (
    id BIGSERIAL PRIMARY KEY,
    form_key TEXT NOT NULL,
    form_title TEXT,
    page_path TEXT,
    data JSONB NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX idx_form_submissions_form_key ON form_submissions(form_key);

-- Editor's permission list is an explicit array (see 0012_admin_overhaul.sql), not a wildcard —
-- without this, an editor could design a contact_form block but never see or manage what it
-- collects. Admin already has the "*" wildcard and needs no change.
UPDATE roles SET permissions = permissions || '["submissions.write", "submissions.delete"]'::jsonb
WHERE name = 'editor';
