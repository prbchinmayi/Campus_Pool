-- ============================================================
-- CampusPool — Seed Data
-- Run AFTER schema.sql
-- Passwords below are all: "Password@123"
-- ============================================================

-- USERS (password_hash is bcrypt of "Password@123")
INSERT INTO users (name, college_id, email, phone, password_hash, role) VALUES
  ('Admin User',     'ADMIN-001',   'admin@campuspool.com',   '9000000001', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
  ('Chinmayi Parab', '24B-CO-013',  'chinmayi@college.edu',   '9876543210', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'driver'),
  ('Erika Vaz',      '24B-CO-021',  'erika@college.edu',      '9876543211', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'rider'),
  ('Samidha Raul',   '24B-CO-053',  'samidha@college.edu',    '9876543212', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'rider');

-- VEHICLE (owned by Chinmayi, driver)
INSERT INTO vehicles (owner_id, vehicle_type, registration_number, model, seating_capacity) VALUES
  (2, 'Car', 'MH-04-AB-1234', 'Maruti Swift', 4);

-- RIDE (posted by Chinmayi)
INSERT INTO rides (driver_id, vehicle_id, source, destination, date, departure_time, total_seats, available_seats, cost_per_seat) VALUES
  (2, 1, 'Panvel', 'Vashi', CURRENT_DATE + INTERVAL '1 day', '08:00', 3, 3, 50.00);

-- SEAT REQUEST (Erika requests 1 seat on Chinmayi's ride)
INSERT INTO seat_requests (ride_id, rider_id, seats_requested) VALUES
  (1, 3, 1);

-- NOTIFICATION for Chinmayi
INSERT INTO notifications (user_id, message, type) VALUES
  (2, 'Erika Vaz has requested 1 seat on your ride to Vashi.', 'seat_request');
