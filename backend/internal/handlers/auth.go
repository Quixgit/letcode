package handlers

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/auth"
	"lecode.tech/backend/internal/db"
)

type AuthHandler struct {
	Pool   *pgxpool.Pool
	Secret string
}

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) Register(c echo.Context) error {
	var req registerRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Email == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email_and_password_required"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()

	var roleID string
	if err := h.Pool.QueryRow(ctx, "SELECT id FROM roles WHERE name='viewer'").Scan(&roleID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "default_role_missing"})
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "hash_failed"})
	}

	var userID string
	err = h.Pool.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name, role_id) VALUES ($1,$2,$3,$4) RETURNING id`,
		req.Email, hash, req.Name, roleID,
	).Scan(&userID)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "email_taken"})
	}

	return h.issueTokens(c, userID, roleID, http.StatusCreated)
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var userID, roleID, hash string
	err := h.Pool.QueryRow(ctx,
		"SELECT id, role_id, password_hash FROM users WHERE email=$1 AND is_active=true",
		req.Email,
	).Scan(&userID, &roleID, &hash)
	if err != nil || !auth.CheckPassword(req.Password, hash) {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid_credentials"})
	}

	h.Pool.Exec(ctx, "UPDATE users SET last_login_at=now() WHERE id=$1", userID)

	return h.issueTokens(c, userID, roleID, http.StatusOK)
}

func (h *AuthHandler) Refresh(c echo.Context) error {
	var req refreshRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT rt.id, rt.token_hash, u.id, u.role_id FROM refresh_tokens rt
		 JOIN users u ON u.id = rt.user_id
		 WHERE rt.revoked=false AND rt.expires_at > now()`,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	var tokenID, userID, roleID string
	found := false
	for rows.Next() {
		var id, hash, uID, rID string
		rows.Scan(&id, &hash, &uID, &rID)
		if auth.CheckPassword(req.RefreshToken, hash) {
			tokenID, userID, roleID = id, uID, rID
			found = true
			break
		}
	}
	if !found {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid_refresh_token"})
	}

	h.Pool.Exec(ctx, "UPDATE refresh_tokens SET revoked=true WHERE id=$1", tokenID)

	return h.issueTokens(c, userID, roleID, http.StatusOK)
}

func (h *AuthHandler) Logout(c echo.Context) error {
	var req refreshRequest
	c.Bind(&req)

	ctx, cancel := db.WithTimeout()
	defer cancel()
	h.Pool.Exec(ctx, "UPDATE refresh_tokens SET revoked=true WHERE user_id=$1", c.Get("user_id"))
	return c.NoContent(http.StatusNoContent)
}

func (h *AuthHandler) Me(c echo.Context) error {
	userID, _ := c.Get("user_id").(string)

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var email string
	var name *string
	var roleName string
	err := h.Pool.QueryRow(ctx,
		`SELECT u.email, u.name, r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id=$1`,
		userID,
	).Scan(&email, &name, &roleName)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"email": email,
		"name":  name,
		"role":  roleName,
	})
}

func (h *AuthHandler) issueTokens(c echo.Context, userID, roleID string, status int) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	access, err := auth.GenerateAccessToken(h.Secret, userID, roleID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "token_generation_failed"})
	}

	rawRefresh, hashedRefresh, err := auth.GenerateRefreshToken()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "token_generation_failed"})
	}

	_, err = h.Pool.Exec(ctx,
		"INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)",
		userID, hashedRefresh, time.Now().Add(30*24*time.Hour),
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "refresh_token_save_failed"})
	}

	return c.JSON(status, map[string]string{
		"access_token":  access,
		"refresh_token": rawRefresh,
	})
}
