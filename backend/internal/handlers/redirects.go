package handlers

import (
	"net/http"
	"regexp"
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
	IsRegex    bool   `json:"is_regex"`
}

func (h *RedirectHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx, "SELECT id, from_path, to_path, status_code, is_regex, created_at FROM redirects ORDER BY created_at DESC")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID         string    `json:"id"`
		FromPath   string    `json:"from_path"`
		ToPath     string    `json:"to_path"`
		StatusCode int       `json:"status_code"`
		IsRegex    bool      `json:"is_regex"`
		CreatedAt  time.Time `json:"created_at"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.FromPath, &i.ToPath, &i.StatusCode, &i.IsRegex, &i.CreatedAt); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}

// Lookup is public — the frontend calls this on every request that 404s to check for a redirect.
// Exact matches win first; if none, every is_regex rule is tried in creation order and the first
// pattern match wins, with $1/$2/... capture groups from from_path expanded into to_path.
func (h *RedirectHandler) Lookup(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	path := c.QueryParam("path")

	var toPath string
	var statusCode int
	err := h.Pool.QueryRow(ctx, "SELECT to_path, status_code FROM redirects WHERE from_path=$1 AND is_regex=false", path).Scan(&toPath, &statusCode)
	if err == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{"to_path": toPath, "status_code": statusCode})
	}

	rows, err := h.Pool.Query(ctx, "SELECT from_path, to_path, status_code FROM redirects WHERE is_regex=true ORDER BY created_at ASC")
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "no_redirect"})
	}
	defer rows.Close()
	for rows.Next() {
		var fromPattern, dest string
		var status int
		if err := rows.Scan(&fromPattern, &dest, &status); err != nil {
			continue
		}
		re, err := regexp.Compile("^" + fromPattern + "$")
		if err != nil {
			continue
		}
		if re.MatchString(path) {
			return c.JSON(http.StatusOK, map[string]interface{}{"to_path": re.ReplaceAllString(path, dest), "status_code": status})
		}
	}

	return c.JSON(http.StatusNotFound, map[string]string{"error": "no_redirect"})
}

// wouldLoop follows the redirect chain starting at path (as a from_path) up to a handful of
// hops looking for a cycle back to path itself — a full graph search isn't needed since a real
// redirect chain longer than a few hops is already a config mistake worth flagging.
func (h *RedirectHandler) wouldLoop(start, next string) bool {
	seen := map[string]bool{start: true}
	current := next
	for i := 0; i < 10; i++ {
		if seen[current] {
			return current == start
		}
		seen[current] = true

		var dest string
		qCtx, cancel := db.WithTimeout()
		err := h.Pool.QueryRow(qCtx, "SELECT to_path FROM redirects WHERE from_path=$1 AND is_regex=false", current).Scan(&dest)
		cancel()
		if err != nil {
			return false
		}
		current = dest
	}
	return false
}

func (h *RedirectHandler) Create(c echo.Context) error {
	var req redirectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.FromPath == "" || req.ToPath == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "from_and_to_required"})
	}
	if req.FromPath == req.ToPath {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "redirect_loop"})
	}
	if req.StatusCode == 0 {
		req.StatusCode = 301
	}
	if !req.IsRegex && h.wouldLoop(req.FromPath, req.ToPath) {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "redirect_loop"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var id string
	err := h.Pool.QueryRow(ctx,
		"INSERT INTO redirects (from_path, to_path, status_code, is_regex) VALUES ($1,$2,$3,$4) RETURNING id",
		req.FromPath, req.ToPath, req.StatusCode, req.IsRegex,
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
