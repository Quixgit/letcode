CREATE TABLE page_views (
    id BIGSERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    country TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_path_date ON page_views(path, created_at);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
