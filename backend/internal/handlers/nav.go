package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type NavHandler struct {
	Pool *pgxpool.Pool
}

type navItem struct {
	ID          string          `json:"id"`
	Label       string          `json:"label"`
	URL         string          `json:"url"`
	Location    string          `json:"location"`
	ParentID    *string         `json:"parent_id"`
	SortOrder   int             `json:"sort_order"`
	MenuType    string          `json:"menu_type"`
	MenuContent json.RawMessage `json:"menu_content"`
}

type navItemRequest struct {
	Label       string          `json:"label"`
	URL         string          `json:"url"`
	Location    string          `json:"location"`
	ParentID    *string         `json:"parent_id"`
	SortOrder   int             `json:"sort_order"`
	MenuType    string          `json:"menu_type"`
	MenuContent json.RawMessage `json:"menu_content"`
}

const navSelectSQL = "SELECT id, label, url, location, parent_id, sort_order, menu_type, menu_content FROM nav_items"

func scanNavItems(rows interface {
	Next() bool
	Scan(...interface{}) error
	Close()
}) []navItem {
	defer rows.Close()
	items := []navItem{}
	for rows.Next() {
		var i navItem
		if err := rows.Scan(&i.ID, &i.Label, &i.URL, &i.Location, &i.ParentID, &i.SortOrder, &i.MenuType, &i.MenuContent); err == nil {
			items = append(items, i)
		}
	}
	return items
}

func (h *NavHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx, navSelectSQL+" ORDER BY location, sort_order ASC")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, scanNavItems(rows))
}

func (h *NavHandler) ListPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	location := c.QueryParam("location")
	if location != "header" && location != "footer" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "location_required"})
	}
	rows, err := h.Pool.Query(ctx, navSelectSQL+" WHERE location=$1 ORDER BY sort_order ASC", location)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, scanNavItems(rows))
}

func (h *NavHandler) Create(c echo.Context) error {
	var req navItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Label == "" || req.URL == "" || (req.Location != "header" && req.Location != "footer") {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "label_url_and_location_required"})
	}
	if req.MenuType == "" {
		req.MenuType = "link"
	}
	if req.MenuType != "link" && req.MenuType != "dropdown" && req.MenuType != "mega_menu" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_menu_type"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var id string
	err := h.Pool.QueryRow(ctx,
		"INSERT INTO nav_items (label, url, location, parent_id, sort_order, menu_type, menu_content) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
		req.Label, req.URL, req.Location, req.ParentID, req.SortOrder, req.MenuType, req.MenuContent,
	).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "create_failed"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *NavHandler) Update(c echo.Context) error {
	var req navItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.MenuType == "" {
		req.MenuType = "link"
	}
	if req.MenuType != "link" && req.MenuType != "dropdown" && req.MenuType != "mega_menu" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_menu_type"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		"UPDATE nav_items SET label=$1, url=$2, location=$3, parent_id=$4, sort_order=$5, menu_type=$6, menu_content=$7 WHERE id=$8",
		req.Label, req.URL, req.Location, req.ParentID, req.SortOrder, req.MenuType, req.MenuContent, c.Param("id"),
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *NavHandler) Delete(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "DELETE FROM nav_items WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}

type reorderRequest struct {
	Items []struct {
		ID        string `json:"id"`
		SortOrder int    `json:"sort_order"`
	} `json:"items"`
}

func (h *NavHandler) Reorder(c echo.Context) error {
	var req reorderRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	for _, item := range req.Items {
		if _, err := h.Pool.Exec(ctx, "UPDATE nav_items SET sort_order=$1 WHERE id=$2", item.SortOrder, item.ID); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "reorder_failed"})
		}
	}
	return c.NoContent(http.StatusOK)
}
