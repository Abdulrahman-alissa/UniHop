// Demo data (same people and rides as the Phase 1 mock data). Ride times are relative to "now"
// so the demo always shows upcoming rides.
//   npm run seed           -> add demo users if missing, refresh demo rides when none are upcoming
//   npm run seed -- --reset -> wipe every table first
import bcrypt from "bcrypt";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { migrate, pool, query } from "./pool.js";
import { newId } from "../utils.js";

const DEMO_PASSWORD = "carpool123";
const minutes = (m) => new Date(Date.now() + m * 60000);
const at = (days, hhmm) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const [h, m] = hhmm.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d;
};

const USERS = [
  { key: "u1", name: "Sara Khoury", email: "test.female@lau.edu", campus: "LAU Beirut", gender: "female", rating: 4.9, phone: "+961 70 123 456", joined: "2024-09-02", bio: "Daily commuter from Jounieh. I keep the car quiet in the morning and the playlist good in the afternoon.", car: { make: "Kia", model: "Picanto", color: "Silver", plate: "B 214553", languages: ["Arabic", "English", "French"], permitVerified: true, trips: 64 } },
  { key: "u2", name: "Karim Haddad", email: "test.male@lau.edu", campus: "LAU Byblos", gender: "male", rating: 4.7, phone: "+961 71 234 567", joined: "2023-09-11", bio: "Final-year student. Always leave on time, always have water in the car.", car: { make: "Toyota", model: "Yaris", color: "White", plate: "M 489120", languages: ["Arabic", "English"], permitVerified: true, trips: 91 } },
  { key: "u3", name: "Lina Nasr", email: "test.female2@lau.edu", campus: "LAU Beirut", gender: "female", rating: 4.8, phone: "+961 76 345 678", joined: "2025-01-20", bio: "Studio hours are long, so I drive early and share the fuel.", car: { make: "Honda", model: "Civic", color: "Black", plate: "G 330871", languages: ["Arabic", "English", "French"], permitVerified: true, trips: 37 } },
  { key: "u4", name: "Omar Daher", email: "test.male2@lau.edu", campus: "LAU Byblos", gender: "male", rating: 0, phone: "+961 03 456 789", joined: "2026-09-05", bio: "", car: null },
];

const rides = () => [
  { key: "r1", driver: "u1", direction: "toCampus", girlsOnly: false, area: "Jounieh", label: "Maameltein exit, outside the petrol station", campus: "LAU Beirut", meet: "Lower gate, Koraytem", depart: minutes(50), ret: at(0, "23:30"), seats: 3, price: 4, notes: "Straight run down the highway, no stops. I wait five minutes at the pickup point.", tags: ["Quiet ride", "Air-conditioned"] },
  { key: "r2", driver: "u2", direction: "toCampus", girlsOnly: false, area: "Batroun", label: "Batroun roundabout, next to the bakery", campus: "LAU Byblos", meet: "Lower gate, Blat", depart: minutes(130), ret: null, seats: 2, price: 3, notes: "Quiet ride, I study on the way.", tags: ["Study-friendly", "Non-smoking"] },
  { key: "r3", driver: "u3", direction: "toCampus", girlsOnly: true, area: "Baabda", label: "Baabda roundabout, bus stop side", campus: "LAU Beirut", meet: "Lower gate, Koraytem", depart: at(1, "08:15"), ret: at(1, "16:45"), seats: 4, price: 3, notes: "Back at 16:45 if anyone needs a ride home.", tags: ["Music OK", "Luggage space"] },
  { key: "r4", driver: "u1", direction: "fromCampus", girlsOnly: false, area: "Tripoli", label: "Tripoli, Al Mina road, outside the pharmacy", campus: "LAU Byblos", meet: "Lower gate, Blat", depart: at(1, "07:00"), ret: at(1, "17:00"), seats: 3, price: 5, notes: "Long drive, one coffee stop if everyone agrees.", tags: ["Air-conditioned", "Non-smoking"] },
  { key: "r5", driver: "u2", direction: "toCampus", girlsOnly: false, area: "Aley", label: "Aley main square, near the municipality", campus: "LAU Beirut", meet: "Lower gate, Koraytem", depart: at(2, "06:45"), ret: null, seats: 3, price: 5, notes: "Highway route, early start for the 8:00 lectures.", tags: ["Quiet ride"] },
  { key: "r6", driver: "u3", direction: "fromCampus", girlsOnly: true, area: "Jounieh", label: "Jounieh seaside road, Kaslik side", campus: "LAU Byblos", meet: "Lower gate, Blat", depart: at(2, "09:00"), ret: at(2, "15:30"), seats: 2, price: 3, notes: "Music is fine, I take requests.", tags: ["Music OK"] },
  { key: "r7", driver: "u1", direction: "toCampus", girlsOnly: false, area: "Saida", label: "Saida sea road, outside the Sea Castle car park", campus: "LAU Beirut", meet: "Lower gate, Koraytem", depart: at(3, "06:30"), ret: null, seats: 4, price: 6, notes: "Long drive, I can stop for coffee.", tags: ["Luggage space", "Air-conditioned"] },
  { key: "r8", driver: "u2", direction: "fromCampus", girlsOnly: false, area: "Beirut", label: "Hamra, outside the AUB main gate", campus: "LAU Byblos", meet: "Lower gate, Blat", depart: at(4, "08:30"), ret: at(4, "17:30"), seats: 2, price: 4, notes: "Exam week: I can wait ten minutes.", tags: ["Study-friendly"] },
];

