package handlers

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"

	"lecode.tech/backend/internal/db"
)

type AuditHandler struct {
	Pool *pgxpool.Pool
}

func (h *AuditHandler) List(c echo.Context) error {
	ctx, cancel := db.WithTimeout()
	defer cancel()
	rows, err := h.Pool.Query(ctx,
		`SELECT al.id, al.action, al.entity_type, al.entity_id, al.ip_address, al.created_at, u.email
		 FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id
		 ORDER BY al.created_at DESC LIMIT 200`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "query_failed"})
	}
	defer rows.Close()

	type item struct {
		ID         string    `json:"id"`
		Action     string    `json:"action"`
		EntityType string    `json:"entity_type"`
		EntityID   *string   `json:"entity_id"`
		IPAddress  *string   `json:"ip_address"`
		CreatedAt  time.Time `json:"created_at"`
		UserEmail  *string   `json:"user_email"`
	}
	items := []item{}
	for rows.Next() {
		var i item
		if err := rows.Scan(&i.ID, &i.Action, &i.EntityType, &i.EntityID, &i.IPAddress, &i.CreatedAt, &i.UserEmail); err == nil {
			items = append(items, i)
		}
	}
	return c.JSON(http.StatusOK, items)
}
