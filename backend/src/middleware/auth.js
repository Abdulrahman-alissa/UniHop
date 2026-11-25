import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { query } from "../db/pool.js";
import { ApiError } from "../utils.js";

/** Create a signed JWT for a user id. The token only carries the id; everything else is read from the DB. */
export const signToken = (userId) => jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

async function userFromRequest(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    throw new ApiError(401, err.name === "TokenExpiredError" ? "Your session has expired. Please sign in again." : "Invalid token.", "INVALID_TOKEN");
  }
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [payload.sub]);
  if (!rows[0]) throw new ApiError(401, "This account no longer exists.", "INVALID_TOKEN");
  return rows[0];
}

/** Protected routes: a valid JWT is mandatory. Puts the user row on req.user. */
export async function requireAuth(req, _res, next) {
  const user = await userFromRequest(req);
  if (!user) throw new ApiError(401, "Sign in to continue.", "AUTH_REQUIRED");
  req.user = user;
  next();
}

/** Public routes that behave differently for signed-in users (e.g. girls-only rides). A bad token is still rejected. */
export async function optionalAuth(req, _res, next) {
  req.user = (await userFromRequest(req)) || null;
  next();
}
