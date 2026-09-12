package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
	"lecode.tech/backend/internal/models"
)

type PageHandler struct {
	Pool *pgxpool.Pool
}

type pageRequest struct {
	Slug               string          `json:"slug"`
	Title              string          `json:"title"`
	Template           string          `json:"template"`
	Content            json.RawMessage `json:"content"`
	MetaTitle          *string         `json:"meta_title"`
	MetaDescription    *string         `json:"meta_description"`
	OGImageURL         *string         `json:"og_image_url"`
	CanonicalURL       *string         `json:"canonical_url"`
	NoIndex            bool            `json:"noindex"`
	StructuredData     json.RawMessage `json:"structured_data"`
	ScheduledPublishAt *time.Time      `json:"scheduled_publish_at"`
}

func (h *PageHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	status := c.QueryParam("status")

	query := "SELECT id, slug, title, template, status, meta_title, published_at, scheduled_publish_at, created_at, updated_at FROM pages"
	args := []interface{}{}
	if status != "" {
		query += " WHERE status=$1"
		args = append(args, status)
	}
	query += " ORDER BY updated_at DESC"

	rows, err := h.Pool.Query(ctx, query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type pageListItem struct {
		ID                 string     `json:"id"`
		Slug               string     `json:"slug"`
		Title              string     `json:"title"`
		Template           string     `json:"template"`
		Status             string     `json:"status"`
		MetaTitle          *string    `json:"meta_title"`
		PublishedAt        *time.Time `json:"published_at"`
		ScheduledPublishAt *time.Time `json:"scheduled_publish_at"`
		CreatedAt          time.Time  `json:"created_at"`
		UpdatedAt          time.Time  `json:"updated_at"`
	}

	items := []pageListItem{}
	for rows.Next() {
		var p pageListItem
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Template, &p.Status, &p.MetaTitle, &p.PublishedAt, &p.ScheduledPublishAt, &p.CreatedAt, &p.UpdatedAt); err != nil {
			continue
		}
		items = append(items, p)
	}

	return c.JSON(http.StatusOK, items)
}

func (h *PageHandler) Get(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	id := c.Param("id")

	var p models.Page
	err := h.Pool.QueryRow(ctx,
		`SELECT id, slug, title, template, status, content, meta_title, meta_description,
		 og_image_url, canonical_url, noindex, structured_data, published_at, scheduled_publish_at, created_at, updated_at
		 FROM pages WHERE id=$1`, id,
	).Scan(&p.ID, &p.Slug, &p.Title, &p.Template, &p.Status, &p.Content, &p.MetaTitle, &p.MetaDescription,
		&p.OGImageURL, &p.CanonicalURL, &p.NoIndex, &p.StructuredData, &p.PublishedAt, &p.ScheduledPublishAt, &p.CreatedAt, &p.UpdatedAt)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "page_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}

	return c.JSON(http.StatusOK, p)
}

