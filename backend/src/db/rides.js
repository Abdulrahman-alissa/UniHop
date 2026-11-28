// Shared SQL for reading rides: every ride comes with its driver and live seat counts.
import { ApiError } from "../utils.js";
import { rideFromRow } from "./mappers.js";

export const RIDE_SELECT = `
  SELECT r.*,
         COALESCE((SELECT SUM(b.seats) FROM bookings b WHERE b.ride_id = r.id AND b.status IN ('pending','confirmed')), 0)::int AS seats_booked,
         u.name AS d_name, u.campus AS d_campus, u.gender AS d_gender, u.rating AS d_rating,
         u.verified AS d_verified, u.bio AS d_bio, u.car AS d_car, u.joined_at AS d_joined_at
  FROM rides r JOIN users u ON u.id = r.driver_id`;

/** Girls-only rides are visible to girls only. */
export const canSeeRide = (ride, viewer) => !ride.girlsOnly || viewer?.gender === "female";

export async function getRide(db, id) {
  const { rows } = await db.query(`${RIDE_SELECT} WHERE r.id = $1`, [id]);
  return rows[0] ? rideFromRow(rows[0]) : null;
}

export async function getRidesByIds(db, ids) {
  if (!ids.length) return new Map();
  const { rows } = await db.query(`${RIDE_SELECT} WHERE r.id = ANY($1::text[])`, [ids]);
  return new Map(rows.map((r) => [r.id, rideFromRow(r)]));
}

/** Load a ride or throw 404. */
export async function findRideOr404(db, id) {
  const ride = await getRide(db, id);
  if (!ride) throw new ApiError(404, "Ride not found.", "NOT_FOUND");
  return ride;
}

/** Only the driver who posted the ride may change it. */
export function assertOwner(ride, user) {
  if (ride.driverId !== user.id) {
    throw new ApiError(403, "Only the driver can change this ride.", "FORBIDDEN");
  }
}
