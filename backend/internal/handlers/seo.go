package handlers

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type SEOHandler struct {
	Pool    *pgxpool.Pool
	BaseURL string
}

func sitemapURLEntry(loc string, lastmod *time.Time) string {
	if lastmod == nil {
		return fmt.Sprintf("  <url><loc>%s</loc></url>", loc)
	}
	return fmt.Sprintf("  <url><loc>%s</loc><lastmod>%s</lastmod></url>", loc, lastmod.Format("2006-01-02"))
}

func (h *SEOHandler) sitewideNoindex() bool {
	qCtx, cancel := db.WithTimeout()
	defer cancel()
	var raw string
	if err := h.Pool.QueryRow(qCtx, "SELECT value FROM site_settings WHERE key='seo_sitewide_noindex'").Scan(&raw); err != nil {
		return false
	}
	return raw == "true"
}

// settingString reads a JSONB site_settings value that holds a plain JSON string (e.g. saved
// from a text field in the admin) and returns the *decoded* string — a bare Scan into a Go
// string would instead return the raw JSON text, quotes/escaping and all.
func (h *SEOHandler) settingString(key string) (string, bool) {
	qCtx, cancel := db.WithTimeout()
	defer cancel()
	var raw string
	if err := h.Pool.QueryRow(qCtx, "SELECT value FROM site_settings WHERE key=$1", key).Scan(&raw); err != nil {
		return "", false
	}
	var s string
	if err := json.Unmarshal([]byte(raw), &s); err != nil {
		return "", false
	}
	return s, true
}

type sitemapExtraEntry struct {
	URL     string `json:"url"`
	Lastmod string `json:"lastmod,omitempty"`
}

func (h *SEOHandler) Sitemap(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	if h.sitewideNoindex() {
		empty := "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n</urlset>"
		return c.Blob(http.StatusOK, "application/xml", []byte(empty))
	}

	var urls []string

	// The homepage isn't a `pages` row — it's assembled from site settings/homepage_sections —
	// so unlike every other route it has to be added by hand or it never appears here at all.
	urls = append(urls, sitemapURLEntry(h.BaseURL+"/", nil))

	pageRows, err := h.Pool.Query(ctx,
		"SELECT slug, updated_at FROM pages WHERE status='published' AND noindex=false AND deleted_at IS NULL")
	if err == nil {
		defer pageRows.Close()
		for pageRows.Next() {
			var slug string
			var updatedAt time.Time
			if pageRows.Scan(&slug, &updatedAt) == nil {
				urls = append(urls, sitemapURLEntry(fmt.Sprintf("%s/%s", h.BaseURL, slug), &updatedAt))
			}
		}
	}

	appRows, err := h.Pool.Query(ctx,
		"SELECT slug, updated_at FROM apps WHERE status='published' AND noindex=false AND deleted_at IS NULL")
	if err == nil {
		defer appRows.Close()
		for appRows.Next() {
			var slug string
			var updatedAt time.Time
			if appRows.Scan(&slug, &updatedAt) == nil {
				urls = append(urls, sitemapURLEntry(fmt.Sprintf("%s/apps/%s", h.BaseURL, slug), &updatedAt))
			}
		}
	}

	// Same story as the homepage: /blog is the post index, not a `pages` row. Only add it (and
	// only right before its own posts) when there's actually at least one published post.
	var blogEntries []string
	var latestBlogUpdate *time.Time
	blogRows, err := h.Pool.Query(ctx,
		"SELECT slug, updated_at FROM blog_posts WHERE status='published' AND noindex=false AND deleted_at IS NULL")
	if err == nil {
		defer blogRows.Close()
		for blogRows.Next() {
			var slug string
			var updatedAt time.Time
			if blogRows.Scan(&slug, &updatedAt) == nil {
				blogEntries = append(blogEntries, sitemapURLEntry(fmt.Sprintf("%s/blog/%s", h.BaseURL, slug), &updatedAt))
				if latestBlogUpdate == nil || updatedAt.After(*latestBlogUpdate) {
					latestBlogUpdate = &updatedAt
				}
			}
		}
	}
	if len(blogEntries) > 0 {
		urls = append(urls, sitemapURLEntry(h.BaseURL+"/blog", latestBlogUpdate))
		urls = append(urls, blogEntries...)
	}

	// Manual entries an admin added by hand (Settings → SEO → sitemap.xml) for anything outside
	// the CMS content types above.
	{
		qCtx, cancel := db.WithTimeout()
		var rawArr string
		err := h.Pool.QueryRow(qCtx, "SELECT value FROM site_settings WHERE key='sitemap_extra_urls'").Scan(&rawArr)
		cancel()
		if err == nil && rawArr != "" {
			var extra []sitemapExtraEntry
			if json.Unmarshal([]byte(rawArr), &extra) == nil {
				for _, e := range extra {
					if e.URL == "" {
						continue
					}
					loc := e.URL
					if !strings.HasPrefix(loc, "http://") && !strings.HasPrefix(loc, "https://") {
						loc = h.BaseURL + "/" + strings.TrimPrefix(loc, "/")
					}
					var lm *time.Time
					if e.Lastmod != "" {
						if t, err := time.Parse("2006-01-02", e.Lastmod); err == nil {
							lm = &t
						}
					}
					urls = append(urls, sitemapURLEntry(loc, lm))
				}
			}
		}
	}

	xml := "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n" +
		strings.Join(urls, "\n") + "\n</urlset>"

	return c.Blob(http.StatusOK, "application/xml", []byte(xml))
}

