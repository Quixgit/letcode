ALTER TABLE apps ADD COLUMN show_on_homepage BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content JSONB NOT NULL DEFAULT '[]',
    cover_image_media_id UUID REFERENCES media(id),
    author_id UUID REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    meta_title TEXT,
    meta_description TEXT,
    og_image_url TEXT,
    published_at TIMESTAMPTZ,
    scheduled_publish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
