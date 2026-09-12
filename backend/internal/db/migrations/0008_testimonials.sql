CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name TEXT NOT NULL,
    author_title TEXT,
    quote TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    app_id UUID REFERENCES apps(id),
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_published ON testimonials(is_published, sort_order);
