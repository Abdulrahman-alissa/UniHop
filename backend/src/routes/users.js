import { Router } from "express";
import { query } from "../db/pool.js";
import { privateUser, publicUser } from "../db/mappers.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { updateUserSchema } from "../schemas/auth.js";
import { ApiError } from "../utils.js";

const router = Router();

/** GET /api/users: public profiles (no e-mail/phone). Optional ?campus= filter. */
router.get("/", async (req, res) => {
  const { rows } = req.query.campus
    ? await query("SELECT * FROM users WHERE campus = $1 ORDER BY name", [String(req.query.campus)])
    : await query("SELECT * FROM users ORDER BY name");
  res.json(rows.map(publicUser));
});

/** GET /api/users/:id: one public profile (used by the driver page). */
router.get("/:id", async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.params.id]);
  if (!rows[0]) throw new ApiError(404, "User not found.", "NOT_FOUND");
  res.json(publicUser(rows[0]));
});

// Users can only change or delete their own account.
const ensureSelf = (req) => {
  if (req.user.id !== req.params.id) throw new ApiError(403, "You can only manage your own account.", "FORBIDDEN");
};

/** PUT /api/users/:id: update own profile (name, campus, phone, bio, car). Gender/e-mail are fixed. */
router.put("/:id", requireAuth, validateBody(updateUserSchema), async (req, res) => {
  ensureSelf(req);
  const map = { name: "name", campus: "campus", phone: "phone", bio: "bio", car: "car" };
  const sets = [], params = [];
  for (const [key, col] of Object.entries(map)) {
    if (key in req.body) {
      params.push(key === "car" && req.body.car ? JSON.stringify(req.body.car) : req.body[key]);
      sets.push(`${col} = $${params.length}`);
    }
  }
  params.push(req.user.id);
  const { rows } = await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
  res.json(privateUser(rows[0]));
});

/** DELETE /api/users/:id: delete own account (their rides, bookings and saved rides cascade). */
router.delete("/:id", requireAuth, async (req, res) => {
  ensureSelf(req);
  await query("DELETE FROM users WHERE id = $1", [req.user.id]);
  res.status(204).end();
});

export default router;
