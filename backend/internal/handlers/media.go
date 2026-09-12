package handlers

import (
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
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true, ".svg": true}
	if !allowed[ext] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "unsupported_file_type"})
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

	size, err := io.Copy(dst, src)
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
		fileHeader.Filename, url, fileHeader.Header.Get("Content-Type"), size, c.FormValue("alt_text"), userID,
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

func (h *MediaHandler) Delete(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	id := c.Param("id")

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
