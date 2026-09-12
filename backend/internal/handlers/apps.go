package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type AppHandler struct {
	Pool *pgxpool.Pool
}

type appRequest struct {
	Slug                 string          `json:"slug"`
	Name                 string          `json:"name"`
	Category             *string         `json:"category"`
	IconMediaID          *string         `json:"icon_media_id"`
	ShortDescription     *string         `json:"short_description"`
	Description          *string         `json:"description"`
	Features             json.RawMessage `json:"features"`
	PrivacyPolicyContent *string         `json:"privacy_policy_content"`
	InstructionsContent  *string         `json:"instructions_content"`
	GooglePlayURL        *string         `json:"google_play_url"`
	AppStoreURL          *string         `json:"app_store_url"`
	WebsiteURL           *string         `json:"website_url"`
	PricingNote          *string         `json:"pricing_note"`
	SortOrder            int             `json:"sort_order"`
	MetaTitle            *string         `json:"meta_title"`
	MetaDescription      *string         `json:"meta_description"`
	OGImageURL           *string         `json:"og_image_url"`
	ScheduledPublishAt   *time.Time      `json:"scheduled_publish_at"`
	ShowOnHomepage       bool            `json:"show_on_homepage"`
	Rating               *float64        `json:"rating"`
	RatingCount          *int            `json:"rating_count"`
	HeroImageMediaID     *string         `json:"hero_image_media_id"`
	FeatureSections      json.RawMessage `json:"feature_sections"`
	UseCaseTabs          json.RawMessage `json:"use_case_tabs"`
}

func (h *AppHandler) ListPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT a.id, a.slug, a.name, a.category, a.icon_media_id, m.url, a.short_description, a.pricing_note, a.sort_order, a.show_on_homepage,
		 a.google_play_url, a.app_store_url, a.website_url
		 FROM apps a LEFT JOIN media m ON m.id = a.icon_media_id
		 WHERE a.status='published' ORDER BY a.sort_order ASC, a.created_at ASC`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID               string  `json:"id"`
		Slug             string  `json:"slug"`
		Name             string  `json:"name"`
		Category         *string `json:"category"`
		IconMediaID      *string `json:"icon_media_id"`
		IconURL          *string `json:"icon_url"`
		ShortDescription *string `json:"short_description"`
		PricingNote      *string `json:"pricing_note"`
		SortOrder        int     `json:"sort_order"`
		ShowOnHomepage   bool    `json:"show_on_homepage"`
		GooglePlayURL    *string `json:"google_play_url"`
		AppStoreURL      *string `json:"app_store_url"`
		WebsiteURL       *string `json:"website_url"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.Slug, &i.Name, &i.Category, &i.IconMediaID, &i.IconURL, &i.ShortDescription, &i.PricingNote, &i.SortOrder, &i.ShowOnHomepage,
			&i.GooglePlayURL, &i.AppStoreURL, &i.WebsiteURL); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *AppHandler) GetBySlugPublic(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	slug := c.Param("slug")

	app, err := h.fetchApp(ctx, "slug=$1 AND status='published'", slug)
	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "app_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, app)
}

