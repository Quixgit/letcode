package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

// Shared trash (soft-delete) and review/approval-workflow implementation for the three
// content tables that all got identical `deleted_at`/`review_status` columns in migration
// 0012 (pages, apps, blog_posts). `table` is always a fixed string literal supplied by the
// call site in each handler file — never request-derived — so building the query with it is
// not a SQL-injection risk.

type submitReviewRequest struct {
	Note string `json:"note"`
}

type reviewDecisionRequest struct {
	Decision string `json:"decision"` // "approved" | "changes_requested"
	Note     string `json:"note"`
}

func submitReview(pool *pgxpool.Pool, table string) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req submitReviewRequest
		c.Bind(&req)
		userID := c.Get("user_id")

		ctx, cancel := db.WithTimeout()
		defer cancel()
		_, err := pool.Exec(ctx,
			`UPDATE `+table+` SET review_status='pending_review', review_requested_by=$1, review_note=$2, updated_at=now() WHERE id=$3`,
			userID, req.Note, c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "submit_review_failed"})
		}
		return c.NoContent(http.StatusOK)
	}
}

func reviewDecision(pool *pgxpool.Pool, table string) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req reviewDecisionRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
		}
		if req.Decision != "approved" && req.Decision != "changes_requested" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_decision"})
		}

		ctx, cancel := db.WithTimeout()
		defer cancel()
		_, err := pool.Exec(ctx,
			`UPDATE `+table+` SET review_status=$1, review_note=$2, updated_at=now() WHERE id=$3`,
			req.Decision, req.Note, c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "review_decision_failed"})
		}
		return c.NoContent(http.StatusOK)
	}
}

func restoreContent(pool *pgxpool.Pool, table string) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := db.WithTimeout()
		defer cancel()
		_, err := pool.Exec(ctx, `UPDATE `+table+` SET deleted_at=NULL, updated_at=now() WHERE id=$1`, c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "restore_failed"})
		}
		return c.NoContent(http.StatusOK)
	}
}

func softDeleteContent(pool *pgxpool.Pool, table string) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := db.WithTimeout()
		defer cancel()
		_, err := pool.Exec(ctx, `UPDATE `+table+` SET deleted_at=now(), updated_at=now() WHERE id=$1`, c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
		}
		return c.NoContent(http.StatusNoContent)
	}
}

// permanentDeleteContent only hard-deletes rows already in the trash — you can't skip the
// trash step, matching WordPress's "Trash, then Delete Permanently" two-step.
func permanentDeleteContent(pool *pgxpool.Pool, table string) echo.HandlerFunc {
	return func(c echo.Context) error {
		ctx, cancel := db.WithTimeout()
		defer cancel()
		_, err := pool.Exec(ctx, `DELETE FROM `+table+` WHERE id=$1 AND deleted_at IS NOT NULL`, c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
		}
		return c.NoContent(http.StatusNoContent)
	}
}
