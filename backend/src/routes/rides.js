import { Router } from "express";
import { query, withTransaction } from "../db/pool.js";
import { bookingFromRow, rideFromRow } from "../db/mappers.js";
import { RIDE_SELECT, assertOwner, canSeeRide, findRideOr404, getRide } from "../db/rides.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createBookingSchema, rideQuerySchema, rideSchema, rideStatusSchema } from "../schemas.js";
import { ApiError, newId } from "../utils.js";

const router = Router();
const LIVE = "('pending','confirmed')";



/**
 * GET /api/rides: every ride the caller may see, with driver + live seat counts.
 * Filters: campus, direction, origin, status, driverId, girlsOnly, hideFull, minSeats, maxPrice,
 * departAfter, departBefore. Sorting: soonest | cheapest | seats. Pagination: limit/offset
 * (total is returned in the X-Total-Count header).
 * Girls-only rides are left out for anyone who is not a girl account.
 */
router.get("/", optionalAuth, validateQuery(rideQuerySchema), async (req, res) => {
  const q = req.q;
  const where = [], params = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replace("?", `$${params.length}`)); };

  add("(NOT girls_only OR ?::boolean)", req.user?.gender === "female");
  if (q.campus) add("campus = ?", q.campus);
  if (q.direction) add("direction = ?", q.direction);
  if (q.origin) add("origin_area ILIKE ?", `%${q.origin.replace(/[%_\\]/g, "\\$&")}%`);
  if (q.status) add("status = ?", q.status);
  if (q.driverId) add("driver_id = ?", q.driverId);
  if (q.girlsOnly !== undefined) add("girls_only = ?", q.girlsOnly);
  if (q.hideFull) where.push("seats_total - seats_booked > 0");
  if (q.minSeats !== undefined) add("seats_total - seats_booked >= ?", q.minSeats);
  if (q.maxPrice !== undefined) add("price_per_seat <= ?", q.maxPrice);
  if (q.departAfter) add("depart_at >= ?", q.departAfter);
  if (q.departBefore) add("depart_at <= ?", q.departBefore);

  const order = { soonest: "depart_at ASC", cheapest: "price_per_seat ASC, depart_at ASC", seats: "(seats_total - seats_booked) DESC, depart_at ASC" }[q.sort];
  params.push(q.limit, q.offset);
  const { rows } = await query(
    `SELECT *, COUNT(*) OVER()::int AS total FROM (${RIDE_SELECT}) t WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.set("X-Total-Count", String(rows[0]?.total ?? 0));
  res.json(rows.map(rideFromRow));
});

/** GET /api/rides/:id: one ride. 403 GIRLS_ONLY if it is a girls-only ride and the caller is not a girl. */
router.get("/:id", optionalAuth, async (req, res) => {
  const ride = await findRideOr404({ query }, req.params.id);
  if (!canSeeRide(ride, req.user)) throw new ApiError(403, "This ride is for girls only.", "GIRLS_ONLY");
  res.json(ride);
});

/** Insert/update column list shared by POST and PUT. */
const rideColumns = (b) => [b.direction, b.girlsOnly, b.originArea, b.originLabel, b.campus, b.meetingPoint, b.departAt, b.returnAt, b.seatsTotal, b.pricePerSeat, b.notes, b.tags];

function assertSchedule(body) {
  // 60 s of slack so a ride "leaving now" is accepted.
  if (Date.parse(body.departAt) < Date.now() - 60_000) throw new ApiError(400, "Departure must be in the future.", "VALIDATION_ERROR", [{ field: "departAt", message: "Departure must be in the future." }]);
}

/** POST /api/rides (auth): the caller becomes the driver. Only girl drivers may post girls-only rides. */
router.post("/", requireAuth, validateBody(rideSchema), async (req, res) => {
  const b = req.body;
  assertSchedule(b);
  if (b.girlsOnly && req.user.gender !== "female") throw new ApiError(403, "Only girl drivers can post girls-only rides.", "FORBIDDEN");
  const id = newId();
  await query(
    `INSERT INTO rides (id, driver_id, direction, girls_only, origin_area, origin_label, campus, meeting_point, depart_at, return_at, seats_total, price_per_seat, notes, tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [id, req.user.id, ...rideColumns(b)]
  );
  res.status(201).json(await getRide({ query }, id));
});

/**
 * PUT /api/rides/:id (auth, owner only): replace the ride's details.
 * The ride row is locked while we check the seat count so a booking cannot slip in between.
 */
router.put("/:id", requireAuth, validateBody(rideSchema), async (req, res) => {
  const b = req.body;
  const updated = await withTransaction(async (db) => {
    await db.query("SELECT 1 FROM rides WHERE id = $1 FOR UPDATE", [req.params.id]);
    const ride = await findRideOr404(db, req.params.id);
    assertOwner(ride, req.user);
    if (ride.status !== "open") throw new ApiError(409, `A ${ride.status} ride can't be edited.`, "RIDE_NOT_OPEN");
    assertSchedule(b);
    if (b.girlsOnly && req.user.gender !== "female") throw new ApiError(403, "Only girl drivers can post girls-only rides.", "FORBIDDEN");
    if (b.seatsTotal < ride.seatsBooked) throw new ApiError(409, `${ride.seatsBooked} seat(s) are already booked, so you can't offer fewer.`, "SEATS_BOOKED");
    await db.query(
      `UPDATE rides SET direction=$2, girls_only=$3, origin_area=$4, origin_label=$5, campus=$6, meeting_point=$7, depart_at=$8, return_at=$9, seats_total=$10, price_per_seat=$11, notes=$12, tags=$13 WHERE id=$1`,
      [req.params.id, ...rideColumns(b)]
    );
    return getRide(db, req.params.id);
  });
  res.json(updated);
});

/**
 * PATCH /api/rides/:id/status (auth, owner only): cancel or complete an open ride.
 * Cancelling also cancels every pending/confirmed booking on it.
 */
router.patch("/:id/status", requireAuth, validateBody(rideStatusSchema), async (req, res) => {
  const updated = await withTransaction(async (db) => {
    await db.query("SELECT 1 FROM rides WHERE id = $1 FOR UPDATE", [req.params.id]);
    const ride = await findRideOr404(db, req.params.id);
    assertOwner(ride, req.user);
    if (ride.status !== "open") throw new ApiError(409, `This ride is already ${ride.status}.`, "RIDE_NOT_OPEN");
    await db.query("UPDATE rides SET status = $2 WHERE id = $1", [ride.id, req.body.status]);
    if (req.body.status === "cancelled") await db.query(`UPDATE bookings SET status = 'cancelled' WHERE ride_id = $1 AND status IN ${LIVE}`, [ride.id]);
    return getRide(db, ride.id);
  });
  res.json(updated);
});

/** DELETE /api/rides/:id (auth, owner only): permanently remove the ride and its bookings. */
router.delete("/:id", requireAuth, async (req, res) => {
  const ride = await findRideOr404({ query }, req.params.id);
  assertOwner(ride, req.user);
  await query("DELETE FROM rides WHERE id = $1", [ride.id]);
  res.status(204).end();
});

/** GET /api/rides/:id/bookings (auth, owner only): everyone who asked for a seat on this ride. */
router.get("/:id/bookings", requireAuth, async (req, res) => {
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

export default router;
