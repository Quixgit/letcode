package handlers

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type RedirectHandler struct {
	Pool *pgxpool.Pool
}

type redirectRequest struct {
	FromPath   string `json:"from_path"`
	ToPath     string `json:"to_path"`
	StatusCode int    `json:"status_code"`
}

func (h *RedirectHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx, "SELECT id, from_path, to_path, status_code, created_at FROM redirects ORDER BY created_at DESC")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID         string    `json:"id"`
		FromPath   string    `json:"from_path"`
		ToPath     string    `json:"to_path"`
		StatusCode int       `json:"status_code"`
		CreatedAt  time.Time `json:"created_at"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.FromPath, &i.ToPath, &i.StatusCode, &i.CreatedAt); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}

// Lookup is public — the frontend calls this on every request that 404s to check for a redirect
func (h *RedirectHandler) Lookup(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	path := c.QueryParam("path")

	var toPath string
	var statusCode int
	err := h.Pool.QueryRow(ctx, "SELECT to_path, status_code FROM redirects WHERE from_path=$1", path).Scan(&toPath, &statusCode)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "no_redirect"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"to_path": toPath, "status_code": statusCode})
}

func (h *RedirectHandler) Create(c echo.Context) error {
	var req redirectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.FromPath == "" || req.ToPath == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from_and_to_required"})
	}
	if req.StatusCode == 0 {
		req.StatusCode = 301
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var id string
	err := h.Pool.QueryRow(ctx,
		"INSERT INTO redirects (from_path, to_path, status_code) VALUES ($1,$2,$3) RETURNING id",
		req.FromPath, req.ToPath, req.StatusCode,
	).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "path_already_redirected"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *RedirectHandler) Delete(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "DELETE FROM redirects WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}
