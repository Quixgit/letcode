package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type SettingsHandler struct {
	Pool *pgxpool.Pool
}

var publicSettingsKeys = map[string]bool{
	"site_name":                   true,
	"tagline":                     true,
	"logo_media_id":               true,
	"logo_url":                    true,
	"social_twitter":              true,
	"social_github":               true,
	"social_linkedin":             true,
	"footer_copyright":            true,
	"site_mode":                   true,
	"homepage_layout":             true,
	"homepage_apps_position":      true,
	"homepage_content_slug":       true,
	"homepage_stats":              true,
	"homepage_sections":           true,
	"homepage_blocks":             true,
	"footer_app_store_url":        true,
	"footer_google_play_url":      true,
	"blog_columns":                true,
	"contact_phone":               true,
	"contact_email":               true,
	"contact_address":             true,
	"footer_certifications":       true,
	"show_decorative_backgrounds": true, // faint themed background illustrations on a few sections — on/off, no specific image hardcoded

	// default_og_image_url predates this migration (Settings → SEO defaults tab already let an
	// admin pick one) but was never actually added here — so it was saved, but had zero effect
	// on the public site. Fixed as part of this pass rather than introducing a second, redundant
	// "default OG image" setting.
	"default_og_image_url": true,

	// SEO defaults (site-wide), admin "SEO" page
	"seo_title_template":           true, // e.g. "%s — lecode.tech", %s substituted with the page's own title
	"seo_default_meta_description": true,
	"google_site_verification":     true,
	"bing_site_verification":       true,
	"yandex_site_verification":     true,
	"seo_sitewide_noindex":         true, // emergency "noindex the whole site" switch (e.g. staging)
	"seo_organization_name":        true,
	"seo_organization_logo_url":    true,
	"seo_show_breadcrumbs":         true, // visible breadcrumb trail + its BreadcrumbList JSON-LD on blog/app/page templates
	"seo_json_ld_enabled":          true, // ItemList/FAQPage/Article/Product structured data (everything except breadcrumbs)

	// Analytics tab — previously saved but never added here, so the tracking snippet in
	// RootLayout (which reads getPublicSettings()) could never actually see them and no script
	// ever rendered. Fixed as part of this pass.
	"analytics_provider": true,
	"analytics_id":       true,
}

func (h *SettingsHandler) fetchAll(ctx context.Context) (map[string]interface{}, error) {
	rows, err := h.Pool.Query(ctx, "SELECT key, value FROM site_settings")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	settings := map[string]interface{}{}
	for rows.Next() {
		var key string
		var value json.RawMessage
		if err := rows.Scan(&key, &value); err != nil {
			continue
		}
		var decoded interface{}
		if err := json.Unmarshal(value, &decoded); err == nil {
			settings[key] = decoded
		}
	}
	return settings, nil
}

func (h *SettingsHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	settings, err := h.fetchAll(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, settings)
}

func (h *SettingsHandler) ListPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	settings, err := h.fetchAll(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	public := map[string]interface{}{}
	for k, v := range settings {
		if publicSettingsKeys[k] {
			public[k] = v
		}
	}
	return c.JSON(http.StatusOK, public)
}

func (h *SettingsHandler) Update(c echo.Context) error {
	var body map[string]interface{}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	for key, value := range body {
		raw, err := json.Marshal(value)
		if err != nil {
			continue
		}

		var oldRaw json.RawMessage
		h.Pool.QueryRow(ctx, "SELECT value FROM site_settings WHERE key=$1", key).Scan(&oldRaw)

		_, err = h.Pool.Exec(ctx,
			`INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, now())
			 ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now()`,
			key, raw,
		)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
		}

		if string(oldRaw) != string(raw) {
			var oldValueArg interface{}
			if len(oldRaw) > 0 {
				oldValueArg = oldRaw
			}
			h.Pool.Exec(ctx,
				`INSERT INTO settings_history (key, old_value, new_value, changed_by) VALUES ($1,$2,$3,$4)`,
				key, oldValueArg, raw, userID)
		}
	}

	settings, err := h.fetchAll(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, settings)
}

func (h *SettingsHandler) History(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	rows, err := h.Pool.Query(ctx,
		`SELECT sh.id, sh.key, sh.old_value, sh.new_value, sh.created_at, u.email
		 FROM settings_history sh LEFT JOIN users u ON u.id = sh.changed_by
		 ORDER BY sh.created_at DESC LIMIT 200`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID             string          `json:"id"`
		Key            string          `json:"key"`
		OldValue       json.RawMessage `json:"old_value"`
		NewValue       json.RawMessage `json:"new_value"`
		CreatedAt      time.Time       `json:"created_at"`
		ChangedByEmail *string         `json:"changed_by_email"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.Key, &i.OldValue, &i.NewValue, &i.CreatedAt, &i.ChangedByEmail); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}