// [ride, passenger, seats, status, note]
const BOOKINGS = [
  ["r1", "u4", 1, "confirmed", ""],
  ["r3", "u1", 1, "pending", "I finish class at 16:30."],
  ["r2", "u4", 1, "pending", ""],
];

export async function seed({ reset = false } = {}) {
  await migrate();
  if (reset) await query("TRUNCATE saved_rides, bookings, rides, users CASCADE");

  // 1. demo users (only the ones that are missing)
  const ids = {};
  const hash = await bcrypt.hash(DEMO_PASSWORD, config.bcryptRounds);
  for (const u of USERS) {
    const existing = await query("SELECT id FROM users WHERE email = $1", [u.email]);
    if (existing.rows[0]) { ids[u.key] = existing.rows[0].id; continue; }
    ids[u.key] = newId();
    await query(
      `INSERT INTO users (id, name, email, password_hash, campus, gender, rating, verified, phone, bio, car, joined_at) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,$8,$9,$10,$11)`,
      [ids[u.key], u.name, u.email, hash, u.campus, u.gender, u.rating, u.phone, u.bio, u.car ? JSON.stringify(u.car) : null, u.joined]
    );
  }

  // 2. demo rides: (re)create them when the demo drivers have nothing upcoming, so the board is never empty
  const driverIds = Object.values(ids);
  const upcoming = await query("SELECT 1 FROM rides WHERE driver_id = ANY($1) AND status = 'open' AND depart_at > now()", [driverIds]);
  if (upcoming.rowCount) return { created: false };
  await query("DELETE FROM rides WHERE driver_id = ANY($1)", [driverIds]);
  const rideIds = {};
  for (const r of rides()) {
    rideIds[r.key] = newId();
    await query(
      `INSERT INTO rides (id, driver_id, direction, girls_only, origin_area, origin_label, campus, meeting_point, depart_at, return_at, seats_total, price_per_seat, notes, tags, posted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now() - interval '5 hours')`,
      [rideIds[r.key], ids[r.driver], r.direction, r.girlsOnly, r.area, r.label, r.campus, r.meet, r.depart, r.ret, r.seats, r.price, r.notes, r.tags]
    );
  }
  for (const [ride, passenger, seats, status, note] of BOOKINGS) {
    await query("INSERT INTO bookings (id, ride_id, passenger_id, seats, status, note) VALUES ($1,$2,$3,$4,$5,$6)", [newId(), rideIds[ride], ids[passenger], seats, status, note]);
  }
  await query("INSERT INTO saved_rides (user_id, ride_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [ids.u1, rideIds.r5]);
  return { created: true };
}

// `node src/db/seed.js` runs the seed from the command line.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed({ reset: process.argv.includes("--reset") })
    .then((r) => console.log(r.created ? "Seeded demo users, rides and bookings." : "Demo rides are still upcoming, nothing to do."))
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => pool.end());
}
