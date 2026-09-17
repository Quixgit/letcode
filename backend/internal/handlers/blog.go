package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type BlogHandler struct {
	Pool    *pgxpool.Pool
	BaseURL string
}

type blogPost struct {
	ID                 string          `json:"id"`
	Slug               string          `json:"slug"`
	Title              string          `json:"title"`
	Excerpt            *string         `json:"excerpt"`
	Content            json.RawMessage `json:"content"`
	CoverImageMediaID  *string         `json:"cover_image_media_id"`
	CoverImageURL      *string         `json:"cover_image_url"`
	AuthorID           *string         `json:"author_id"`
	AuthorEmail        *string         `json:"author_email"`
	Status             string          `json:"status"`
	Tags               []string        `json:"tags"`
	MetaTitle          *string         `json:"meta_title"`
	MetaDescription    *string         `json:"meta_description"`
	OGImageURL         *string         `json:"og_image_url"`
	CanonicalURL       *string         `json:"canonical_url"`
	NoIndex            bool            `json:"noindex"`
	StructuredData     json.RawMessage `json:"structured_data,omitempty"`
	ReviewStatus       string          `json:"review_status"`
	ReviewNote         *string         `json:"review_note,omitempty"`
	DeletedAt          *time.Time      `json:"deleted_at,omitempty"`
	PublishedAt        *time.Time      `json:"published_at"`
	ScheduledPublishAt *time.Time      `json:"scheduled_publish_at"`
	CreatedAt          time.Time       `json:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at"`
}

type blogRequest struct {
	Slug               string          `json:"slug"`
	Title              string          `json:"title"`
	Excerpt            *string         `json:"excerpt"`
	Content            json.RawMessage `json:"content"`
	CoverImageMediaID  *string         `json:"cover_image_media_id"`
	Tags               []string        `json:"tags"`
	MetaTitle          *string         `json:"meta_title"`
	MetaDescription    *string         `json:"meta_description"`
	OGImageURL         *string         `json:"og_image_url"`
	CanonicalURL       *string         `json:"canonical_url"`
	NoIndex            bool            `json:"noindex"`
	StructuredData     json.RawMessage `json:"structured_data"`
	ScheduledPublishAt *time.Time      `json:"scheduled_publish_at"`
}

