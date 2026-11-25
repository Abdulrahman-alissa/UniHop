import { Router } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { query } from "../db/pool.js";
import { privateUser } from "../db/mappers.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.js";
import { ApiError, newId } from "../utils.js";

const router = Router();

// Slows down password guessing. Disabled in tests.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: (_req, _res, next) => next(new ApiError(429, "Too many attempts. Try again in a few minutes.", "RATE_LIMITED")),
});

// A real bcrypt hash of a random string. Compared against when the e-mail is unknown so
// "wrong e-mail" and "wrong password" take the same time and give the same answer.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", config.bcryptRounds);

/** POST /api/auth/register: create an account, hash the password with bcrypt, return a JWT. */
router.post("/register", authLimiter, validateBody(registerSchema), async (req, res) => {
  const { name, email, password, campus, gender } = req.body;
  const exists = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (exists.rowCount) throw new ApiError(409, "An account with this email already exists.", "EMAIL_TAKEN");
  const hash = await bcrypt.hash(password, config.bcryptRounds);
  const { rows } = await query(
    `INSERT INTO users (id, name, email, password_hash, campus, gender) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [newId(), name, email, hash, campus, gender]
  );
  res.status(201).json({ token: signToken(rows[0].id), user: privateUser(rows[0]) });
});

/** POST /api/auth/login: check the password against the stored hash, return a JWT. */
router.post("/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw new ApiError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  res.json({ token: signToken(user.id), user: privateUser(user) });
});

/** GET /api/auth/me: the signed-in user (used by the frontend to restore a session on reload). */
router.get("/me", requireAuth, (req, res) => res.json(privateUser(req.user)));

export default router;
