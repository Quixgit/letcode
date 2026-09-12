ALTER TABLE nav_items ADD COLUMN menu_type TEXT NOT NULL DEFAULT 'link'
    CHECK (menu_type IN ('link', 'dropdown', 'mega_menu'));
ALTER TABLE nav_items ADD COLUMN menu_content JSONB;
