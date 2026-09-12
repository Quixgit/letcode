package models

import (
	"encoding/json"
	"time"
)

type Role struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Permissions json.RawMessage `json:"permissions"`
	CreatedAt   time.Time       `json:"created_at"`
}

type User struct {
	ID          string     `json:"id"`
	Email       string     `json:"email"`
	PasswordHash string    `json:"-"`
	Name        *string    `json:"name,omitempty"`
	RoleID      string     `json:"role_id"`
	AvatarURL   *string    `json:"avatar_url,omitempty"`
	IsActive    bool       `json:"is_active"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Page struct {
	ID          string          `json:"id"`
	Slug        string          `json:"slug"`
	Title       string          `json:"title"`
	Template    string          `json:"template"`
	Status      string          `json:"status"` // draft | published | archived
	Content     json.RawMessage `json:"content"`

	MetaTitle       *string         `json:"meta_title,omitempty"`
	MetaDescription *string         `json:"meta_description,omitempty"`
	OGImageURL      *string         `json:"og_image_url,omitempty"`
	CanonicalURL    *string         `json:"canonical_url,omitempty"`
	NoIndex         bool            `json:"noindex"`
	StructuredData  json.RawMessage `json:"structured_data,omitempty"`

	CreatedBy          *string    `json:"created_by,omitempty"`
	UpdatedBy          *string    `json:"updated_by,omitempty"`
	PublishedAt        *time.Time `json:"published_at,omitempty"`
	ScheduledPublishAt *time.Time `json:"scheduled_publish_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type PageRevision struct {
	ID        string          `json:"id"`
	PageID    string          `json:"page_id"`
	Content   json.RawMessage `json:"content"`
	CreatedBy *string         `json:"created_by,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

type Media struct {
	ID          string    `json:"id"`
	Filename    string    `json:"filename"`
	URL         string    `json:"url"`
	MimeType    string    `json:"mime_type"`
	SizeBytes   int64     `json:"size_bytes"`
	Width       *int      `json:"width,omitempty"`
	Height      *int      `json:"height,omitempty"`
	AltText     *string   `json:"alt_text,omitempty"`
	UploadedBy  *string   `json:"uploaded_by,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type Redirect struct {
	ID         string    `json:"id"`
	FromPath   string    `json:"from_path"`
	ToPath     string    `json:"to_path"`
	StatusCode int       `json:"status_code"`
	CreatedAt  time.Time `json:"created_at"`
}

type AuditLog struct {
	ID         string          `json:"id"`
	UserID     *string         `json:"user_id,omitempty"`
	Action     string          `json:"action"`
	EntityType string          `json:"entity_type"`
	EntityID   *string         `json:"entity_id,omitempty"`
	Changes    json.RawMessage `json:"changes,omitempty"`
	IPAddress  *string         `json:"ip_address,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

type App struct {
	ID             string          `json:"id"`
	Slug           string          `json:"slug"`
	Name           string          `json:"name"`
	Category       *string         `json:"category,omitempty"`
	IconMediaID    *string         `json:"icon_media_id,omitempty"`

	ShortDescription *string         `json:"short_description,omitempty"`
	Description      *string         `json:"description,omitempty"`
	Features         json.RawMessage `json:"features"`

	PrivacyPolicyContent *string `json:"privacy_policy_content,omitempty"`
	InstructionsContent  *string `json:"instructions_content,omitempty"`

	GooglePlayURL *string `json:"google_play_url,omitempty"`
	AppStoreURL   *string `json:"app_store_url,omitempty"`
	WebsiteURL    *string `json:"website_url,omitempty"`
	PricingNote   *string `json:"pricing_note,omitempty"`

	Status    string `json:"status"`
	SortOrder int    `json:"sort_order"`

	MetaTitle       *string `json:"meta_title,omitempty"`
	MetaDescription *string `json:"meta_description,omitempty"`
	OGImageURL      *string `json:"og_image_url,omitempty"`

	CreatedBy   *string    `json:"created_by,omitempty"`
	UpdatedBy   *string    `json:"updated_by,omitempty"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	Screenshots []AppScreenshot `json:"screenshots,omitempty"`
}

type AppScreenshot struct {
	ID        string    `json:"id"`
	AppID     string    `json:"app_id"`
	MediaID   string    `json:"media_id"`
	URL       string    `json:"url,omitempty"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}
