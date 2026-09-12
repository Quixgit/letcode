CREATE TABLE site_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    preview_image_media_id UUID REFERENCES media(id),
    default_sections JSONB NOT NULL DEFAULT '[]',
    header_config JSONB NOT NULL DEFAULT '{}',
    footer_config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO site_templates (name, slug, description, header_config, footer_config, is_active, default_sections) VALUES
(
    'Minimal',
    'minimal',
    'Простой вид: hero и сетка приложений, без богатых секций.',
    '{"menu_alignment": "right", "logo_position": "left", "sticky": false, "show_cta_button": false}',
    '{"menu_alignment": "left"}',
    true,
    '[]'
),
(
    'Nexus Light',
    'nexus-light',
    'Богатый светлый лендинг: hero с data-viz, витрины мокапов, аннотированный скриншот, сетка фич, шаги и отзывы.',
    '{"menu_alignment": "right", "logo_position": "left", "sticky": true, "show_cta_button": true}',
    '{"menu_alignment": "left"}',
    false,
    '[{"type": "app_mockup_panel", "compact": false, "panels": [{"title": "Live Alerts", "description": "Every alert, grouped by client, tagged by severity.", "mockup": "list"}, {"title": "Response times", "description": "Latency trends across your connected sources.", "mockup": "chart"}]}, {"type": "annotated_screenshot", "image_media_id": "", "image_url": "", "annotations": [{"text": "Filter by source", "side": "left", "y_percent": 25}, {"text": "Severity badges", "side": "left", "y_percent": 60}, {"text": "Tap for details", "side": "right", "y_percent": 40}, {"text": "Swipe to acknowledge", "side": "right", "y_percent": 75}]}, {"type": "app_mockup_panel", "compact": true, "panels": [{"title": "Sources", "description": "Alertmanager, Grafana, webhooks.", "mockup": "toggles"}, {"title": "Alerts", "description": "Grouped, severity-tagged.", "mockup": "list"}, {"title": "Settings", "description": "Escalation and schedules.", "mockup": "toggles"}]}, {"type": "feature_grid", "columns": 2, "items": [{"icon": "ti-bell-ringing", "title": "One inbox for every alert", "description": "Alertmanager, Grafana, Uptime Kuma and webhooks, grouped in one feed."}, {"icon": "ti-users", "title": "Built for on-call teams", "description": "Escalation policies and shared schedules keep everyone in sync."}, {"icon": "ti-devices", "title": "Real push notifications", "description": "Not another email digest \u2014 an actual alert on your phone."}, {"icon": "ti-lock", "title": "Your data, retained briefly", "description": "30-day retention, then permanently deleted. Export anytime."}]}, {"type": "apps_showcase"}, {"type": "how_it_works", "steps": [{"icon": "ti-plug", "label": "Connect a source"}, {"icon": "ti-bell-ringing", "label": "Alerts land in your feed"}, {"icon": "ti-checkbox", "label": "Acknowledge and resolve"}]}, {"type": "testimonials_carousel"}]'
);
