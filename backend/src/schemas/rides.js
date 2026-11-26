// Request schemas for posting and managing rides.
import { z } from "zod";
import { CAMPUSES, RIDE_TAGS, text } from "./common.js";

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
