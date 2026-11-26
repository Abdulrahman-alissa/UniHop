import { Router } from "express";
import { query, withTransaction } from "../db/pool.js";
import { assertOwner, findRideOr404, getRide } from "../db/rides.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { rideSchema, rideStatusSchema } from "../schemas/rides.js";
import { ApiError, newId } from "../utils.js";

// Write endpoints for rides (create, edit, cancel/complete, delete). Mounted on /api/rides.
// Only the driver who posted a ride may change it.
const router = Router();
const LIVE = "('pending','confirmed')";

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

export default router;
