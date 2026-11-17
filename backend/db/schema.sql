-- ============================================================
-- CampusPool — PostgreSQL Schema
-- ============================================================

-- ENUMS
CREATE TYPE user_role       AS ENUM ('admin', 'driver', 'rider');
CREATE TYPE account_status  AS ENUM ('active', 'suspended');
CREATE TYPE ride_status     AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
-- For existing databases run: ALTER TYPE request_status ADD VALUE 'cancelled';
CREATE TYPE request_status  AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE resolution_status AS ENUM ('open', 'resolved');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    user_id           SERIAL PRIMARY KEY,
    name              VARCHAR(100)  NOT NULL,
    college_id        VARCHAR(50)   NOT NULL UNIQUE,
    email             VARCHAR(150)  NOT NULL UNIQUE,
    phone             VARCHAR(15)   NOT NULL,
    password_hash     TEXT          NOT NULL,
    role              user_role     NOT NULL DEFAULT 'rider',
    account_status    account_status NOT NULL DEFAULT 'active',
    vehicle_id        INT            REFERENCES vehicles(vehicle_id),
    registration_date TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE vehicles (
    vehicle_id          SERIAL PRIMARY KEY,
    owner_id            INT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    vehicle_type        VARCHAR(50)  NOT NULL,
    registration_number VARCHAR(20)  NOT NULL UNIQUE,
    model               VARCHAR(100) NOT NULL,
    seating_capacity    INT          NOT NULL CHECK (seating_capacity > 0)
);

-- ============================================================
-- RIDES
-- ============================================================
CREATE TABLE rides (
    ride_id         SERIAL PRIMARY KEY,
    driver_id       INT           NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    vehicle_id      INT           NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
    source          VARCHAR(200)  NOT NULL,
    destination     VARCHAR(200)  NOT NULL,
    date            DATE          NOT NULL,
    departure_time  TIME          NOT NULL,
    total_seats     INT           NOT NULL CHECK (total_seats > 0),
    available_seats INT           NOT NULL CHECK (available_seats >= 0),
    cost_per_seat   NUMERIC(8,2)  NOT NULL CHECK (cost_per_seat >= 0),
    ride_status     ride_status   NOT NULL DEFAULT 'scheduled',
    CONSTRAINT seats_within_total CHECK (available_seats <= total_seats)
);

-- ============================================================
-- SEAT REQUESTS / BOOKINGS
-- ============================================================
CREATE TABLE seat_requests (
    request_id            SERIAL PRIMARY KEY,
    ride_id               INT            NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE,
    rider_id              INT            NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    seats_requested       INT            NOT NULL CHECK (seats_requested > 0),
    request_status        request_status NOT NULL DEFAULT 'pending',
    request_time          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    settled_outside_app   BOOLEAN        NOT NULL DEFAULT FALSE,
    -- A rider can have only ONE active (pending/accepted) request per ride
    CONSTRAINT one_active_request_per_ride UNIQUE (ride_id, rider_id)
);

-- ============================================================
-- RATINGS AND REVIEWS
-- ============================================================
CREATE TABLE ratings_reviews (
    review_id         SERIAL PRIMARY KEY,
    ride_id           INT  NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE,
    reviewer_id       INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reviewed_user_id  INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating            INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment           TEXT,
    review_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    flagged           BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Each participant can rate the other only once per ride
    CONSTRAINT one_review_per_pair_per_ride UNIQUE (ride_id, reviewer_id, reviewed_user_id)
);

-- ============================================================
-- REPORTS / COMPLAINTS
-- ============================================================
CREATE TABLE reports_complaints (
    report_id         SERIAL PRIMARY KEY,
    reporter_id       INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reported_user_id  INT  REFERENCES users(user_id) ON DELETE SET NULL,
    reported_ride_id  INT  REFERENCES rides(ride_id) ON DELETE SET NULL,
    reason            VARCHAR(100) NOT NULL,
    description       TEXT,
    report_date       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    resolution_status resolution_status NOT NULL DEFAULT 'open',
    admin_remarks     TEXT,
    CONSTRAINT must_report_something CHECK (
        reported_user_id IS NOT NULL OR reported_ride_id IS NOT NULL
    )
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message         TEXT NOT NULL,
    type            VARCHAR(50) NOT NULL,  -- e.g. 'booking_accepted', 'booking_rejected', 'ride_cancelled'
    created_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_status     BOOLEAN     NOT NULL DEFAULT FALSE
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_rides_driver        ON rides(driver_id);
CREATE INDEX idx_rides_status        ON rides(ride_status);
CREATE INDEX idx_rides_date          ON rides(date);
CREATE INDEX idx_rides_source_dest   ON rides(source, destination);
CREATE INDEX idx_seat_requests_ride  ON seat_requests(ride_id);
CREATE INDEX idx_seat_requests_rider ON seat_requests(rider_id);
CREATE INDEX idx_ratings_ride        ON ratings_reviews(ride_id);
CREATE INDEX idx_ratings_reviewed    ON ratings_reviews(reviewed_user_id);
CREATE INDEX idx_reports_reporter    ON reports_complaints(reporter_id);
CREATE INDEX idx_notifications_user  ON notifications(user_id);
