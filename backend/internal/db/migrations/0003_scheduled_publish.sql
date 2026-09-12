ALTER TABLE pages ADD COLUMN scheduled_publish_at TIMESTAMPTZ;
ALTER TABLE apps ADD COLUMN scheduled_publish_at TIMESTAMPTZ;
