package middleware

import (
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/auth"
	"lecode.tech/backend/internal/db"
)

func RequireAuth(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing_token"})
			}
			tokenString := strings.TrimPrefix(header, "Bearer ")

			claims, err := auth.ParseAccessToken(secret, tokenString)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid_token"})
			}

			c.Set("user_id", claims.UserID)
			c.Set("role_id", claims.RoleID)
			return next(c)
		}
	}
}

// RequireRole wraps RequireAuth with a real server-side role check — used where a
// role name (not a content capability) is the right unit of access, i.e. user
// management: anyone with a valid token could otherwise invite users or grant
// themselves admin via a direct API call.
func RequireRole(secret string, pool *pgxpool.Pool, allowed ...string) echo.MiddlewareFunc {
	requireAuth := RequireAuth(secret)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return requireAuth(func(c echo.Context) error {
			userID, _ := c.Get("user_id").(string)

			ctx, cancel := db.WithTimeout()
			defer cancel()
			var roleName string
			err := pool.QueryRow(ctx,
				"SELECT r.name FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id=$1",
				userID,
			).Scan(&roleName)
			if err != nil {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "forbidden"})
			}

			for _, role := range allowed {
				if roleName == role {
					return next(c)
				}
			}
			return c.JSON(http.StatusForbidden, map[string]string{"error": "forbidden"})
		})
	}
}

// RequireCapability wraps RequireAuth with a real server-side check against the
// caller's role's `permissions` JSONB array (e.g. "pages.write") — an admin's "*"
// entry always passes. This is what gates every content-mutating route (pages,
// apps, blog, media, redirects, nav, testimonials, templates, settings): previously
// those routes only checked for a *valid token*, so any authenticated user —
// including a viewer — could edit or delete anything via a direct API call, even
// though the UI hid the buttons for them. See RequireRole for the role-name-based
// variant used by user management specifically.
func RequireCapability(secret string, pool *pgxpool.Pool, capability string) echo.MiddlewareFunc {
	requireAuth := RequireAuth(secret)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return requireAuth(func(c echo.Context) error {
			userID, _ := c.Get("user_id").(string)

			ctx, cancel := db.WithTimeout()
			defer cancel()
			var allowed bool
			err := pool.QueryRow(ctx,
				`SELECT (r.permissions ? '*') OR (r.permissions ? $2)
				 FROM roles r JOIN users u ON u.role_id = r.id
				 WHERE u.id=$1 AND u.deleted_at IS NULL`,
				userID, capability,
			).Scan(&allowed)
			if err != nil || !allowed {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "forbidden"})
			}
			return next(c)
		})
	}
}
