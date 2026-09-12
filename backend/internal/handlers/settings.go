package handlers

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type SettingsHandler struct {
	Pool *pgxpool.Pool
}

var publicSettingsKeys = map[string]bool{
	"site_name":              true,
	"tagline":                true,
	"logo_media_id":          true,
	"logo_url":               true,
	"social_twitter":         true,
	"social_github":          true,
	"social_linkedin":        true,
	"footer_copyright":       true,
	"site_mode":              true,
	"homepage_layout":        true,
	"homepage_apps_position": true,
	"homepage_content_slug":  true,
	"homepage_stats":         true,
	"homepage_sections":      true,
	"homepage_blocks":        true,
	"footer_app_store_url":   true,
	"footer_google_play_url": true,
	"blog_columns":           true,
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
	for key, value := range body {
		raw, err := json.Marshal(value)
		if err != nil {
			continue
		}
		_, err = h.Pool.Exec(ctx,
			`INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, now())
			 ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now()`,
			key, raw,
		)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
		}
	}

	settings, err := h.fetchAll(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, settings)
}
