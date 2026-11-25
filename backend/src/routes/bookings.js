import { Router } from "express";
import { query, withTransaction } from "../db/pool.js";
import { bookingFromRow } from "../db/mappers.js";
import { passengerView } from "../db/mappers.js";
import { assertOwner, canSeeRide, findRideOr404, getRidesByIds } from "../db/rides.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { bookingStatusSchema, createBookingSchema } from "../schemas/auth.js";
import { ApiError, newId } from "../utils.js";

const router = Router();
const isLive = (s) => s === "pending" || s === "confirmed";

/**
 * GET /api/bookings/mine (auth): everything the dashboard needs in one call.
 *  - asPassenger: seats I asked for on other people's rides (with the ride + driver embedded)
 *  - asDriver:    requests on rides I posted (with the passenger, incl. phone, and the ride embedded)
 */
router.get("/mine", requireAuth, async (req, res) => {
  const mine = await query("SELECT * FROM bookings WHERE passenger_id = $1 ORDER BY created_at DESC", [req.user.id]);
  const incoming = await query(
    `SELECT b.*, p.name AS p_name, p.campus AS p_campus, p.gender AS p_gender, p.rating AS p_rating, p.verified AS p_verified, p.bio AS p_bio, p.car AS p_car, p.joined_at AS p_joined_at, p.phone AS p_phone
     FROM bookings b JOIN rides r ON r.id = b.ride_id JOIN users p ON p.id = b.passenger_id
     WHERE r.driver_id = $1 ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  const rides = await getRidesByIds({ query }, [...new Set([...mine.rows, ...incoming.rows].map((b) => b.ride_id))]);
  res.json({
    asPassenger: mine.rows.map((b) => ({ ...bookingFromRow(b), ride: rides.get(b.ride_id) })),
    asDriver: incoming.rows.map((b) => ({
      ...bookingFromRow(b),
      ride: rides.get(b.ride_id),
      passenger: passengerView({ id: b.passenger_id, name: b.p_name, campus: b.p_campus, gender: b.p_gender, rating: b.p_rating, verified: b.p_verified, bio: b.p_bio, car: b.p_car, joined_at: b.p_joined_at, phone: b.p_phone }),
    })),
  });
});

/**
 * PATCH /api/bookings/:id/status (auth). Who may do what:
 *  - the passenger can cancel their own pending/confirmed booking
 *  - the ride's driver can confirm, decline or reset to pending (never a cancelled booking)
 * Anyone else gets 404, so booking ids can't be probed.
 * Bringing a declined booking back to life re-checks that the seats are still free.
 */
router.patch("/:id/status", requireAuth, validateBody(bookingStatusSchema), async (req, res) => {
  const next = req.body.status;
  const updated = await withTransaction(async (db) => {
    const found = await db.query("SELECT ride_id FROM bookings WHERE id = $1", [req.params.id]);
    if (!found.rows[0]) throw new ApiError(404, "Booking not found.", "NOT_FOUND");
    // Lock the ride first (same order as every other writer) to avoid deadlocks and double-booking.
    const rideRow = (await db.query("SELECT * FROM rides WHERE id = $1 FOR UPDATE", [found.rows[0].ride_id])).rows[0];
    const booking = (await db.query("SELECT * FROM bookings WHERE id = $1 FOR UPDATE", [req.params.id])).rows[0];
    const isDriver = rideRow.driver_id === req.user.id;
    const isPassenger = booking.passenger_id === req.user.id;
    if (!isDriver && !isPassenger) throw new ApiError(404, "Booking not found.", "NOT_FOUND");

    if (booking.status === "cancelled") throw new ApiError(409, "This booking was cancelled.", "BOOKING_CANCELLED");
    if (booking.status === next) return booking;

    if (isDriver) {
      if (next === "cancelled") throw new ApiError(403, "Drivers can confirm or decline requests. Cancel the ride instead.", "FORBIDDEN");
    } else if (next !== "cancelled") {
      throw new ApiError(403, "Only the driver can confirm or decline a request.", "FORBIDDEN");
    }

    if (isLive(next) && !isLive(booking.status)) {
      if (rideRow.status !== "open") throw new ApiError(409, "This ride is no longer open.", "RIDE_NOT_OPEN");
      const { rows } = await db.query(`SELECT COALESCE(SUM(seats),0)::int AS taken FROM bookings WHERE ride_id = $1 AND status IN ('pending','confirmed')`, [rideRow.id]);
      if (rows[0].taken + booking.seats > rideRow.seats_total) throw new ApiError(409, "Not enough seats left to restore this request.", "NOT_ENOUGH_SEATS");
    }
    return (await db.query("UPDATE bookings SET status = $2 WHERE id = $1 RETURNING *", [booking.id, next])).rows[0];
  });
  res.json(bookingFromRow(updated));
});

// ---------------------------------------------------------------------------
// Ride-scoped booking endpoints. Mounted on /api/rides (see app.js).
// ---------------------------------------------------------------------------
export const rideBookingsRouter = Router();
const LIVE = "('pending','confirmed')";

/** GET /api/rides/:id/bookings (auth, owner only): everyone who asked for a seat on this ride. */
rideBookingsRouter.get("/:id/bookings", requireAuth, async (req, res) => {
  const ride = await findRideOr404({ query }, req.params.id);
  assertOwner(ride, req.user);
  const { rows } = await query(
    `SELECT b.*, p.name AS p_name, p.campus AS p_campus, p.gender AS p_gender, p.rating AS p_rating, p.verified AS p_verified, p.bio AS p_bio, p.car AS p_car, p.joined_at AS p_joined_at, p.phone AS p_phone
     FROM bookings b JOIN users p ON p.id = b.passenger_id WHERE b.ride_id = $1 ORDER BY b.created_at`,
    [ride.id]
  );
  res.json(rows.map((r) => ({
    ...bookingFromRow(r),
    passenger: { id: r.passenger_id, name: r.p_name, campus: r.p_campus, gender: r.p_gender, rating: r.p_rating, verified: r.p_verified, bio: r.p_bio, car: r.p_car, joinedAt: r.p_joined_at, phone: r.p_phone },
  })));
});

/**
 * POST /api/rides/:id/bookings (auth): request seats on a ride.
 * Runs in a transaction with the ride row locked, so two people can never take the last seat at once.
 */
router.post("/:id/bookings", requireAuth, validateBody(createBookingSchema), async (req, res) => {
  const { seats, note } = req.body;
  const booking = await withTransaction(async (db) => {
    await db.query("SELECT 1 FROM rides WHERE id = $1 FOR UPDATE", [req.params.id]);
    const ride = await findRideOr404(db, req.params.id);
    if (!canSeeRide(ride, req.user)) throw new ApiError(403, "This ride is for girls only.", "GIRLS_ONLY");
    if (ride.status !== "open") throw new ApiError(409, "This ride is no longer open.", "RIDE_NOT_OPEN");
    if (ride.driverId === req.user.id) throw new ApiError(409, "You can't book your own ride.", "OWN_RIDE");
    if (Date.parse(ride.departAt) < Date.now() - 3_600_000) throw new ApiError(409, "This ride has already left.", "RIDE_PAST");
    if (seats > ride.seatsLeft) throw new ApiError(409, ride.seatsLeft === 0 ? "This ride is full." : `Only ${ride.seatsLeft} seat(s) left.`, "NOT_ENOUGH_SEATS");
    const dup = await db.query(`SELECT 1 FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ${LIVE}`, [ride.id, req.user.id]);
    if (dup.rowCount) throw new ApiError(409, "You already booked this ride.", "ALREADY_BOOKED");
    const { rows } = await db.query(
      "INSERT INTO bookings (id, ride_id, passenger_id, seats, note) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [newId(), ride.id, req.user.id, seats, note]
    );
    return rows[0];
  });
  res.status(201).json(bookingFromRow(booking));
});

/**
 * POST /api/rides/:id/bookings (auth): request seats on a ride.
 * Runs in a transaction with the ride row locked, so two people can never take the last seat at once.
 */
rideBookingsRouter.post("/:id/bookings", requireAuth, validateBody(createBookingSchema), async (req, res) => {
  const { seats, note } = req.body;
  const booking = await withTransaction(async (db) => {
    await db.query("SELECT 1 FROM rides WHERE id = $1 FOR UPDATE", [req.params.id]);
    const ride = await findRideOr404(db, req.params.id);
    if (!canSeeRide(ride, req.user)) throw new ApiError(403, "This ride is for girls only.", "GIRLS_ONLY");
    if (ride.status !== "open") throw new ApiError(409, "This ride is no longer open.", "RIDE_NOT_OPEN");
    if (ride.driverId === req.user.id) throw new ApiError(409, "You can't book your own ride.", "OWN_RIDE");
    if (Date.parse(ride.departAt) < Date.now() - 3_600_000) throw new ApiError(409, "This ride has already left.", "RIDE_PAST");
    if (seats > ride.seatsLeft) throw new ApiError(409, ride.seatsLeft === 0 ? "This ride is full." : `Only ${ride.seatsLeft} seat(s) left.`, "NOT_ENOUGH_SEATS");
    const dup = await db.query(`SELECT 1 FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status IN ${LIVE}`, [ride.id, req.user.id]);
    if (dup.rowCount) throw new ApiError(409, "You already booked this ride.", "ALREADY_BOOKED");
    const { rows } = await db.query(
      "INSERT INTO bookings (id, ride_id, passenger_id, seats, note) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [newId(), ride.id, req.user.id, seats, note]
    );
    return rows[0];
  });
  res.status(201).json(bookingFromRow(booking));
});

export default router;
