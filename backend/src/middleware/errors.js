import { config } from "../config.js";
import { ApiError } from "../utils.js";

/** Unknown route -> 404 JSON (instead of Express's HTML page). */
export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));

/**
 * Single place where every error becomes a JSON response: { error: { message, code, details? } }.
 * Known errors keep their status; database and parser errors are mapped; anything else is a 500
 * whose message is hidden in production so internals never leak.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message;

  if (err.type === "entity.parse.failed") { status = 400; code = "INVALID_JSON"; message = "Request body is not valid JSON."; }
  else if (err.type === "entity.too.large") { status = 413; code = "PAYLOAD_TOO_LARGE"; message = "Request body is too large."; }
  else if (err.code === "23505") { status = 409; code = "CONFLICT"; message = "That record already exists."; }
  else if (err.code === "23503") { status = 409; code = "CONFLICT"; message = "A related record does not exist."; }
  else if (!(err instanceof ApiError) && !err.type && typeof err.code === "string" && /^[0-9A-Z]{5}$/.test(err.code)) {
    // any other Postgres error
    status = 500; code = "DATABASE_ERROR";
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    if (config.isProd) message = "Something went wrong on our side.";
  }
  res.status(status).json({ error: { message, code, ...(err.details ? { details: err.details } : {}) } });
}
