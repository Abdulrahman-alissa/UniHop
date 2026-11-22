import { Router } from "express";
import { query } from "../db/pool.js";
import { canSeeRide, getRide } from "../db/rides.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../utils.js";

const router = Router();
router.use(requireAuth);

/** GET /api/saved (auth): ids of the rides I bookmarked. */
router.get("/", async (req, res) => {
  const { rows } = await query("SELECT ride_id FROM saved_rides WHERE user_id = $1", [req.user.id]);
  res.json(rows.map((r) => r.ride_id));
});

/** PUT /api/saved/:rideId (auth): bookmark a ride. Idempotent. */
router.put("/:rideId", async (req, res) => {
  const ride = await getRide({ query }, req.params.rideId);
  if (!ride || !canSeeRide(ride, req.user)) throw new ApiError(404, "Ride not found.", "NOT_FOUND");
  await query("INSERT INTO saved_rides (user_id, ride_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [req.user.id, ride.id]);
  res.status(204).end();
});

/** DELETE /api/saved/:rideId (auth): remove a bookmark. Idempotent. */
router.delete("/:rideId", async (req, res) => {
  await query("DELETE FROM saved_rides WHERE user_id = $1 AND ride_id = $2", [req.user.id, req.params.rideId]);
  res.status(204).end();
});

export default router;
