// Request schemas for accounts and bookings.
import { z } from "zod";
import { config } from "../config.js";
import { CAMPUSES, GENDERS, text } from "./common.js";

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

export const createBookingSchema = z.object({
  seats: z.number({ error: "seats must be a number." }).int().min(1, "Book at least 1 seat.").max(6),
  note: z.string().trim().max(300, "Keep the note under 300 characters.").default(""),
});

export const bookingStatusSchema = z.object({ status: z.enum(["pending", "confirmed", "declined", "cancelled"], { error: "Invalid booking status." }) });
