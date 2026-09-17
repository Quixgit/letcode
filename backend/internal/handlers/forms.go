package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type FormsHandler struct {
	Pool *pgxpool.Pool
}

type submitFormRequest struct {
	FormKey   string            `json:"form_key"`
	FormTitle string            `json:"form_title"`
	PagePath  string            `json:"page_path"`
	Data      map[string]string `json:"data"`
	// Honeypot: a field real visitors never see or fill in (hidden off-screen in the public
	// form), so anything that fills it in is almost certainly a bot filling every field it finds.
	Website string `json:"website"`
}

func (h *FormsHandler) Submit(c echo.Context) error {
	var req submitFormRequest
	if err := c.Bind(&req); err != nil || req.FormKey == "" || len(req.Data) == 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	// Silently accept-and-drop honeypot hits rather than erroring — an error response just
	// teaches a bot which field to leave blank next time.
	if req.Website != "" {
		return c.NoContent(http.StatusNoContent)
	}

	dataJSON, err := json.Marshal(req.Data)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err = h.Pool.Exec(ctx,
		`INSERT INTO form_submissions (form_key, form_title, page_path, data) VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), $4)`,
		req.FormKey, req.FormTitle, req.PagePath, dataJSON,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "insert_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}

type formSubmission struct {
	ID        int64           `json:"id"`
	FormKey   string          `json:"form_key"`
	FormTitle *string         `json:"form_title"`
	PagePath  *string         `json:"page_path"`
	Data      json.RawMessage `json:"data"`
	IsRead    bool            `json:"is_read"`
	CreatedAt time.Time       `json:"created_at"`
}

func (h *FormsHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT id, form_key, form_title, page_path, data, is_read, created_at
		 FROM form_submissions ORDER BY created_at DESC LIMIT 500`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []formSubmission{}
	for rows.Next() {
		var s formSubmission
		if err := rows.Scan(&s.ID, &s.FormKey, &s.FormTitle, &s.PagePath, &s.Data, &s.IsRead, &s.CreatedAt); err == nil {
			items = append(items, s)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *FormsHandler) UnreadCount(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	var count int64
	if err := h.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM form_submissions WHERE is_read=false").Scan(&count); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, map[string]int64{"count": count})
}

func (h *FormsHandler) MarkRead(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE form_submissions SET is_read=true WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *FormsHandler) Delete(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "DELETE FROM form_submissions WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusOK)
}
