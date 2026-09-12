package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type TestimonialHandler struct {
	Pool *pgxpool.Pool
}

type testimonial struct {
	ID          string  `json:"id"`
	AuthorName  string  `json:"author_name"`
	AuthorTitle *string `json:"author_title"`
	Quote       string  `json:"quote"`
	Rating      *int    `json:"rating"`
	AppID       *string `json:"app_id"`
	AppSlug     *string `json:"app_slug"`
	SortOrder   int     `json:"sort_order"`
	IsPublished bool    `json:"is_published"`
}

type testimonialRequest struct {
	AuthorName  string  `json:"author_name"`
	AuthorTitle *string `json:"author_title"`
	Quote       string  `json:"quote"`
	Rating      *int    `json:"rating"`
	AppID       *string `json:"app_id"`
	SortOrder   int     `json:"sort_order"`
	IsPublished bool    `json:"is_published"`
}

func (h *TestimonialHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT t.id, t.author_name, t.author_title, t.quote, t.rating, t.app_id, a.slug, t.sort_order, t.is_published
		 FROM testimonials t LEFT JOIN apps a ON a.id = t.app_id
		 ORDER BY t.sort_order ASC`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []testimonial{}
	for rows.Next() {
		var t testimonial
		if err := rows.Scan(&t.ID, &t.AuthorName, &t.AuthorTitle, &t.Quote, &t.Rating, &t.AppID, &t.AppSlug, &t.SortOrder, &t.IsPublished); err == nil {
			items = append(items, t)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *TestimonialHandler) ListPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT t.id, t.author_name, t.author_title, t.quote, t.rating, t.app_id, a.slug, t.sort_order, t.is_published
		 FROM testimonials t LEFT JOIN apps a ON a.id = t.app_id
		 WHERE t.is_published = true ORDER BY t.sort_order ASC`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []testimonial{}
	for rows.Next() {
		var t testimonial
		if err := rows.Scan(&t.ID, &t.AuthorName, &t.AuthorTitle, &t.Quote, &t.Rating, &t.AppID, &t.AppSlug, &t.SortOrder, &t.IsPublished); err == nil {
			items = append(items, t)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *TestimonialHandler) Create(c echo.Context) error {
	var req testimonialRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.AuthorName == "" || req.Quote == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "author_name_and_quote_required"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var id string
	err := h.Pool.QueryRow(ctx,
		`INSERT INTO testimonials (author_name, author_title, quote, rating, app_id, sort_order, is_published)
		 VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
		req.AuthorName, req.AuthorTitle, req.Quote, req.Rating, req.AppID, req.SortOrder, req.IsPublished,
	).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "create_failed"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *TestimonialHandler) Update(c echo.Context) error {
	var req testimonialRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		`UPDATE testimonials SET author_name=$1, author_title=$2, quote=$3, rating=$4, app_id=$5, sort_order=$6, is_published=$7
		 WHERE id=$8`,
		req.AuthorName, req.AuthorTitle, req.Quote, req.Rating, req.AppID, req.SortOrder, req.IsPublished, c.Param("id"),
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *TestimonialHandler) Delete(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "DELETE FROM testimonials WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}
