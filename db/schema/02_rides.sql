-- 02_rides.sql
-- Ride table definition with constraints
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
