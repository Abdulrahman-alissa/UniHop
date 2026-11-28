# Phase 2: who does what (Callback Crew)

Deadline: **01/12/2026**. Phase 2 has three layers (database + deployment, rides API, auth + bookings API), and each layer comes with the frontend pages that use it. That keeps each person inside the pages they already built in Phase 1.

| | Abdulrahman Al Issa | Hassan Tohme | Mohammad Zaiter |
|---|---|---|---|
| **Theme** | Foundation, data and deployment | Rides API, ownership rules and Swagger | Authentication, bookings and security |
| **Phase 1 pages** | Homepage, Ride List | Ride Details, Post/Edit Ride | Dashboard, Login/Register |

## 1. Abdulrahman Al Issa: Foundation, data and deployment

**Backend**
- Project setup: `backend/package.json`, `src/config.js`, `src/server.js`, `src/app.js`
- Express middleware: JSON parsing, request logging (morgan), CORS, helmet, central error handler (`middleware/errors.js`), 404 handler
- Database: `db/schema.sql` (users, rides, bookings, saved_rides and their relationships), `db/pool.js` (connection + transactions), `db/seed.js`, `db/mappers.js`
- `GET /api/rides` (filters, sorting, pagination) and `GET /api/rides/:id` (`routes/rides.js`, `db/rides.js`)
- Saved rides: `routes/saved.js`
- **Deployment**: hosted PostgreSQL, backend on Render (`render.yaml`), frontend env var `VITE_API_URL`, CORS origin, checking that the live site talks to the live API

**Frontend**
- `src/lib/api.js` (fetch wrapper + token storage)
- `src/store.jsx` refactor: mock data replaced by API data, refresh after every change
- `src/components/ApiGate.jsx` (loading spinner, "server is waking up", retry on error)
- Pages: **Homepage** and **Ride List** now read live rides

**README sections:** Project title and team, topic and entities, local setup, deployment, links.

## 2. Hassan Tohme: Rides API, ownership rules and Swagger

**Backend**
- `POST /api/rides`, `PUT /api/rides/:id`, `PATCH /api/rides/:id/status`, `DELETE /api/rides/:id` in `routes/rides.js`
- Ownership rule (only the driver edits, cancels or deletes), girls-only rule (only girl drivers can post one; only girls see them), seat-count check on edit
- Validation schemas for rides in `schemas.js` (`rideSchema`, `rideStatusSchema`, `rideQuerySchema`)
- **Swagger**: `docs/openapi.js`, served at `/api/docs` with the Authorize (Bearer token) button
- Tests for rides: ownership, girls-only, validation (`test/api.test.js`, the "rides" and "girls-only" tests)

**Frontend**
- Pages: **Ride Details** (loads one ride, girls-only message, cancel ride, book button state) and **Post/Edit Ride** (async submit with loading state, server error messages)
- **Driver profile** page (`GET /api/users/:id`)

**README sections:** API documentation for rides and Swagger, screenshots.

## 3. Mohammad Zaiter: Authentication, bookings and security

**Backend**
- `routes/auth.js`: register, login, `GET /me`; bcrypt password hashing; JWT creation (`middleware/auth.js`: `signToken`, `requireAuth`, `optionalAuth`); login rate limiter
- `routes/users.js`: list, get, update own profile, delete own account
- `routes/bookings.js` and `POST /api/rides/:id/bookings`: seat limits, duplicate bookings, transactions and row locking so the last seat can't be double-booked, passenger/driver permissions
- Validation schemas for users and bookings in `schemas.js`
- Tests for auth, bookings and concurrency (`test/api.test.js`)

**Frontend**
- Pages: **Login/Register** (calls the API, shows server errors, loading state) and **Dashboard** (my rides, my bookings, driver requests with confirm/decline, saved rides)
- Session restore on reload (`/api/auth/me`)

**README sections:** authentication and authorization explanation, API docs for auth, users and bookings, technical challenges.

## Shared by all three
- Each person writes their own part of "Team contributions" in the README (Phase 1 and Phase 2).
- Each person works on a branch (`feature/foundation-deploy`, `feature/rides-api-swagger`, `feature/auth-bookings`), opens a pull request into `main`, and someone else reviews it. Commit regularly; graders look at the history.
- Final day: all three run through the demo flow together on the **deployed** site (register, login, post a ride, book it with a second account, confirm, cancel).

## Suggested timeline
| Dates | Goal |
|---|---|
| 18 to 21 Nov | Abdulrahman: DB + API skeleton + hosted DB. Mohammad: auth. Hassan: rides CRUD. |
| 22 to 26 Nov | Frontend integration of each person's pages. Mohammad: bookings. Hassan: Swagger. |
| 27 to 29 Nov | Deployment, bug fixing on the live site, screenshots/GIF. |
| 30 Nov | README finished, final full-team test, submit before 01/12. |

## Who to ask
Anything about the database or deployment: Abdulrahman. Anything about rides or Swagger: Hassan. Anything about login, tokens or bookings: Mohammad.
