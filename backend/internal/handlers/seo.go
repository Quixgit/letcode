package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type SEOHandler struct {
	Pool    *pgxpool.Pool
	BaseURL string
}

func (h *SEOHandler) Sitemap(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	var urls []string

	pageRows, err := h.Pool.Query(ctx, "SELECT slug, updated_at FROM pages WHERE status='published' AND noindex=false")
	if err == nil {
		defer pageRows.Close()
		for pageRows.Next() {
			var slug string
			var updatedAt interface{}
			pageRows.Scan(&slug, &updatedAt)
			urls = append(urls, fmt.Sprintf("  <url><loc>%s/%s</loc></url>", h.BaseURL, slug))
		}
	}

	appRows, err := h.Pool.Query(ctx, "SELECT slug FROM apps WHERE status='published'")
	if err == nil {
		defer appRows.Close()
		for appRows.Next() {
			var slug string
			appRows.Scan(&slug)
			urls = append(urls, fmt.Sprintf("  <url><loc>%s/apps/%s</loc></url>", h.BaseURL, slug))
		}
	}

	xml := "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
		strings.Join(urls, "\n") + "\n</urlset>"

	return c.Blob(http.StatusOK, "application/xml", []byte(xml))
}

func (h *SEOHandler) Robots(c echo.Context) error {
	body := fmt.Sprintf(`User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: %s/sitemap.xml
`, h.BaseURL)
	return c.String(http.StatusOK, body)
}

func (h *SEOHandler) LLMsTxt(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	var setting string
	err := h.Pool.QueryRow(ctx, "SELECT value FROM site_settings WHERE key='llms_txt_content'").Scan(&setting)
	if err == nil && setting != "" {
		return c.String(http.StatusOK, setting)
	}

	body := fmt.Sprintf("# lecode.tech\n\nA collection of small, focused apps for DevOps engineers.\n\nSee %s/sitemap.xml for the full list of pages.\n", h.BaseURL)
	return c.String(http.StatusOK, body)
}
