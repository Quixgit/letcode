package middleware

import (
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

// auditEntity derives a resource name ("pages", "users", ...) and the target row's id (from
// the route's :id param, when present) from an Echo route template like "/api/pages/:id/publish".
// Previously entity_type stored the raw route template itself and entity_id was never populated,
// so the audit log couldn't answer "which page/user did this action touch" — only "what route".
func auditEntity(routePath, idParam string) (string, *string) {
	entityType := routePath
	if parts := strings.Split(strings.Trim(routePath, "/"), "/"); len(parts) >= 2 && parts[0] == "api" {
		entityType = parts[1]
	}
	if idParam == "" {
		return entityType, nil
	}
	return entityType, &idParam
}

func AuditLog(pool *pgxpool.Pool) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			err := next(c)

			method := c.Request().Method
			if method == "GET" || method == "OPTIONS" || method == "HEAD" {
				return err
			}

			status := c.Response().Status
			if status >= 400 {
				return err
			}

			userID, _ := c.Get("user_id").(string)
			if userID == "" {
				return err
			}

			entityType, entityID := auditEntity(c.Path(), c.Param("id"))

			// Own timeout context created inside the goroutine, not deferred in the outer
			// function: this write is fire-and-forget, so a deferred cancel() out here would
			// fire (and cancel the query) the instant the outer function returns, almost
			// immediately after the goroutine starts.
			go func() {
				ctx, cancel := db.WithTimeout()
				defer cancel()
				pool.Exec(ctx,
					`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
					 VALUES ($1,$2,$3,$4,$5)`,
					userID, method, entityType, entityID, c.RealIP(),
				)
			}()

			return err
		}
	}
}