func (h *PageHandler) ListPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	rows, err := h.Pool.Query(ctx,
		`SELECT slug, title FROM pages WHERE status='published' AND noindex=false ORDER BY title ASC`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		Slug  string `json:"slug"`
		Title string `json:"title"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.Slug, &i.Title); err == nil {
			items = append(items, i)
		}
	}

	return c.JSON(http.StatusOK, items)
}

func (h *PageHandler) GetBySlug(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	slug := c.Param("slug")

	var p models.Page
	err := h.Pool.QueryRow(ctx,
		`SELECT id, slug, title, template, status, content, meta_title, meta_description,
		 og_image_url, canonical_url, noindex, structured_data, published_at, created_at, updated_at
		 FROM pages WHERE slug=$1 AND status='published'`, slug,
	).Scan(&p.ID, &p.Slug, &p.Title, &p.Template, &p.Status, &p.Content, &p.MetaTitle, &p.MetaDescription,
		&p.OGImageURL, &p.CanonicalURL, &p.NoIndex, &p.StructuredData, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "page_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}

	return c.JSON(http.StatusOK, p)
}

// PreviewByID returns a page regardless of status, keyed by its (unguessable)
// UUID rather than slug — lets the admin form open a draft in a new tab
// before it's published, without requiring the visitor to authenticate.
func (h *PageHandler) PreviewByID(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	id := c.Param("id")

	var p models.Page
	err := h.Pool.QueryRow(ctx,
		`SELECT id, slug, title, template, status, content, meta_title, meta_description,
		 og_image_url, canonical_url, noindex, structured_data, published_at, created_at, updated_at
		 FROM pages WHERE id=$1`, id,
	).Scan(&p.ID, &p.Slug, &p.Title, &p.Template, &p.Status, &p.Content, &p.MetaTitle, &p.MetaDescription,
		&p.OGImageURL, &p.CanonicalURL, &p.NoIndex, &p.StructuredData, &p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "page_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}

	return c.JSON(http.StatusOK, p)
}

func (h *PageHandler) Create(c echo.Context) error {
	var req pageRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Slug == "" || req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "slug_and_title_required"})
	}
	if req.Template == "" {
		req.Template = "default"
	}
	if req.Content == nil {
		req.Content = json.RawMessage("[]")
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	var id string
	err := h.Pool.QueryRow(ctx,
		`INSERT INTO pages (slug, title, template, content, meta_title, meta_description, og_image_url,
		 canonical_url, noindex, structured_data, scheduled_publish_at, created_by, updated_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12) RETURNING id`,
		req.Slug, req.Title, req.Template, req.Content, req.MetaTitle, req.MetaDescription,
		req.OGImageURL, req.CanonicalURL, req.NoIndex, req.StructuredData, req.ScheduledPublishAt, userID,
	).Scan(&id)

	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "slug_taken_or_invalid"})
	}

	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *PageHandler) Update(c echo.Context) error {
	id := c.Param("id")
	var req pageRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	// save current content as revision before overwriting
	var currentContent json.RawMessage
	if err := h.Pool.QueryRow(ctx, "SELECT content FROM pages WHERE id=$1", id).Scan(&currentContent); err == nil {
		h.Pool.Exec(ctx, "INSERT INTO page_revisions (page_id, content, created_by) VALUES ($1,$2,$3)",
			id, currentContent, userID)
	}

	// Note: scheduled_publish_at is intentionally not touched here — it's managed
	// exclusively via the dedicated /schedule and /schedule/cancel endpoints below,
	// so a routine content save can never silently clear a pending schedule.
	_, err := h.Pool.Exec(ctx,
		`UPDATE pages SET slug=$1, title=$2, template=$3, content=$4, meta_title=$5, meta_description=$6,
		 og_image_url=$7, canonical_url=$8, noindex=$9, structured_data=$10,
		 updated_by=$11, updated_at=now()
		 WHERE id=$12`,
		req.Slug, req.Title, req.Template, req.Content, req.MetaTitle, req.MetaDescription,
		req.OGImageURL, req.CanonicalURL, req.NoIndex, req.StructuredData, userID, id,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}

	return c.NoContent(http.StatusOK)
}

type quickEditRequest struct {
	Title  string `json:"title"`
	Slug   string `json:"slug"`
	Status string `json:"status"`
}

func (h *PageHandler) QuickEdit(c echo.Context) error {
	id := c.Param("id")
	var req quickEditRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Status != "draft" && req.Status != "published" && req.Status != "archived" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_status"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		`UPDATE pages SET title=$1, slug=$2, status=$3, updated_at=now(),
		 published_at = CASE WHEN $3='published' AND published_at IS NULL THEN now() ELSE published_at END
		 WHERE id=$4`,
		req.Title, req.Slug, req.Status, id,
	)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "slug_taken_or_invalid"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *PageHandler) Publish(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()

	_, err := h.Pool.Exec(ctx,
		"UPDATE pages SET status='published', published_at=now(), updated_at=now() WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "publish_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type scheduleRequest struct {
	ScheduledPublishAt time.Time `json:"scheduled_publish_at"`
}

func (h *PageHandler) Schedule(c echo.Context) error {
	id := c.Param("id")
	var req scheduleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE pages SET scheduled_publish_at=$1, updated_at=now() WHERE id=$2", req.ScheduledPublishAt, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "schedule_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *PageHandler) CancelSchedule(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE pages SET scheduled_publish_at=NULL, updated_at=now() WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "cancel_schedule_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *PageHandler) Unpublish(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()

	_, err := h.Pool.Exec(ctx, "UPDATE pages SET status='draft', updated_at=now() WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unpublish_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *PageHandler) ListRevisions(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	id := c.Param("id")

	rows, err := h.Pool.Query(ctx,
		`SELECT pr.id, pr.content, pr.created_at, u.email
		 FROM page_revisions pr LEFT JOIN users u ON u.id = pr.created_by
		 WHERE pr.page_id=$1 ORDER BY pr.created_at DESC`, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type revisionItem struct {
		ID             string          `json:"id"`
		Content        json.RawMessage `json:"content"`
		CreatedAt      time.Time       `json:"created_at"`
		CreatedByEmail *string         `json:"created_by_email"`
	}

	items := []revisionItem{}
	for rows.Next() {
		var r revisionItem
		if err := rows.Scan(&r.ID, &r.Content, &r.CreatedAt, &r.CreatedByEmail); err != nil {
			continue
		}
		items = append(items, r)
	}

	return c.JSON(http.StatusOK, items)
}

func (h *PageHandler) Delete(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()

	_, err := h.Pool.Exec(ctx, "DELETE FROM pages WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}
