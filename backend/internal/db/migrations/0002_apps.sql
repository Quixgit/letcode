CREATE TABLE apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    icon_media_id UUID REFERENCES media(id),

    short_description TEXT,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]',

    privacy_policy_content TEXT,
    instructions_content TEXT,

    google_play_url TEXT,
    app_store_url TEXT,
    website_url TEXT,
    pricing_note TEXT,

    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    sort_order INT NOT NULL DEFAULT 0,

    meta_title TEXT,
    meta_description TEXT,
    og_image_url TEXT,

    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_slug ON apps(slug);

CREATE TABLE app_screenshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_screenshots_app ON app_screenshots(app_id);
