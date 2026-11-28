// zod schemas = the single definition of what the API accepts.
import { z } from "zod";
import { config } from "./config.js";

export const CAMPUSES = ["LAU Beirut", "LAU Byblos"];
export const GENDERS = ["female", "male"];
export const RIDE_TAGS = ["Quiet ride", "Music OK", "Air-conditioned", "Luggage space", "Study-friendly", "Non-smoking"];

const text = (min, max, label) => z.string({ error: `${label} is required.` }).trim().min(min, `${label} must be at least ${min} characters.`).max(max, `${label} must be at most ${max} characters.`);

const email = z.string({ error: "Email is required." }).trim().toLowerCase().email("Enter a valid email address.").refine(
  (v) => !config.emailDomain || v.endsWith(`@${config.emailDomain}`),
  `Use your @${config.emailDomain} email address.`
);

const password = z.string({ error: "Password is required." }).min(8, "Use at least 8 characters.").max(72, "Password is too long.").regex(/[A-Za-z]/, "Password needs a letter.").regex(/[0-9]/, "Password needs a number.");

export const registerSchema = z.object({
  name: text(2, 80, "Name"),
  email,
  password,
  campus: z.enum(CAMPUSES, { error: "Choose LAU Beirut or LAU Byblos." }),
  gender: z.enum(GENDERS, { error: "Choose girl or boy." }),
});

export const loginSchema = z.object({
  email: z.string({ error: "Email is required." }).trim().toLowerCase(),
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

const carSchema = z.object({
  make: text(1, 40, "Car make"),
  model: text(1, 40, "Car model"),
  color: text(1, 30, "Car color"),
  plate: text(1, 20, "Plate"),
  languages: z.array(z.string().trim().min(1).max(30)).max(6).default([]),
  permitVerified: z.boolean().default(false),
  trips: z.number().int().min(0).default(0),
});

export const updateUserSchema = z.object({
  name: text(2, 80, "Name").optional(),
  campus: z.enum(CAMPUSES).optional(),
  phone: z.string().trim().max(25).regex(/^[0-9+\s()-]*$/, "Phone can only contain digits, spaces and + ( ) -").optional(),
  bio: z.string().trim().max(400, "Bio must be at most 400 characters.").optional(),
  car: carSchema.nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, "Send at least one field to update.");

const isoDate = (label) => z.string({ error: `${label} is required.` }).refine((v) => !Number.isNaN(Date.parse(v)), `${label} must be a valid date-time.`);

export const rideSchema = z.object({
  direction: z.enum(["toCampus", "fromCampus"], { error: "Direction must be toCampus or fromCampus." }),
  girlsOnly: z.boolean().default(false),
  originArea: text(2, 60, "Origin area"),
  originLabel: text(5, 160, "Pickup point"),
  campus: z.enum(CAMPUSES, { error: "Choose LAU Beirut or LAU Byblos." }),
  meetingPoint: text(3, 120, "Meeting point"),
  departAt: isoDate("departAt"),
  returnAt: isoDate("returnAt").nullable().optional().transform((v) => v ?? null),
  seatsTotal: z.number({ error: "seatsTotal must be a number." }).int("seatsTotal must be a whole number.").min(1, "Offer between 1 and 6 seats.").max(6, "Offer between 1 and 6 seats."),
  pricePerSeat: z.number({ error: "pricePerSeat must be a number." }).min(0, "Fare must be between $0 and $50.").max(50, "Fare must be between $0 and $50."),
  notes: z.string().trim().max(400, "Keep the note under 400 characters.").default(""),
  tags: z.array(z.enum(RIDE_TAGS)).max(6).default([]),
}).superRefine((v, ctx) => {
  if (v.returnAt && Date.parse(v.returnAt) <= Date.parse(v.departAt)) ctx.addIssue({ code: "custom", path: ["returnAt"], message: "Return must be after departure." });
});

export const rideStatusSchema = z.object({ status: z.enum(["cancelled", "completed"], { error: "status must be cancelled or completed." }) });

export const createBookingSchema = z.object({
  seats: z.number({ error: "seats must be a number." }).int().min(1, "Book at least 1 seat.").max(6),
  note: z.string().trim().max(300, "Keep the note under 300 characters.").default(""),
});

export const bookingStatusSchema = z.object({ status: z.enum(["pending", "confirmed", "declined", "cancelled"], { error: "Invalid booking status." }) });

const bool = z.enum(["true", "false"]).transform((v) => v === "true");
export const rideQuerySchema = z.object({
  campus: z.enum(CAMPUSES).optional(),
  direction: z.enum(["toCampus", "fromCampus"]).optional(),
  origin: z.string().trim().max(60).optional(),
  status: z.enum(["open", "cancelled", "completed"]).optional(),
  driverId: z.string().max(64).optional(),
  girlsOnly: bool.optional(),
  hideFull: bool.optional(),
  minSeats: z.coerce.number().int().min(0).max(6).optional(),
  maxPrice: z.coerce.number().min(0).max(50).optional(),
  departAfter: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "departAfter must be a date-time.").optional(),
  departBefore: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "departBefore must be a date-time.").optional(),
  sort: z.enum(["soonest", "cheapest", "seats"]).default("soonest"),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});
