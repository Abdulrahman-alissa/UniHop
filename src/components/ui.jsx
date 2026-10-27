import { Star } from "lucide-react";
import { cn } from "../lib/cn";

const tones = {
  forest: "bg-primary/10 text-primary", gold: "bg-accent/25 text-accent-strong", success: "bg-success/15 text-success",
  muted: "bg-secondary text-muted-foreground", outline: "border border-border text-foreground", danger: "bg-destructive/15 text-destructive",
};
export const Badge = ({ tone = "muted", className, children }) => (
  <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", tones[tone], className)}>{children}</span>
);
export const RideStatusBadge = ({ status, isFull }) =>
  status === "cancelled" ? <Badge tone="danger">Cancelled</Badge> : isFull ? <Badge tone="danger">Full</Badge> : <Badge tone="success">Seats open</Badge>;
// shows "Girls only", or whether the driver is a girl or a boy
export const GenderBadge = ({ ride }) =>
  ride.girlsOnly ? <Badge tone="gold">Girls only</Badge> : <Badge tone="outline">{ride.driver?.gender === "female" ? "Girl driver" : "Boy driver"}</Badge>;
const bookingTone = { confirmed: "success", pending: "gold", declined: "danger", cancelled: "muted" };
export const BookingStatusBadge = ({ status }) => <Badge tone={bookingTone[status]} className="capitalize">{status}</Badge>;

const tints = ["bg-[#f5b83d] text-[#1a2a10]", "bg-[#46c29f] text-[#06201a]", "bg-[#c7d9f2] text-[#10233f]", "bg-[#f3c9c0] text-[#4a1a12]"];
export function Avatar({ name = "?", size = "md" }) {
  const s = { sm: "h-9 w-9 text-xs", md: "h-11 w-11 text-sm", lg: "h-14 w-14 text-lg", xl: "h-16 w-16 text-xl" }[size];
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-extrabold", s, tints[name.length % tints.length])}>{initials}</span>;
}

export function SeatMeter({ seatsLeft, seatsTotal, showLabel = true }) {
  const booked = seatsTotal - seatsLeft;
  return (
    <div>
      <div className="flex gap-1" role="img" aria-label={`${seatsLeft} of ${seatsTotal} seats free`}>
        {Array.from({ length: seatsTotal }, (_, i) => <span key={i} className={cn("h-2 flex-1 rounded-full", i < booked ? "bg-primary" : "bg-border")} />)}
      </div>
      {showLabel && <p className="tnum mt-1.5 text-xs text-muted-foreground">{seatsLeft === 0 ? "Full" : `${seatsLeft} of ${seatsTotal} seats free`}</p>}
    </div>
  );
}

export const Stars = ({ value, count }) => (
  <span className="inline-flex items-center gap-1.5 text-sm" aria-label={value ? `${value.toFixed(1)} out of 5` : "No ratings yet"}>
    <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
    <span className="tnum font-bold">{value ? value.toFixed(1) : "New"}</span>
    {count ? <span className="text-muted-foreground">({count} trips)</span> : null}
  </span>
);

export const SectionHeading = ({ eyebrow, title, description, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div className="max-w-2xl">
      {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">{eyebrow}</p>}
      <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ title, description, action, className }) => (
  <div className={cn("rounded-2xl border border-dashed border-border bg-card p-8 text-center", className)}>
    <h3 className="font-display text-xl font-extrabold">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-muted-foreground">{description}</p>
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);
