# 🚗 CampusPool

**DBMS Mini Project** | Chinmayi Parab | Roll No: 24B-CO-013

CampusPool is a college carpooling platform that connects students and faculty for shared rides, reducing travel costs and promoting sustainability on campus.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)

---

## ✨ Features

- **User Registration & Login** with JWT authentication
- **Role-based access** (Admin / Driver / Rider)
- **Ride Management** – create, search, update, cancel rides
- **Seat Booking** – transactional seat reservation with race-condition protection (`SELECT FOR UPDATE`)
- **Ratings & Reviews** – post-ride feedback system
- **Reports & Complaints** – flag users or rides to admin
- **Notifications** – in-app notification system
- **Admin Dashboard** – analytics, user management, moderation

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Runtime     | Node.js 18+                         |
| Framework   | Express.js                          |
| Database    | PostgreSQL 14+                      |
| Auth        | JSON Web Tokens (JWT) + bcryptjs    |
| Config      | dotenv                              |
| CORS        | cors                                |

---

## 📁 Project Structure

```
Campus_Pool/
├── README.md
├── .gitignore
└── backend/
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── db/
    │   ├── index.js          # PostgreSQL pool
    │   ├── schema.sql        # Full DB schema
    │   └── seed.sql          # Sample data
    ├── middleware/
    │   ├── auth.js           # JWT middleware + role guard
    │   └── errorHandler.js   # Global error handler
    ├── routes/
    │   ├── auth.js
    │   ├── rides.js
    │   ├── bookings.js
    │   ├── ratings.js
    │   ├── reports.js
    │   ├── notifications.js
    │   └── admin.js
    └── controllers/
        ├── authController.js
        ├── rideController.js
        ├── bookingController.js
        ├── ratingController.js
        ├── reportController.js
        ├── notificationController.js
        └── adminController.js
```

---

## 🔧 Prerequisites

- **Node.js** v18 or higher – https://nodejs.org
- **PostgreSQL** v14 or higher – https://www.postgresql.org
- **npm** (comes with Node.js)

---

## 🚀 Setup Instructions

### 1. Clone / Download the project

```bash
git clone <repo-url>
cd Campus_Pool
```

### 2. Create the PostgreSQL database

Open `psql` or pgAdmin and run:

```sql
CREATE DATABASE campuspool;
```

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your actual values:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campuspool
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
JWT_SECRET=a_long_random_secret_string
PORT=5000
```

### 4. Apply the schema

```bash
psql -U your_postgres_user -d campuspool -f db/schema.sql
```

### 5. (Optional) Load sample data

```bash
psql -U your_postgres_user -d campuspool -f db/seed.sql
```

### 6. Install dependencies

```bash
npm install
```

### 7. Start the server

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

## 📡 API Reference

### Auth

| Method | Endpoint              | Description          | Auth |
|--------|-----------------------|----------------------|------|
| POST   | `/api/auth/register`  | Register a new user  | No   |
| POST   | `/api/auth/login`     | Login and get JWT    | No   |

### Rides

| Method | Endpoint                   | Description              | Auth   |
|--------|----------------------------|--------------------------|--------|
| GET    | `/api/rides`               | Search/list rides        | Yes    |
| POST   | `/api/rides`               | Create a ride            | Driver |
| PUT    | `/api/rides/:id`           | Update ride details      | Driver |
| DELETE | `/api/rides/:id`           | Delete a ride            | Driver |
| PATCH  | `/api/rides/:id/status`    | Update ride status       | Driver |

### Bookings

| Method | Endpoint                     | Description                  | Auth   |
|--------|------------------------------|------------------------------|--------|
| POST   | `/api/bookings`              | Request a seat               | Rider  |
| GET    | `/api/bookings/mine`         | List my seat requests        | Yes    |
| PATCH  | `/api/bookings/:id/respond`  | Accept / Reject a request    | Driver |

### Ratings

| Method | Endpoint                    | Description             | Auth |
|--------|-----------------------------|-------------------------|------|
| POST   | `/api/ratings`              | Submit a rating         | Yes  |
| GET    | `/api/ratings/user/:userId` | Get ratings for a user  | Yes  |

### Reports

| Method | Endpoint                   | Description          | Auth  |
|--------|----------------------------|----------------------|-------|
| POST   | `/api/reports`             | Submit a report      | Yes   |
| GET    | `/api/reports`             | List all reports     | Admin |
| PATCH  | `/api/reports/:id/resolve` | Resolve a report     | Admin |

### Notifications

| Method | Endpoint                      | Description             | Auth |
|--------|-------------------------------|-------------------------|------|
| GET    | `/api/notifications/mine`     | List my notifications   | Yes  |
| PATCH  | `/api/notifications/:id/read` | Mark as read            | Yes  |

### Admin

| Method | Endpoint                        | Description            | Auth  |
|--------|---------------------------------|------------------------|-------|
| GET    | `/api/admin/analytics`          | Platform analytics     | Admin |
| GET    | `/api/admin/users`              | List all users         | Admin |
| PATCH  | `/api/admin/users/:id/suspend`  | Suspend / activate     | Admin |
| GET    | `/api/admin/reports`            | All reports            | Admin |
| GET    | `/api/admin/reviews`            | All reviews            | Admin |
| DELETE | `/api/admin/reviews/:id`        | Delete a review        | Admin |

---

## 🗄 Database Schema

See [`backend/db/schema.sql`](backend/db/schema.sql) for the full schema including:

- `users` – students/faculty accounts
- `vehicles` – driver vehicle registrations
- `rides` – carpooling trips
- `seat_requests` – booking requests
- `ratings_reviews` – post-ride reviews
- `reports_complaints` – moderation reports
- `notifications` – in-app notifications

---

## 👩‍💻 Author

**Chinmayi Parab**  
Roll No: 24B-CO-013  
DBMS Mini Project – 2024
