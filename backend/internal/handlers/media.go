package handlers

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type MediaHandler struct {
	Pool       *pgxpool.Pool
	UploadDir  string
	PublicBase string
}

// mimeByExt is the source of truth for the stored mime_type — never the client-supplied
// Content-Type header, which is attacker-controlled and was previously trusted as-is.
var mimeByExt = map[string]string{
	".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
	".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
}

// suspiciousSVGMarkers is a coarse (not exhaustive) block-list for obviously script-bearing
// SVGs — SVG is XML and can embed <script> or event-handler attributes that execute when the
// file is opened directly in a browser tab. This isn't a full sanitizer, just a floor against
// the most common injection shapes for a low-stakes internal media library.
var suspiciousSVGMarkers = []string{"<script", "javascript:", "onload=", "onerror=", "onclick="}

func (h *MediaHandler) Upload(c echo.Context) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "file_required"})
	}

	src, err := fileHeader.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "open_failed"})
	}
	defer src.Close()

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	mimeType, allowed := mimeByExt[ext]
	if !allowed {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "unsupported_file_type"})
	}

	content, err := io.ReadAll(src)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "read_failed"})
	}
	if ext == ".svg" {
		lower := strings.ToLower(string(content))
		for _, marker := range suspiciousSVGMarkers {
			if strings.Contains(lower, marker) {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "svg_contains_script"})
			}
		}
	}

	randBytes := make([]byte, 16)
	rand.Read(randBytes)
	filename := hex.EncodeToString(randBytes) + ext
	destPath := filepath.Join(h.UploadDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "save_failed"})
	}
	defer dst.Close()

	size, err := io.Copy(dst, bytes.NewReader(content))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "write_failed"})
	}

	url := fmt.Sprintf("%s/%s", h.PublicBase, filename)
	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	var id string
	err = h.Pool.QueryRow(ctx,
		`INSERT INTO media (filename, url, mime_type, size_bytes, alt_text, uploaded_by)
		 VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
		fileHeader.Filename, url, mimeType, size, c.FormValue("alt_text"), userID,
	).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "db_insert_failed"})
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"id":  id,
		"url": url,
	})
}

func (h *MediaHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		"SELECT id, filename, url, mime_type, size_bytes, alt_text, created_at FROM media ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID        string    `json:"id"`
		Filename  string    `json:"filename"`
		URL       string    `json:"url"`
		MimeType  string    `json:"mime_type"`
		SizeBytes int64     `json:"size_bytes"`
		AltText   *string   `json:"alt_text"`
		CreatedAt time.Time `json:"created_at"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.Filename, &i.URL, &i.MimeType, &i.SizeBytes, &i.AltText, &i.CreatedAt); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}

type updateAltTextRequest struct {
	AltText string `json:"alt_text"`
}

func (h *MediaHandler) UpdateAltText(c echo.Context) error {
	var req updateAltTextRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE media SET alt_text=$1 WHERE id=$2", req.AltText, c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type mediaUsageItem struct {
	Kind  string `json:"kind"` // app_icon | app_hero | app_screenshot | blog_cover
	ID    string `json:"id"`
	Title string `json:"title"`
}

// findUsage covers the structured, single-column references to a media row (app icon/hero/
// screenshots, blog post cover). It does not scan into pages'/apps'/blog posts' JSONB block
// content for inline image/gallery blocks referencing this media id — that would need walking
// arbitrary block trees — so "0 usages" here means "no *known* usage", not an absolute guarantee.
func (h *MediaHandler) findUsage(id string) ([]mediaUsageItem, error) {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	rows, err := h.Pool.Query(ctx,
		`SELECT id, name, 'app_icon' FROM apps WHERE icon_media_id=$1 AND deleted_at IS NULL
		 UNION ALL
		 SELECT id, name, 'app_hero' FROM apps WHERE hero_image_media_id=$1 AND deleted_at IS NULL
		 UNION ALL
		 SELECT a.id, a.name, 'app_screenshot' FROM app_screenshots s JOIN apps a ON a.id = s.app_id
		 WHERE s.media_id=$1 AND a.deleted_at IS NULL
		 UNION ALL
		 SELECT id, title, 'blog_cover' FROM blog_posts WHERE cover_image_media_id=$1 AND deleted_at IS NULL`,
		id,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []mediaUsageItem{}
	for rows.Next() {
		var i mediaUsageItem
		if err := rows.Scan(&i.ID, &i.Title, &i.Kind); err == nil {
			items = append(items, i)
		}
	}
	return items, nil
}

func (h *MediaHandler) Usage(c echo.Context) error {
	items, err := h.findUsage(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, items)
}

func (h *MediaHandler) Delete(c echo.Context) error {
	id := c.Param("id")

	// Refuse to delete media still referenced by a live app/blog post — the caller can pass
	// ?force=true to delete anyway (e.g. after confirming through a "used in N places" prompt).
	if c.QueryParam("force") != "true" {
		usage, err := h.findUsage(id)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
		}
		if len(usage) > 0 {
			return c.JSON(http.StatusConflict, map[string]interface{}{"error": "media_in_use", "usage": usage})
		}
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()

	var url string
	if err := h.Pool.QueryRow(ctx, "SELECT url FROM media WHERE id=$1", id).Scan(&url); err == nil {
		os.Remove(filepath.Join(h.UploadDir, filepath.Base(url)))
	}

	_, err := h.Pool.Exec(ctx, "DELETE FROM media WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}
