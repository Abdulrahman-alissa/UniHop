import { randomUUID } from "node:crypto";

export const newId = () => randomUUID();

/** Error with an HTTP status; the error middleware turns it into a JSON response. */
export class ApiError extends Error {
  constructor(status, message, code = "ERROR", details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Lets async route handlers throw: Express 4 would otherwise hang on a rejected promise. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
