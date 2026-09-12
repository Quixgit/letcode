package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type AnalyticsHandler struct {
	Pool *pgxpool.Pool
}

type trackRequest struct {
	Path     string `json:"path"`
	Referrer string `json:"referrer"`
}

func (h *AnalyticsHandler) Track(c echo.Context) error {
	var req trackRequest
	if err := c.Bind(&req); err != nil || req.Path == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "path_required"})
	}

	userAgent := c.Request().UserAgent()

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx,
		`INSERT INTO page_views (path, referrer, user_agent) VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))`,
		req.Path, req.Referrer, userAgent,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "insert_failed"})
	}
	return c.NoContent(http.StatusNoContent)
}

type dayCount struct {
	Date  string `json:"date"`
	Views int64  `json:"views"`
}

type pathCount struct {
	Path  string `json:"path"`
	Views int64  `json:"views"`
}

type referrerCount struct {
	Referrer string `json:"referrer"`
	Views    int64  `json:"views"`
}

type analyticsSummary struct {
	TotalViews   int64           `json:"total_views"`
	UniquePaths  int64           `json:"unique_paths"`
	TopPages     []pathCount     `json:"top_pages"`
	TopReferrers []referrerCount `json:"top_referrers"`
	ViewsByDay   []dayCount      `json:"views_by_day"`
}

func (h *AnalyticsHandler) Summary(c echo.Context) error {
	days, err := strconv.Atoi(c.QueryParam("days"))
	if err != nil || (days != 7 && days != 30 && days != 90) {
		days = 7
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	since := time.Now().AddDate(0, 0, -days)

	var summary analyticsSummary

	if err := h.Pool.QueryRow(ctx,
		`SELECT COUNT(*), COUNT(DISTINCT path) FROM page_views WHERE created_at >= $1`,
		since,
	).Scan(&summary.TotalViews, &summary.UniquePaths); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}

	pageRows, err := h.Pool.Query(ctx,
		`SELECT path, COUNT(*) AS views FROM page_views WHERE created_at >= $1
		 GROUP BY path ORDER BY views DESC LIMIT 10`,
		since,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	summary.TopPages = []pathCount{}
	for pageRows.Next() {
		var p pathCount
		if err := pageRows.Scan(&p.Path, &p.Views); err == nil {
			summary.TopPages = append(summary.TopPages, p)
		}
	}
	pageRows.Close()

	refRows, err := h.Pool.Query(ctx,
		`SELECT COALESCE(NULLIF(referrer, ''), 'Прямые заходы') AS referrer, COUNT(*) AS views
		 FROM page_views WHERE created_at >= $1
		 GROUP BY referrer ORDER BY views DESC LIMIT 10`,
		since,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	summary.TopReferrers = []referrerCount{}
	for refRows.Next() {
		var r referrerCount
		if err := refRows.Scan(&r.Referrer, &r.Views); err == nil {
			summary.TopReferrers = append(summary.TopReferrers, r)
		}
	}
	refRows.Close()

	dayRows, err := h.Pool.Query(ctx,
		`SELECT d::date AS day, COALESCE(v.views, 0) AS views
		 FROM generate_series($1::date, now()::date, interval '1 day') AS d
		 LEFT JOIN (
		   SELECT created_at::date AS day, COUNT(*) AS views
		   FROM page_views WHERE created_at >= $1
		   GROUP BY created_at::date
		 ) v ON v.day = d::date
		 ORDER BY day ASC`,
		since,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	summary.ViewsByDay = []dayCount{}
	for dayRows.Next() {
		var day time.Time
		var views int64
		if err := dayRows.Scan(&day, &views); err == nil {
			summary.ViewsByDay = append(summary.ViewsByDay, dayCount{Date: day.Format("2006-01-02"), Views: views})
		}
	}
	dayRows.Close()

	return c.JSON(http.StatusOK, summary)
}
