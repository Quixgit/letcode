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

// RequireRole wraps RequireAuth with a real server-side role check — the only
// place in this codebase that does so, since every other RBAC gate is UI-only
// by design. Used where a UI-only gate would be an actual security gap (user
// management: anyone with a valid token could otherwise invite users or grant
// themselves admin via a direct API call).
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