func (h *SEOHandler) Robots(c echo.Context) error {
	if h.sitewideNoindex() {
		return c.String(http.StatusOK, "User-agent: *\nDisallow: /\n")
	}

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
	if override, ok := h.settingString("llms_txt_content"); ok && strings.TrimSpace(override) != "" {
		return c.String(http.StatusOK, override)
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()

	siteName, _ := h.settingString("site_name")
	if siteName == "" {
		siteName = "lecode"
	}
	tagline, _ := h.settingString("tagline")
	if tagline == "" {
		tagline, _ = h.settingString("seo_default_meta_description")
	}
	if tagline == "" {
		tagline = "A collection of small, focused apps for DevOps engineers."
	}

	var b strings.Builder
	fmt.Fprintf(&b, "# %s\n\n> %s\n", siteName, tagline)

	pageRows, err := h.Pool.Query(ctx,
		"SELECT slug, title, meta_description FROM pages WHERE status='published' AND noindex=false AND deleted_at IS NULL ORDER BY title ASC")
	if err == nil {
		var lines []string
		for pageRows.Next() {
			var slug, title string
			var desc *string
			if pageRows.Scan(&slug, &title, &desc) == nil {
				lines = append(lines, llmsTxtLine(title, fmt.Sprintf("%s/%s", h.BaseURL, slug), desc))
			}
		}
		pageRows.Close()
		if len(lines) > 0 {
			b.WriteString("\n## Pages\n")
			b.WriteString(strings.Join(lines, "\n"))
			b.WriteString("\n")
		}
	}

	appRows, err := h.Pool.Query(ctx,
		"SELECT slug, name, short_description FROM apps WHERE status='published' AND noindex=false AND deleted_at IS NULL ORDER BY sort_order ASC")
	if err == nil {
		var lines []string
		for appRows.Next() {
			var slug, name string
			var desc *string
			if appRows.Scan(&slug, &name, &desc) == nil {
				lines = append(lines, llmsTxtLine(name, fmt.Sprintf("%s/apps/%s", h.BaseURL, slug), desc))
			}
		}
		appRows.Close()
		if len(lines) > 0 {
			b.WriteString("\n## Apps\n")
			b.WriteString(strings.Join(lines, "\n"))
			b.WriteString("\n")
		}
	}

	blogRows, err := h.Pool.Query(ctx,
		`SELECT slug, title, excerpt FROM blog_posts
		 WHERE status='published' AND noindex=false AND deleted_at IS NULL
		 ORDER BY published_at DESC LIMIT 100`)
	if err == nil {
		var lines []string
		for blogRows.Next() {
			var slug, title string
			var excerpt *string
			if blogRows.Scan(&slug, &title, &excerpt) == nil {
				lines = append(lines, llmsTxtLine(title, fmt.Sprintf("%s/blog/%s", h.BaseURL, slug), excerpt))
			}
		}
		blogRows.Close()
		if len(lines) > 0 {
			b.WriteString("\n## Blog\n")
			b.WriteString(strings.Join(lines, "\n"))
			b.WriteString("\n")
		}
	}

	fmt.Fprintf(&b, "\nFull URL list: %s/sitemap.xml\n", h.BaseURL)

	return c.String(http.StatusOK, b.String())
}

func llmsTxtLine(title, url string, description *string) string {
	if description != nil && strings.TrimSpace(*description) != "" {
		return fmt.Sprintf("- [%s](%s): %s", title, url, strings.TrimSpace(*description))
	}
	return fmt.Sprintf("- [%s](%s)", title, url)
}

// EnsureIndexNowKey returns this site's IndexNow key, generating and persisting one on first
// use. The key doubles as the filename IndexNow's verifier fetches (`/<key>.txt`, registered
// once at startup in main.go), so it's created eagerly rather than lazily on the first publish.
func EnsureIndexNowKey(pool *pgxpool.Pool) string {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	var raw string
	if err := pool.QueryRow(ctx, "SELECT value FROM site_settings WHERE key='indexnow_key'").Scan(&raw); err == nil {
		var key string
		if json.Unmarshal([]byte(raw), &key) == nil && key != "" {
			return key
		}
	}

	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return ""
	}
	key := hex.EncodeToString(buf)
	keyJSON, _ := json.Marshal(key)
	pool.Exec(ctx,
		`INSERT INTO site_settings (key, value, updated_at) VALUES ('indexnow_key', $1, now())
		 ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=now()`, keyJSON)
	return key
}

