package middleware

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

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

			// Own timeout context created inside the goroutine, not deferred in the outer
			// function: this write is fire-and-forget, so a deferred cancel() out here would
			// fire (and cancel the query) the instant the outer function returns, almost
			// immediately after the goroutine starts.
			go func() {
				ctx, cancel := db.WithTimeout()
				defer cancel()
				pool.Exec(ctx,
					`INSERT INTO audit_logs (user_id, action, entity_type, ip_address)
					 VALUES ($1,$2,$3,$4)`,
					userID, method, c.Path(), c.RealIP(),
				)
			}()

			return err
		}
	}
}