func (h *AppHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	status := c.QueryParam("status")

	query := `SELECT id, slug, name, category, status, sort_order, scheduled_publish_at, created_at, updated_at FROM apps`
	args := []interface{}{}
	if status != "" {
		query += " WHERE status=$1"
		args = append(args, status)
	}
	query += " ORDER BY sort_order ASC"

	rows, err := h.Pool.Query(ctx, query, args...)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID                 string     `json:"id"`
		Slug               string     `json:"slug"`
		Name               string     `json:"name"`
		Category           *string    `json:"category"`
		Status             string     `json:"status"`
		SortOrder          int        `json:"sort_order"`
		ScheduledPublishAt *time.Time `json:"scheduled_publish_at"`
		CreatedAt          time.Time  `json:"created_at"`
		UpdatedAt          time.Time  `json:"updated_at"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.Slug, &i.Name, &i.Category, &i.Status, &i.SortOrder, &i.ScheduledPublishAt, &i.CreatedAt, &i.UpdatedAt); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}

func (h *AppHandler) Get(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	app, err := h.fetchApp(ctx, "a.id=$1", c.Param("id"))
	if err == pgx.ErrNoRows {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "app_not_found"})
	}
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	return c.JSON(http.StatusOK, app)
}

func (h *AppHandler) fetchApp(ctx context.Context, whereClause string, arg string) (map[string]interface{}, error) {
	row := h.Pool.QueryRow(ctx, `
		SELECT a.id, a.slug, a.name, a.category, a.icon_media_id, im.url, a.short_description, a.description, a.features,
		 a.privacy_policy_content, a.instructions_content, a.google_play_url, a.app_store_url, a.website_url,
		 a.pricing_note, a.status, a.sort_order, a.meta_title, a.meta_description, a.og_image_url,
		 a.scheduled_publish_at, a.published_at, a.created_at, a.updated_at, a.show_on_homepage,
		 a.rating::float8, a.rating_count, a.hero_image_media_id, hm.url, a.feature_sections, a.use_case_tabs
		FROM apps a
		 LEFT JOIN media im ON im.id = a.icon_media_id
		 LEFT JOIN media hm ON hm.id = a.hero_image_media_id
		WHERE `+whereClause, arg)

	var (
		id, slug, name, status                                                 string
		category, iconMediaID, iconURL, shortDesc, desc, privacy, instructions *string
		googlePlay, appStore, website, pricing, metaTitle, metaDesc, ogImage   *string
		features                                                               json.RawMessage
		sortOrder                                                              int
		scheduledPublishAt                                                     *time.Time
		publishedAt, createdAt, updatedAt                                      interface{}
		showOnHomepage                                                         bool
		rating                                                                 *float64
		ratingCount                                                            *int
		heroImageMediaID, heroImageURL                                         *string
		featureSections, useCaseTabs                                           json.RawMessage
	)

	err := row.Scan(&id, &slug, &name, &category, &iconMediaID, &iconURL, &shortDesc, &desc, &features,
		&privacy, &instructions, &googlePlay, &appStore, &website, &pricing, &status, &sortOrder,
		&metaTitle, &metaDesc, &ogImage, &scheduledPublishAt, &publishedAt, &createdAt, &updatedAt, &showOnHomepage,
		&rating, &ratingCount, &heroImageMediaID, &heroImageURL, &featureSections, &useCaseTabs)
	if err != nil {
		return nil, err
	}

	screenshotRows, _ := h.Pool.Query(ctx,
		`SELECT s.id, s.media_id, m.url, s.sort_order FROM app_screenshots s
		 JOIN media m ON m.id = s.media_id WHERE s.app_id=$1 ORDER BY s.sort_order ASC`, id)
	var screenshots []map[string]interface{}
	if screenshotRows != nil {
		defer screenshotRows.Close()
		for screenshotRows.Next() {
			var sID, mediaID, url string
			var sortOrd int
			screenshotRows.Scan(&sID, &mediaID, &url, &sortOrd)
			screenshots = append(screenshots, map[string]interface{}{
				"id": sID, "media_id": mediaID, "url": url, "sort_order": sortOrd,
			})
		}
	}

	return map[string]interface{}{
		"id": id, "slug": slug, "name": name, "category": category, "icon_media_id": iconMediaID, "icon_url": iconURL,
		"short_description": shortDesc, "description": desc, "features": features,
		"privacy_policy_content": privacy, "instructions_content": instructions,
		"google_play_url": googlePlay, "app_store_url": appStore, "website_url": website,
		"pricing_note": pricing, "status": status, "sort_order": sortOrder,
		"meta_title": metaTitle, "meta_description": metaDesc, "og_image_url": ogImage,
		"scheduled_publish_at": scheduledPublishAt,
		"screenshots":          screenshots,
		"show_on_homepage":     showOnHomepage,
		"rating":               rating,
		"rating_count":         ratingCount,
		"hero_image_media_id":  heroImageMediaID,
		"hero_image_url":       heroImageURL,
		"feature_sections":     featureSections,
		"use_case_tabs":        useCaseTabs,
	}, nil
}

func (h *AppHandler) Create(c echo.Context) error {
	var req appRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Slug == "" || req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "slug_and_name_required"})
	}
	if req.Features == nil {
		req.Features = json.RawMessage("[]")
	}
	if req.FeatureSections == nil {
		req.FeatureSections = json.RawMessage("[]")
	}
	if req.UseCaseTabs == nil {
		req.UseCaseTabs = json.RawMessage("[]")
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	var id string
	err := h.Pool.QueryRow(ctx,
		`INSERT INTO apps (slug, name, category, icon_media_id, short_description, description, features,
		 privacy_policy_content, instructions_content, google_play_url, app_store_url, website_url,
		 pricing_note, sort_order, meta_title, meta_description, og_image_url, scheduled_publish_at, show_on_homepage,
		 rating, rating_count, hero_image_media_id, feature_sections, use_case_tabs, created_by, updated_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$25) RETURNING id`,
		req.Slug, req.Name, req.Category, req.IconMediaID, req.ShortDescription, req.Description, req.Features,
		req.PrivacyPolicyContent, req.InstructionsContent, req.GooglePlayURL, req.AppStoreURL, req.WebsiteURL,
		req.PricingNote, req.SortOrder, req.MetaTitle, req.MetaDescription, req.OGImageURL, req.ScheduledPublishAt, req.ShowOnHomepage,
		req.Rating, req.RatingCount, req.HeroImageMediaID, req.FeatureSections, req.UseCaseTabs, userID,
	).Scan(&id)

	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "slug_taken_or_invalid"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *AppHandler) Update(c echo.Context) error {
	id := c.Param("id")
	var req appRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	if req.FeatureSections == nil {
		req.FeatureSections = json.RawMessage("[]")
	}
	if req.UseCaseTabs == nil {
		req.UseCaseTabs = json.RawMessage("[]")
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	userID := c.Get("user_id")

	// Note: scheduled_publish_at is intentionally not touched here — it's managed
	// exclusively via the dedicated /schedule and /schedule/cancel endpoints below,
	// so a routine content save can never silently clear a pending schedule.
	_, err := h.Pool.Exec(ctx,
		`UPDATE apps SET slug=$1, name=$2, category=$3, icon_media_id=$4, short_description=$5, description=$6,
		 features=$7, privacy_policy_content=$8, instructions_content=$9, google_play_url=$10, app_store_url=$11,
		 website_url=$12, pricing_note=$13, sort_order=$14, meta_title=$15, meta_description=$16, og_image_url=$17,
		 show_on_homepage=$18, rating=$19, rating_count=$20, hero_image_media_id=$21, feature_sections=$22, use_case_tabs=$23,
		 updated_by=$24, updated_at=now() WHERE id=$25`,
		req.Slug, req.Name, req.Category, req.IconMediaID, req.ShortDescription, req.Description, req.Features,
		req.PrivacyPolicyContent, req.InstructionsContent, req.GooglePlayURL, req.AppStoreURL, req.WebsiteURL,
		req.PricingNote, req.SortOrder, req.MetaTitle, req.MetaDescription, req.OGImageURL, req.ShowOnHomepage,
		req.Rating, req.RatingCount, req.HeroImageMediaID, req.FeatureSections, req.UseCaseTabs, userID, id,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type appQuickEditRequest struct {
	Name   string `json:"name"`
	Slug   string `json:"slug"`
	Status string `json:"status"`
}

func (h *AppHandler) QuickEdit(c echo.Context) error {
	id := c.Param("id")
	var req appQuickEditRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Status != "draft" && req.Status != "published" && req.Status != "archived" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_status"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		`UPDATE apps SET name=$1, slug=$2, status=$3, updated_at=now(),
		 published_at = CASE WHEN $3='published' AND published_at IS NULL THEN now() ELSE published_at END
		 WHERE id=$4`,
		req.Name, req.Slug, req.Status, id,
	)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "slug_taken_or_invalid"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *AppHandler) Categories(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		"SELECT DISTINCT category FROM apps WHERE category IS NOT NULL AND category <> '' ORDER BY category ASC")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	categories := []string{}
	for rows.Next() {
		var cat string
		if err := rows.Scan(&cat); err == nil {
			categories = append(categories, cat)
		}
	}
	return c.JSON(http.StatusOK, categories)
}

func (h *AppHandler) Publish(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE apps SET status='published', published_at=now(), updated_at=now() WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "publish_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *AppHandler) Unpublish(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE apps SET status='draft', updated_at=now() WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unpublish_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type appScheduleRequest struct {
	ScheduledPublishAt time.Time `json:"scheduled_publish_at"`
}

func (h *AppHandler) Schedule(c echo.Context) error {
	var req appScheduleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE apps SET scheduled_publish_at=$1, updated_at=now() WHERE id=$2", req.ScheduledPublishAt, c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "schedule_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *AppHandler) CancelSchedule(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE apps SET scheduled_publish_at=NULL, updated_at=now() WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "cancel_schedule_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *AppHandler) Delete(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "DELETE FROM apps WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}

type screenshotRequest struct {
	MediaID   string `json:"media_id"`
	SortOrder int    `json:"sort_order"`
}

func (h *AppHandler) AddScreenshot(c echo.Context) error {
	appID := c.Param("id")
	var req screenshotRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var id string
	err := h.Pool.QueryRow(ctx,
		"INSERT INTO app_screenshots (app_id, media_id, sort_order) VALUES ($1,$2,$3) RETURNING id",
		appID, req.MediaID, req.SortOrder,
	).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "add_screenshot_failed"})
	}
	return c.JSON(http.StatusCreated, map[string]string{"id": id})
}

func (h *AppHandler) UpdateScreenshot(c echo.Context) error {
	var req screenshotRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		"UPDATE app_screenshots SET sort_order=$1 WHERE id=$2 AND app_id=$3",
		req.SortOrder, c.Param("screenshotId"), c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

func (h *AppHandler) DeleteScreenshot(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "DELETE FROM app_screenshots WHERE id=$1 AND app_id=$2", c.Param("screenshotId"), c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}
