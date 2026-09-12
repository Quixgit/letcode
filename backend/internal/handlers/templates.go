package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type TemplateHandler struct {
	Pool *pgxpool.Pool
}

type siteTemplate struct {
	ID                  string          `json:"id"`
	Name                string          `json:"name"`
	Slug                string          `json:"slug"`
	Description         *string         `json:"description"`
	PreviewImageMediaID *string         `json:"preview_image_media_id"`
	PreviewImageURL     *string         `json:"preview_image_url"`
	DefaultSections     json.RawMessage `json:"default_sections"`
	HeaderConfig        json.RawMessage `json:"header_config"`
	FooterConfig        json.RawMessage `json:"footer_config"`
	ThemeConfig         json.RawMessage `json:"theme_config"`
	IsActive            bool            `json:"is_active"`
}

const templateSelectSQL = `SELECT t.id, t.name, t.slug, t.description, t.preview_image_media_id, m.url,
	 t.default_sections, t.header_config, t.footer_config, t.theme_config, t.is_active
	 FROM site_templates t LEFT JOIN media m ON m.id = t.preview_image_media_id`

func scanTemplate(row interface{ Scan(...interface{}) error }) (siteTemplate, error) {
	var t siteTemplate
	err := row.Scan(&t.ID, &t.Name, &t.Slug, &t.Description, &t.PreviewImageMediaID, &t.PreviewImageURL,
		&t.DefaultSections, &t.HeaderConfig, &t.FooterConfig, &t.ThemeConfig, &t.IsActive)
	return t, err
}

func (h *TemplateHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx, templateSelectSQL+" ORDER BY t.created_at ASC")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []siteTemplate{}
	for rows.Next() {
		t, err := scanTemplate(rows)
		if err == nil {
			items = append(items, t)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *TemplateHandler) GetActivePublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	row := h.Pool.QueryRow(ctx, templateSelectSQL+" WHERE t.is_active = true LIMIT 1")
	t, err := scanTemplate(row)
	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "no_active_template"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, t)
}

func (h *TemplateHandler) Activate(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	id := c.Param("id")

	var defaultSections json.RawMessage
	if err := h.Pool.QueryRow(ctx, "SELECT default_sections FROM site_templates WHERE id=$1", id).Scan(&defaultSections); err != nil {
		if err == pgx.ErrNoRows {
			return c.JSON(http.StatusNotFound, map[string]string{"error": "template_not_found"})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}

	tx, err := h.Pool.Begin(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "activate_failed"})
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, "UPDATE site_templates SET is_active = false WHERE is_active = true"); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "activate_failed"})
	}
	if _, err := tx.Exec(ctx, "UPDATE site_templates SET is_active = true WHERE id=$1", id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "activate_failed"})
	}

	// Only seed homepage_blocks from the template's default_sections when the
	// admin hasn't already customized the homepage — never clobber manual edits.
	var existingBlocks json.RawMessage
	err = tx.QueryRow(ctx, "SELECT value FROM site_settings WHERE key='homepage_blocks'").Scan(&existingBlocks)
	isEmpty := err == pgx.ErrNoRows || string(existingBlocks) == "[]" || string(existingBlocks) == "null"

	if isEmpty {
		layout := "minimal"
		if string(defaultSections) != "[]" && string(defaultSections) != "null" {
			layout = "landing"
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO site_settings (key, value, updated_at) VALUES ('homepage_blocks', $1, now())
			 ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=now()`, defaultSections); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "activate_failed"})
		}
		layoutJSON, _ := json.Marshal(layout)
		if _, err := tx.Exec(ctx,
			`INSERT INTO site_settings (key, value, updated_at) VALUES ('homepage_layout', $1, now())
			 ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=now()`, layoutJSON); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "activate_failed"})
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "activate_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type templateUpdateRequest struct {
	Name         string          `json:"name"`
	Description  *string         `json:"description"`
	HeaderConfig json.RawMessage `json:"header_config"`
	FooterConfig json.RawMessage `json:"footer_config"`
	ThemeConfig  json.RawMessage `json:"theme_config"`
}

func (h *TemplateHandler) Update(c echo.Context) error {
	var req templateUpdateRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.HeaderConfig == nil {
		req.HeaderConfig = json.RawMessage("{}")
	}
	if req.FooterConfig == nil {
		req.FooterConfig = json.RawMessage("{}")
	}
	if req.ThemeConfig == nil {
		req.ThemeConfig = json.RawMessage("{}")
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		"UPDATE site_templates SET name=$1, description=$2, header_config=$3, footer_config=$4, theme_config=$5 WHERE id=$6",
		req.Name, req.Description, req.HeaderConfig, req.FooterConfig, req.ThemeConfig, c.Param("id"),
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}
