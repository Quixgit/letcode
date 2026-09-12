package db

import (
	"context"
	"embed"
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// QueryTimeout bounds every database call issued outside an HTTP request's own lifecycle.
//
// Without a bound, a single wedged connection (a network blip between backend and postgres,
// lock contention, a connection that goes silently half-open) can hold a pool slot forever —
// and every request queued behind it — turning one stuck query into a full outage, even
// though /healthz keeps responding (health checks only probe *idle* connections, never one
// stuck mid-query). This bit repeatedly in production: "admin pages stuck on Loading..." with
// a healthy /healthz but every DB-touching endpoint hanging indefinitely, fixed each time by
// restarting the backend to force the pool to reconnect. Handlers now use db.WithTimeout()
// instead of context.Background() so a stuck call fails and releases its connection on its
// own within QueryTimeout, instead of needing a manual restart.
const QueryTimeout = 15 * time.Second

// WithTimeout returns a context bounded to QueryTimeout. Use this instead of
// context.Background() for any handler- or background-loop-initiated database call.
func WithTimeout() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), QueryTimeout)
}

func Connect(ctx context.Context, connString string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("parse config: %w", err)
	}

	// Server-side backstop: aborts any single statement that runs past this, freeing its
	// connection even in the (unlikely, given QueryTimeout above) case a caller's context
	// isn't honored. Deliberately a bit longer than QueryTimeout so the client-side timeout
	// is normally what fires first, with a clean context.DeadlineExceeded.
	config.ConnConfig.RuntimeParams["statement_timeout"] = "20000"

	// Recycle connections more aggressively than the pgx defaults (1h lifetime / 30m idle /
	// 1m health check) so a connection quietly broken by a network blip doesn't sit around
	// for up to an hour before anything notices it's bad.
	config.MaxConnLifetime = 30 * time.Minute
	config.MaxConnIdleTime = 5 * time.Minute
	config.HealthCheckPeriod = 30 * time.Second

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}
	return pool, nil
}

func RunMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`)
	if err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var names []string
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	for _, name := range names {
		var exists bool
		err := pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)", name).Scan(&exists)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", name, err)
		}
		if exists {
			continue
		}

		content, err := migrationsFS.ReadFile("migrations/" + name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}

		tx, err := pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("begin tx for %s: %w", name, err)
		}
		if _, err := tx.Exec(ctx, string(content)); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("exec migration %s: %w", name, err)
		}
		if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", name); err != nil {
			tx.Rollback(ctx)
			return fmt.Errorf("record migration %s: %w", name, err)
		}
		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit migration %s: %w", name, err)
		}
		log.Printf("applied migration: %s", name)
	}

	return nil
}
