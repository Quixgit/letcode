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

func runScheduledPublishLoop(pool *pgxpool.Pool, baseURL string) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		// Fresh bounded context per tick, not one shared context.Background() reused forever —
		// otherwise a single wedged tick's query holds its pool connection indefinitely and
		// every subsequent tick queues up behind it. See db.WithTimeout for the full story.
		func() {
			ctx, cancel := db.WithTimeout()
			defer cancel()

			pageRows, err := pool.Query(ctx,
				`UPDATE pages SET status='published', published_at=now(), scheduled_publish_at=NULL
				 WHERE status='draft' AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= now()
				 RETURNING slug`)
			if err != nil {
				log.Printf("scheduled publish (pages) failed: %v", err)
			} else {
				var urls []string
				for pageRows.Next() {
					var slug string
					if pageRows.Scan(&slug) == nil {
						urls = append(urls, baseURL+"/"+slug)
					}
				}
				pageRows.Close()
				handlers.PingIndexNow(pool, baseURL, urls)
			}

			appRows, err := pool.Query(ctx,
				`UPDATE apps SET status='published', published_at=now(), scheduled_publish_at=NULL
				 WHERE status='draft' AND scheduled_publish_at IS NOT NULL AND scheduled_publish_at <= now()
				 RETURNING slug`)
			if err != nil {
				log.Printf("scheduled publish (apps) failed: %v", err)
			} else {
				var urls []string
				for appRows.Next() {
					var slug string
					if appRows.Scan(&slug) == nil {
						urls = append(urls, baseURL+"/apps/"+slug)
					}
				}
				appRows.Close()
				handlers.PingIndexNow(pool, baseURL, urls)
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

	capMw := func(capability string) echo.MiddlewareFunc {
		return authmw.RequireCapability(jwtSecret, pool, capability)
	}
	auth := authmw.RequireAuth(jwtSecret)

	pageH := &handlers.PageHandler{Pool: pool, BaseURL: "https://lecode.tech"}
	e.GET("/api/pages/public", pageH.ListPublic)
	e.GET("/api/pages/public/:slug", pageH.GetBySlug)
	e.GET("/api/pages/preview/:id", pageH.PreviewByID)

	pagesGroup := e.Group("/api/pages", auth)
	pagesGroup.GET("", pageH.List)
	pagesGroup.GET("/:id", pageH.Get)
	pagesGroup.GET("/:id/revisions", pageH.ListRevisions)
	pagesWrite := e.Group("/api/pages", capMw("pages.write"))
	pagesWrite.POST("", pageH.Create)
	pagesWrite.PUT("/:id", pageH.Update)
	pagesWrite.PATCH("/:id/quick-edit", pageH.QuickEdit)
	pagesWrite.POST("/:id/publish", pageH.Publish)
	pagesWrite.POST("/:id/unpublish", pageH.Unpublish)
	pagesWrite.POST("/:id/schedule", pageH.Schedule)
	pagesWrite.POST("/:id/schedule/cancel", pageH.CancelSchedule)
	pagesWrite.POST("/:id/restore", pageH.Restore)
	pagesWrite.POST("/:id/submit-review", pageH.SubmitReview)
	e.DELETE("/api/pages/:id", pageH.Delete, capMw("pages.delete"))
	e.DELETE("/api/pages/:id/permanent", pageH.PermanentDelete, authmw.RequireRole(jwtSecret, pool, "admin"))
	e.POST("/api/pages/:id/review-decision", pageH.ReviewDecision, authmw.RequireRole(jwtSecret, pool, "admin"))

	appH := &handlers.AppHandler{Pool: pool, BaseURL: "https://lecode.tech"}
	e.GET("/api/apps/public", appH.ListPublic)
	e.GET("/api/apps/public/:slug", appH.GetBySlugPublic)

	appsGroup := e.Group("/api/apps", auth)
	appsGroup.GET("", appH.List)
	appsGroup.GET("/categories", appH.Categories)
	appsGroup.GET("/:id", appH.Get)
	appsWrite := e.Group("/api/apps", capMw("apps.write"))
	appsWrite.POST("", appH.Create)
	appsWrite.PUT("/:id", appH.Update)
	appsWrite.PATCH("/:id/quick-edit", appH.QuickEdit)
	appsWrite.POST("/:id/publish", appH.Publish)
	appsWrite.POST("/:id/unpublish", appH.Unpublish)
	appsWrite.POST("/:id/schedule", appH.Schedule)
	appsWrite.POST("/:id/schedule/cancel", appH.CancelSchedule)
	appsWrite.POST("/:id/restore", appH.Restore)
	appsWrite.POST("/:id/submit-review", appH.SubmitReview)
	appsWrite.POST("/:id/screenshots", appH.AddScreenshot)
	appsWrite.PUT("/:id/screenshots/:screenshotId", appH.UpdateScreenshot)
	appsWrite.DELETE("/:id/screenshots/:screenshotId", appH.DeleteScreenshot)
	e.DELETE("/api/apps/:id", appH.Delete, capMw("apps.delete"))
	e.DELETE("/api/apps/:id/permanent", appH.PermanentDelete, authmw.RequireRole(jwtSecret, pool, "admin"))
	e.POST("/api/apps/:id/review-decision", appH.ReviewDecision, authmw.RequireRole(jwtSecret, pool, "admin"))

	mediaH := &handlers.MediaHandler{Pool: pool, UploadDir: "uploads", PublicBase: "/uploads"}
	e.Static("/uploads", "uploads")

	mediaGroup := e.Group("/api/media", auth)
	mediaGroup.GET("", mediaH.List)
	mediaGroup.GET("/:id/usage", mediaH.Usage)
	mediaWrite := e.Group("/api/media", capMw("media.write"))
	mediaWrite.POST("/upload", mediaH.Upload)
	mediaWrite.PUT("/:id", mediaH.UpdateAltText)
	e.DELETE("/api/media/:id", mediaH.Delete, capMw("media.delete"))

	redirectH := &handlers.RedirectHandler{Pool: pool}
	e.GET("/api/redirects/lookup", redirectH.Lookup)
	redirectsGroup := e.Group("/api/redirects", auth)
	redirectsGroup.GET("", redirectH.List)
	e.POST("/api/redirects", redirectH.Create, capMw("redirects.write"))
	e.DELETE("/api/redirects/:id", redirectH.Delete, capMw("redirects.delete"))

	formsH := &handlers.FormsHandler{Pool: pool}
	e.POST("/api/forms/submit", formsH.Submit)
	submissionsGroup := e.Group("/api/submissions", auth)
	submissionsGroup.GET("", formsH.List)
	submissionsGroup.GET("/unread-count", formsH.UnreadCount)
	e.PATCH("/api/submissions/:id/read", formsH.MarkRead, capMw("submissions.write"))
	e.DELETE("/api/submissions/:id", formsH.Delete, capMw("submissions.delete"))

	auditH := &handlers.AuditHandler{Pool: pool}
	e.GET("/api/audit-logs", auditH.List, auth)

	settingsH := &handlers.SettingsHandler{Pool: pool}
	e.GET("/api/settings/public", settingsH.ListPublic)
	settingsGroup := e.Group("/api/settings", auth)
	settingsGroup.GET("", settingsH.List)
	settingsGroup.GET("/history", settingsH.History)
	e.PUT("/api/settings", settingsH.Update, capMw("settings.write"))

	navH := &handlers.NavHandler{Pool: pool}
	e.GET("/api/nav-items/public", navH.ListPublic)
	navGroup := e.Group("/api/nav-items", auth)
	navGroup.GET("", navH.List)
	navWrite := e.Group("/api/nav-items", capMw("nav.write"))
	navWrite.POST("", navH.Create)
	navWrite.PUT("/reorder", navH.Reorder)
	navWrite.PUT("/:id", navH.Update)
	e.DELETE("/api/nav-items/:id", navH.Delete, capMw("nav.delete"))

	userH := &handlers.UserHandler{Pool: pool}
	usersGroup := e.Group("/api/users", authmw.RequireRole(jwtSecret, pool, "admin"))
	usersGroup.GET("", userH.List)
	usersGroup.POST("/invite", userH.Invite)
	usersGroup.PUT("/:id/role", userH.UpdateRole)
	usersGroup.PUT("/:id/active", userH.UpdateActive)
	usersGroup.DELETE("/:id", userH.Delete)
	usersGroup.POST("/:id/restore", userH.Restore)

	blogH := &handlers.BlogHandler{Pool: pool, BaseURL: "https://lecode.tech"}
	e.GET("/api/blog/public", blogH.ListPublic)
	e.GET("/api/blog/public/:slug", blogH.GetBySlugPublic)

	blogGroup := e.Group("/api/blog", auth)
	blogGroup.GET("", blogH.List)
	blogGroup.GET("/tags", blogH.Tags)
	blogGroup.GET("/:id", blogH.Get)
	blogWrite := e.Group("/api/blog", capMw("blog.write"))
	blogWrite.POST("", blogH.Create)
	blogWrite.PUT("/:id", blogH.Update)
	blogWrite.PATCH("/:id/quick-edit", blogH.QuickEdit)
	blogWrite.POST("/:id/publish", blogH.Publish)
	blogWrite.POST("/:id/unpublish", blogH.Unpublish)
	blogWrite.POST("/:id/schedule", blogH.Schedule)
	blogWrite.POST("/:id/schedule/cancel", blogH.CancelSchedule)
	blogWrite.POST("/:id/restore", blogH.Restore)
	blogWrite.POST("/:id/submit-review", blogH.SubmitReview)
	e.DELETE("/api/blog/:id", blogH.Delete, capMw("blog.delete"))
	e.DELETE("/api/blog/:id/permanent", blogH.PermanentDelete, authmw.RequireRole(jwtSecret, pool, "admin"))
	e.POST("/api/blog/:id/review-decision", blogH.ReviewDecision, authmw.RequireRole(jwtSecret, pool, "admin"))

	testimonialH := &handlers.TestimonialHandler{Pool: pool}
	e.GET("/api/testimonials/public", testimonialH.ListPublic)
	testimonialGroup := e.Group("/api/testimonials", auth)
	testimonialGroup.GET("", testimonialH.List)
	e.POST("/api/testimonials", testimonialH.Create, capMw("testimonials.write"))
	e.PUT("/api/testimonials/:id", testimonialH.Update, capMw("testimonials.write"))
	e.DELETE("/api/testimonials/:id", testimonialH.Delete, capMw("testimonials.delete"))

	templateH := &handlers.TemplateHandler{Pool: pool}
	e.GET("/api/templates/active", templateH.GetActivePublic)
	templateGroup := e.Group("/api/templates", auth)
	templateGroup.GET("", templateH.List)
	templateWrite := e.Group("/api/templates", capMw("templates.write"))
	templateWrite.POST("/:id/activate", templateH.Activate)
	templateWrite.PUT("/:id", templateH.Update)

	analyticsH := &handlers.AnalyticsHandler{Pool: pool}
	e.POST("/api/track", analyticsH.Track)
	e.GET("/api/analytics/summary", analyticsH.Summary, authmw.RequireAuth(jwtSecret))

	seoH := &handlers.SEOHandler{Pool: pool, BaseURL: "https://lecode.tech"}
	e.GET("/sitemap.xml", seoH.Sitemap)
	e.GET("/robots.txt", seoH.Robots)
	e.GET("/llms.txt", seoH.LLMsTxt)

	// IndexNow verification file, served under /api/ (see seo.go's PingIndexNow for why it's
	// not at the conventional domain-root "/<key>.txt" — Caddy doesn't proxy that path here).
	// Registered dynamically off the real key rather than a fixed path since the key itself is
	// generated on first boot.
	if indexNowKey := handlers.EnsureIndexNowKey(pool); indexNowKey != "" {
		e.GET("/api/"+indexNowKey+".txt", func(c echo.Context) error {
			return c.String(http.StatusOK, indexNowKey)
		})
	}

	go runScheduledPublishLoop(pool, "https://lecode.tech")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("lecode.tech backend listening on :%s", port)
	if err := e.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}