// PingIndexNow tells IndexNow-participating search engines (Bing, Yandex, and others — not
// Google, which doesn't support the protocol) that the given URLs just changed, so they can
// crawl them immediately instead of waiting for their next scheduled pass. Gated behind the
// `indexnow_enabled` admin toggle (default off) and always fire-and-forget: a slow or
// unreachable third party must never delay or fail a publish.
func PingIndexNow(pool *pgxpool.Pool, baseURL string, urls []string) {
	if len(urls) == 0 {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var enabledRaw string
		if err := pool.QueryRow(ctx, "SELECT value FROM site_settings WHERE key='indexnow_enabled'").Scan(&enabledRaw); err != nil || enabledRaw != "true" {
			return
		}
		var keyRaw string
		if err := pool.QueryRow(ctx, "SELECT value FROM site_settings WHERE key='indexnow_key'").Scan(&keyRaw); err != nil {
			return
		}
		var key string
		if json.Unmarshal([]byte(keyRaw), &key) != nil || key == "" {
			return
		}

		host := strings.TrimPrefix(strings.TrimPrefix(baseURL, "https://"), "http://")
		payload, err := json.Marshal(map[string]interface{}{
			"host": host,
			"key":  key,
			// Not the IndexNow-conventional "/<key>.txt" at the domain root: this site's Caddy
			// config only proxies a fixed allowlist of paths (/api/*, /uploads/*, /sitemap.xml,
			// /robots.txt, /llms.txt) to the backend — anything else falls through to the
			// frontend and 404s. IndexNow explicitly supports a custom keyLocation, so the key
			// lives under /api/ instead, which is already proxied.
			"keyLocation": baseURL + "/api/" + key + ".txt",
			"urlList":     urls,
		})
		if err != nil {
			return
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.indexnow.org/indexnow", bytes.NewReader(payload))
		if err != nil {
			return
		}
		req.Header.Set("Content-Type", "application/json; charset=utf-8")
		resp, err := (&http.Client{Timeout: 5 * time.Second}).Do(req)
		if err == nil {
			resp.Body.Close()
		}
	}()
}
