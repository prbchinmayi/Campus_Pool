-- 04_reviews.sql
-- Ratings and reviews table with unique constraint per reviewer per ride per reviewed user
CREATE TABLE ratings_reviews (
    review_id         SERIAL PRIMARY KEY,
    ride_id           INT  NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE,
    reviewer_id       INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reviewed_user_id  INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating            INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment           TEXT,
    review_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    flagged           BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT one_review_per_pair_per_ride UNIQUE (ride_id, reviewer_id, reviewed_user_id)
);
