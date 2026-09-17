-- These FKs (added in 0012) had no ON DELETE behavior, which would block deleting a user who
-- had ever changed a setting or requested review on something — the same "no ON DELETE clause"
-- gap already known to exist on the older created_by/author_id columns, avoided here for any
-- column added in this pass. SET NULL keeps the historical row/attribution slot but drops the
-- now-dangling reference, matching how the rest of the schema treats optional user references.
ALTER TABLE settings_history DROP CONSTRAINT settings_history_changed_by_fkey;
ALTER TABLE settings_history ADD CONSTRAINT settings_history_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE pages DROP CONSTRAINT pages_review_requested_by_fkey;
ALTER TABLE pages ADD CONSTRAINT pages_review_requested_by_fkey
    FOREIGN KEY (review_requested_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE apps DROP CONSTRAINT apps_review_requested_by_fkey;
ALTER TABLE apps ADD CONSTRAINT apps_review_requested_by_fkey
    FOREIGN KEY (review_requested_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE blog_posts DROP CONSTRAINT blog_posts_review_requested_by_fkey;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_review_requested_by_fkey
    FOREIGN KEY (review_requested_by) REFERENCES users(id) ON DELETE SET NULL;
