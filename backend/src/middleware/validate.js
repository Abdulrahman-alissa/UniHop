import { ApiError } from "../utils.js";

/** Validate req.body against a zod schema; on success req.body is replaced by the parsed (trimmed/coerced) data. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) throw zodToApiError(result.error);
  req.body = result.data;
  next();
};

/** Parse query-string params. Express 5 makes req.query read-only, so the result goes to req.q. */
export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) throw zodToApiError(result.error);
  req.q = result.data;
  next();
};

export function zodToApiError(error) {
  const details = error.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
  return new ApiError(400, details[0] ? `${details[0].field ? details[0].field + ": " : ""}${details[0].message}` : "Invalid request.", "VALIDATION_ERROR", details);
}