func (h *BlogHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	status := c.QueryParam("status")

	query := `SELECT b.id, b.slug, b.title, b.excerpt, b.status, b.tags, b.review_status, b.published_at,
	 b.scheduled_publish_at, b.deleted_at, b.created_at, b.updated_at, u.email
	 FROM blog_posts b LEFT JOIN users u ON u.id = b.author_id`
	args := []interface{}{}
	if status == "trash" {
		query += " WHERE b.deleted_at IS NOT NULL"
	} else {
		query += " WHERE b.deleted_at IS NULL"
		if status != "" {
			query += " AND b.status=$1"
			args = append(args, status)
		}
	}
	query += " ORDER BY b.updated_at DESC"

	rows, err := h.Pool.Query(ctx, query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []blogPost{}
	for rows.Next() {
		var p blogPost
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Status, &p.Tags, &p.ReviewStatus, &p.PublishedAt,
			&p.ScheduledPublishAt, &p.DeletedAt, &p.CreatedAt, &p.UpdatedAt, &p.AuthorEmail); err == nil {
			items = append(items, p)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *BlogHandler) Get(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	var p blogPost
	err := h.Pool.QueryRow(ctx,
		`SELECT b.id, b.slug, b.title, b.excerpt, b.content, b.cover_image_media_id, m.url, b.author_id, u.email,
		 b.status, b.tags, b.meta_title, b.meta_description, b.og_image_url, b.canonical_url, b.noindex, b.structured_data,
		 b.review_status, b.review_note,
		 b.published_at, b.scheduled_publish_at, b.created_at, b.updated_at
		 FROM blog_posts b
		 LEFT JOIN media m ON m.id = b.cover_image_media_id
		 LEFT JOIN users u ON u.id = b.author_id
		 WHERE b.id=$1 AND b.deleted_at IS NULL`, c.Param("id"),
	).Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &p.CoverImageMediaID, &p.CoverImageURL, &p.AuthorID, &p.AuthorEmail,
		&p.Status, &p.Tags, &p.MetaTitle, &p.MetaDescription, &p.OGImageURL, &p.CanonicalURL, &p.NoIndex, &p.StructuredData,
		&p.ReviewStatus, &p.ReviewNote,
		&p.PublishedAt, &p.ScheduledPublishAt, &p.CreatedAt, &p.UpdatedAt)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "post_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, p)
}

const blogPageSize = 10

func (h *BlogHandler) ListPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	tag := c.QueryParam("tag")
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * blogPageSize

	query := `SELECT b.id, b.slug, b.title, b.excerpt, b.cover_image_media_id, m.url, b.tags, b.published_at, u.email
	 FROM blog_posts b
	 LEFT JOIN media m ON m.id = b.cover_image_media_id
	 LEFT JOIN users u ON u.id = b.author_id
	 WHERE b.status='published' AND b.deleted_at IS NULL`
	args := []interface{}{}
	if tag != "" {
		args = append(args, tag)
		query += " AND $1 = ANY(b.tags)"
	}
	query += " ORDER BY b.published_at DESC LIMIT $" + strconv.Itoa(len(args)+1) + " OFFSET $" + strconv.Itoa(len(args)+2)
	args = append(args, blogPageSize, offset)

	rows, err := h.Pool.Query(ctx, query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []blogPost{}
	for rows.Next() {
		var p blogPost
		if err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.CoverImageMediaID, &p.CoverImageURL, &p.Tags, &p.PublishedAt, &p.AuthorEmail); err == nil {
			items = append(items, p)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *BlogHandler) GetBySlugPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	var p blogPost
	err := h.Pool.QueryRow(ctx,
		`SELECT b.id, b.slug, b.title, b.excerpt, b.content, b.cover_image_media_id, m.url, u.email,
		 b.status, b.tags, b.meta_title, b.meta_description, b.og_image_url, b.canonical_url, b.noindex, b.structured_data,
		 b.published_at, b.created_at, b.updated_at
		 FROM blog_posts b
		 LEFT JOIN media m ON m.id = b.cover_image_media_id
		 LEFT JOIN users u ON u.id = b.author_id
		 WHERE b.slug=$1 AND b.status='published' AND b.deleted_at IS NULL`, c.Param("slug"),
	).Scan(&p.ID, &p.Slug, &p.Title, &p.Excerpt, &p.Content, &p.CoverImageMediaID, &p.CoverImageURL, &p.AuthorEmail,
		&p.Status, &p.Tags, &p.MetaTitle, &p.MetaDescription, &p.OGImageURL, &p.CanonicalURL, &p.NoIndex, &p.StructuredData,
		&p.PublishedAt, &p.CreatedAt, &p.UpdatedAt)

	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "post_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, p)
}

func (h *BlogHandler) Create(c echo.Context) error {
	var req blogRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Slug == "" || req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "slug_and_title_required"})
	}
	if req.Content == nil {
		req.Content = json.RawMessage("[]")
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	var id string
	err := h.Pool.QueryRow(ctx,
		`INSERT INTO blog_posts (slug, title, excerpt, content, cover_image_media_id, author_id, tags,
		 meta_title, meta_description, og_image_url, canonical_url, noindex, structured_data, scheduled_publish_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
		req.Slug, req.Title, req.Excerpt, req.Content, req.CoverImageMediaID, userID, req.Tags,
		req.MetaTitle, req.MetaDescription, req.OGImageURL, req.CanonicalURL, req.NoIndex, req.StructuredData, req.ScheduledPublishAt,
	).Scan(&id)

	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "slug_taken_or_invalid"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *BlogHandler) Update(c echo.Context) error {
	id := c.Param("id")
	var req blogRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Tags == nil {
		req.Tags = []string{}
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		`UPDATE blog_posts SET slug=$1, title=$2, excerpt=$3, content=$4, cover_image_media_id=$5, tags=$6,
		 meta_title=$7, meta_description=$8, og_image_url=$9, canonical_url=$10, noindex=$11, structured_data=$12, updated_at=now()
		 WHERE id=$13`,
		req.Slug, req.Title, req.Excerpt, req.Content, req.CoverImageMediaID, req.Tags,
		req.MetaTitle, req.MetaDescription, req.OGImageURL, req.CanonicalURL, req.NoIndex, req.StructuredData, id,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type blogQuickEditRequest struct {
	Title  string `json:"title"`
	Slug   string `json:"slug"`
	Status string `json:"status"`
}

func (h *BlogHandler) QuickEdit(c echo.Context) error {
	id := c.Param("id")
	var req blogQuickEditRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Status != "draft" && req.Status != "published" && req.Status != "archived" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_status"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var slug string
	err := h.Pool.QueryRow(ctx,
		`UPDATE blog_posts SET title=$1, slug=$2, status=$3, updated_at=now(),
		 published_at = CASE WHEN $3='published' AND published_at IS NULL THEN now() ELSE published_at END
		 WHERE id=$4 RETURNING slug`,
		req.Title, req.Slug, req.Status, id,
	).Scan(&slug)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "slug_taken_or_invalid"})
	}
	if req.Status == "published" {
		PingIndexNow(h.Pool, h.BaseURL, []string{h.BaseURL + "/blog/" + slug})
	}
	return c.NoContent(http.StatusOK)
}

func (h *BlogHandler) Publish(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()
	var slug string
	err := h.Pool.QueryRow(ctx,
		"UPDATE blog_posts SET status='published', published_at=now(), updated_at=now() WHERE id=$1 RETURNING slug", id).Scan(&slug)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "publish_failed"})
	}
	PingIndexNow(h.Pool, h.BaseURL, []string{h.BaseURL + "/blog/" + slug})
	return c.NoContent(http.StatusOK)
}

func (h *BlogHandler) Unpublish(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE blog_posts SET status='draft', updated_at=now() WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unpublish_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *BlogHandler) Schedule(c echo.Context) error {
	id := c.Param("id")
	var req scheduleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE blog_posts SET scheduled_publish_at=$1, updated_at=now() WHERE id=$2", req.ScheduledPublishAt, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "schedule_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *BlogHandler) CancelSchedule(c echo.Context) error {
	id := c.Param("id")
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE blog_posts SET scheduled_publish_at=NULL, updated_at=now() WHERE id=$1", id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "cancel_schedule_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *BlogHandler) Delete(c echo.Context) error  { return softDeleteContent(h.Pool, "blog_posts")(c) }
func (h *BlogHandler) Restore(c echo.Context) error { return restoreContent(h.Pool, "blog_posts")(c) }
func (h *BlogHandler) PermanentDelete(c echo.Context) error {
	return permanentDeleteContent(h.Pool, "blog_posts")(c)
}
func (h *BlogHandler) SubmitReview(c echo.Context) error {
	return submitReview(h.Pool, "blog_posts")(c)
}
func (h *BlogHandler) ReviewDecision(c echo.Context) error {
	return reviewDecision(h.Pool, "blog_posts")(c)
}

func (h *BlogHandler) Tags(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT DISTINCT unnest(tags) AS tag FROM blog_posts ORDER BY tag ASC`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()
	tags := []string{}
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err == nil {
			tags = append(tags, t)
		}
	}
	return c.JSON(http.StatusOK, tags)
}

