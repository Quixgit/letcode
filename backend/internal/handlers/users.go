package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/auth"
	"lecode.tech/backend/internal/db"
)

type UserHandler struct {
	Pool *pgxpool.Pool
}

type userListItem struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	Name        *string    `json:"name"`
	RoleName    string     `json:"role_name"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (h *UserHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()

	// trashed=true lists soft-deleted users instead of live ones (see Delete/Restore).
	deletedFilter := "u.deleted_at IS NULL"
	if c.QueryParam("trashed") == "true" {
		deletedFilter = "u.deleted_at IS NOT NULL"
	}

	rows, err := h.Pool.Query(ctx,
		`SELECT u.id, u.email, u.name, r.name, u.is_active, u.last_login_at, u.created_at
		 FROM users u JOIN roles r ON r.id = u.role_id
		 WHERE `+deletedFilter+`
		 ORDER BY u.created_at ASC`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	items := []userListItem{}
	for rows.Next() {
		var i userListItem
		if err := rows.Scan(&i.ID, &i.Email, &i.Name, &i.RoleName, &i.IsActive, &i.LastLoginAt, &i.CreatedAt); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}

type inviteRequest struct {
	Email    string `json:"email"`
	RoleName string `json:"role_name"`
}

func generateTempPassword() (string, error) {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (h *UserHandler) Invite(c echo.Context) error {
	var req inviteRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}
	if req.Email == "" || req.RoleName == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email_and_role_required"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()

	var roleID string
	if err := h.Pool.QueryRow(ctx, "SELECT id FROM roles WHERE name=$1", req.RoleName).Scan(&roleID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "unknown_role"})
	}

	tempPassword, err := generateTempPassword()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "password_generation_failed"})
	}
	hash, err := auth.HashPassword(tempPassword)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "hash_failed"})
	}

	var id string
	err = h.Pool.QueryRow(ctx,
		"INSERT INTO users (email, password_hash, role_id) VALUES ($1,$2,$3) RETURNING id",
		req.Email, hash, roleID,
	).Scan(&id)
	if err != nil {
		return c.JSON(http.StatusConflict, map[string]string{"error": "email_taken"})
	}

	return c.JSON(http.StatusCreated, map[string]string{"id": id, "temp_password": tempPassword})
}

type updateRoleRequest struct {
	RoleName string `json:"role_name"`
}

func (h *UserHandler) UpdateRole(c echo.Context) error {
	var req updateRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	var roleID string
	if err := h.Pool.QueryRow(ctx, "SELECT id FROM roles WHERE name=$1", req.RoleName).Scan(&roleID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "unknown_role"})
	}

	_, err := h.Pool.Exec(ctx, "UPDATE users SET role_id=$1, updated_at=now() WHERE id=$2", roleID, c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

type updateActiveRequest struct {
	IsActive bool `json:"is_active"`
}

func (h *UserHandler) UpdateActive(c echo.Context) error {
	var req updateActiveRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_body"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE users SET is_active=$1, updated_at=now() WHERE id=$2", req.IsActive, c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "update_failed"})
	}
	return c.NoContent(http.StatusOK)
}

// wouldRemoveLastAdmin reports whether deleting/deactivating targetID would leave the site
// with zero active, non-deleted admins — the one thing this handler refuses unconditionally,
// since a soft-deleted (or hard-deleted) admin's account can't undo itself.
func (h *UserHandler) wouldRemoveLastAdmin(ctx context.Context, targetID string) (bool, error) {
	var isTargetAdmin bool
	if err := h.Pool.QueryRow(ctx,
		`SELECT r.name = 'admin' FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
		targetID,
	).Scan(&isTargetAdmin); err != nil {
		return false, err
	}
	if !isTargetAdmin {
		return false, nil
	}

	var otherAdmins int
	if err := h.Pool.QueryRow(ctx,
		`SELECT count(*) FROM users u JOIN roles r ON r.id = u.role_id
		 WHERE r.name = 'admin' AND u.is_active = true AND u.deleted_at IS NULL AND u.id <> $1`,
		targetID,
	).Scan(&otherAdmins); err != nil {
		return false, err
	}
	return otherAdmins == 0, nil
}

// Delete moves a user to the trash (deleted_at set) rather than removing the row — content
// they authored (created_by/author_id columns, none of which cascade-delete) is left intact
// and still attributed to them. Their sessions are revoked immediately so access actually ends
// rather than lingering until their 30-day refresh token would otherwise expire.
func (h *UserHandler) Delete(c echo.Context) error {
	targetID := c.Param("id")
	callerID, _ := c.Get("user_id").(string)
	if targetID == callerID {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cannot_delete_self"})
	}

	ctx, cancel := db.WithTimeout()
	defer cancel()

	if blocked, err := h.wouldRemoveLastAdmin(ctx, targetID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	} else if blocked {
		return c.JSON(http.StatusConflict, map[string]string{"error": "cannot_delete_last_admin"})
	}

	if _, err := h.Pool.Exec(ctx, "UPDATE users SET deleted_at=now(), updated_at=now() WHERE id=$1", targetID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "delete_failed"})
	}
	h.Pool.Exec(ctx, "UPDATE refresh_tokens SET revoked=true WHERE user_id=$1", targetID)

	return c.NoContent(http.StatusNoContent)
}

func (h *UserHandler) Restore(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	_, err := h.Pool.Exec(ctx, "UPDATE users SET deleted_at=NULL, updated_at=now() WHERE id=$1", c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "restore_failed"})
	}
	return c.NoContent(http.StatusOK)
}
