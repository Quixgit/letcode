package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"lecode.tech/backend/internal/db"
	"lecode.tech/backend/internal/handlers"
	authmw "lecode.tech/backend/internal/middleware"
)

func runScheduledPublishLoop(pool *pgxpool.Pool) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		// Fresh bounded context per tick, not one shared context.Background() reused forever —
		// otherwise a single wedged tick's query holds its pool connection indefinitely and
		// every subsequent tick queues up behind it. See db.WithTimeout for the full story.
		func() {
			ctx, cancel := db.WithTimeout()
			defer cancel()
			if _, err := pool.Exec(ctx,
				`UPDATE pages SET status='published', published_at=now(), scheduled_publish_at=NULL
				 WHERE status='draft' AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= now()`,
			); err != nil {
				log.Printf("scheduled publish (pages) failed: %v", err)
			}
			if _, err := pool.Exec(ctx,
				`UPDATE apps SET status='published', published_at=now(), scheduled_publish_at=NULL
				 WHERE status='draft' AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= now()`,
			); err != nil {
				log.Printf("scheduled publish (apps) failed: %v", err)
			}
		}()
	}
}

func main() {
	ctx := context.Background()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://lecode:lecode@localhost:5432/lecode?sslmode=disable"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-change-me"
	}

	pool, err := db.Connect(ctx, dbURL)
	if err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	defer pool.Close()

	if err := db.RunMigrations(ctx, pool); err != nil {
		log.Fatalf("migrations failed: %v", err)
	}

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(authmw.AuditLog(pool))

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	authH := &handlers.AuthHandler{Pool: pool, Secret: jwtSecret}
	e.POST("/auth/register", authH.Register)
	e.POST("/auth/login", authH.Login)
	e.POST("/auth/refresh", authH.Refresh)
	e.POST("/auth/logout", authH.Logout, authmw.RequireAuth(jwtSecret))
	e.GET("/auth/me", authH.Me, authmw.RequireAuth(jwtSecret))

	pageH := &handlers.PageHandler{Pool: pool}
	e.GET("/api/pages/public", pageH.ListPublic)
	e.GET("/api/pages/public/:slug", pageH.GetBySlug)
	e.GET("/api/pages/preview/:id", pageH.PreviewByID)

	pagesGroup := e.Group("/api/pages", authmw.RequireAuth(jwtSecret))
	pagesGroup.GET("", pageH.List)
	pagesGroup.GET("/:id", pageH.Get)
	pagesGroup.POST("", pageH.Create)
	pagesGroup.PUT("/:id", pageH.Update)
	pagesGroup.PATCH("/:id/quick-edit", pageH.QuickEdit)
	pagesGroup.POST("/:id/publish", pageH.Publish)
	pagesGroup.POST("/:id/unpublish", pageH.Unpublish)
	pagesGroup.POST("/:id/schedule", pageH.Schedule)
	pagesGroup.POST("/:id/schedule/cancel", pageH.CancelSchedule)
	pagesGroup.DELETE("/:id", pageH.Delete)
	pagesGroup.GET("/:id/revisions", pageH.ListRevisions)

	appH := &handlers.AppHandler{Pool: pool}
	e.GET("/api/apps/public", appH.ListPublic)
	e.GET("/api/apps/public/:slug", appH.GetBySlugPublic)

	appsGroup := e.Group("/api/apps", authmw.RequireAuth(jwtSecret))
	appsGroup.GET("", appH.List)
	appsGroup.GET("/categories", appH.Categories)
	appsGroup.GET("/:id", appH.Get)
	appsGroup.POST("", appH.Create)
	appsGroup.PUT("/:id", appH.Update)
	appsGroup.PATCH("/:id/quick-edit", appH.QuickEdit)
	appsGroup.POST("/:id/publish", appH.Publish)
	appsGroup.POST("/:id/unpublish", appH.Unpublish)
	appsGroup.POST("/:id/schedule", appH.Schedule)
	appsGroup.POST("/:id/schedule/cancel", appH.CancelSchedule)
	appsGroup.DELETE("/:id", appH.Delete)
	appsGroup.POST("/:id/screenshots", appH.AddScreenshot)
	appsGroup.PUT("/:id/screenshots/:screenshotId", appH.UpdateScreenshot)
	appsGroup.DELETE("/:id/screenshots/:screenshotId", appH.DeleteScreenshot)

	mediaH := &handlers.MediaHandler{Pool: pool, UploadDir: "uploads", PublicBase: "/uploads"}
	e.Static("/uploads", "uploads")

	mediaGroup := e.Group("/api/media", authmw.RequireAuth(jwtSecret))
	mediaGroup.GET("", mediaH.List)
	mediaGroup.POST("/upload", mediaH.Upload)
	mediaGroup.PUT("/:id", mediaH.UpdateAltText)
	mediaGroup.DELETE("/:id", mediaH.Delete)

	redirectH := &handlers.RedirectHandler{Pool: pool}
	e.GET("/api/redirects/lookup", redirectH.Lookup)
	redirectsGroup := e.Group("/api/redirects", authmw.RequireAuth(jwtSecret))
	redirectsGroup.GET("", redirectH.List)
	redirectsGroup.POST("", redirectH.Create)
	redirectsGroup.DELETE("/:id", redirectH.Delete)

	auditH := &handlers.AuditHandler{Pool: pool}
	e.GET("/api/audit-logs", auditH.List, authmw.RequireAuth(jwtSecret))

	settingsH := &handlers.SettingsHandler{Pool: pool}
	e.GET("/api/settings/public", settingsH.ListPublic)
	settingsGroup := e.Group("/api/settings", authmw.RequireAuth(jwtSecret))
	settingsGroup.GET("", settingsH.List)
	settingsGroup.PUT("", settingsH.Update)

	navH := &handlers.NavHandler{Pool: pool}
	e.GET("/api/nav-items/public", navH.ListPublic)
	navGroup := e.Group("/api/nav-items", authmw.RequireAuth(jwtSecret))
	navGroup.GET("", navH.List)
	navGroup.POST("", navH.Create)
	navGroup.PUT("/reorder", navH.Reorder)
	navGroup.PUT("/:id", navH.Update)
	navGroup.DELETE("/:id", navH.Delete)

	userH := &handlers.UserHandler{Pool: pool}
	usersGroup := e.Group("/api/users", authmw.RequireRole(jwtSecret, pool, "admin"))
	usersGroup.GET("", userH.List)
	usersGroup.POST("/invite", userH.Invite)
	usersGroup.PUT("/:id/role", userH.UpdateRole)
	usersGroup.PUT("/:id/active", userH.UpdateActive)

	blogH := &handlers.BlogHandler{Pool: pool, BaseURL: "https://lecode.tech"}
	e.GET("/api/blog/public", blogH.ListPublic)
	e.GET("/api/blog/public/:slug", blogH.GetBySlugPublic)
	e.GET("/blog/feed.xml", blogH.Feed)

	blogGroup := e.Group("/api/blog", authmw.RequireAuth(jwtSecret))
	blogGroup.GET("", blogH.List)
	blogGroup.GET("/tags", blogH.Tags)
	blogGroup.GET("/:id", blogH.Get)
	blogGroup.POST("", blogH.Create)
	blogGroup.PUT("/:id", blogH.Update)
	blogGroup.PATCH("/:id/quick-edit", blogH.QuickEdit)
	blogGroup.POST("/:id/publish", blogH.Publish)
	blogGroup.POST("/:id/unpublish", blogH.Unpublish)
	blogGroup.POST("/:id/schedule", blogH.Schedule)
	blogGroup.POST("/:id/schedule/cancel", blogH.CancelSchedule)
	blogGroup.DELETE("/:id", blogH.Delete)

	testimonialH := &handlers.TestimonialHandler{Pool: pool}
	e.GET("/api/testimonials/public", testimonialH.ListPublic)
	testimonialGroup := e.Group("/api/testimonials", authmw.RequireAuth(jwtSecret))
	testimonialGroup.GET("", testimonialH.List)
	testimonialGroup.POST("", testimonialH.Create)
	testimonialGroup.PUT("/:id", testimonialH.Update)
	testimonialGroup.DELETE("/:id", testimonialH.Delete)

	templateH := &handlers.TemplateHandler{Pool: pool}
	e.GET("/api/templates/active", templateH.GetActivePublic)
	templateGroup := e.Group("/api/templates", authmw.RequireAuth(jwtSecret))
	templateGroup.GET("", templateH.List)
	templateGroup.POST("/:id/activate", templateH.Activate)
	templateGroup.PUT("/:id", templateH.Update)

	analyticsH := &handlers.AnalyticsHandler{Pool: pool}
	e.POST("/api/track", analyticsH.Track)
	e.GET("/api/analytics/summary", analyticsH.Summary, authmw.RequireAuth(jwtSecret))

	seoH := &handlers.SEOHandler{Pool: pool, BaseURL: "https://lecode.tech"}
	e.GET("/sitemap.xml", seoH.Sitemap)
	e.GET("/robots.txt", seoH.Robots)
	e.GET("/llms.txt", seoH.LLMsTxt)

	go runScheduledPublishLoop(pool)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("lecode.tech backend listening on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}
