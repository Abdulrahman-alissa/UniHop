import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Clock } from "lucide-react";

import { useStore } from "../store";
import {
  formatDay,
  formatTime,
  formatPrice,
  routeOf,
} from "../lib/format";

import {
  Avatar,
  Badge,
  GenderBadge,
  RideStatusBadge,
  SeatMeter,
  Stars,
} from "./ui";

import { cn } from "../lib/cn";

export default function RideCard({ rideId, variant, className }) {
  const { getRideView, savedRideIds, toggleSaved, toast } = useStore();

  const ride = getRideView(rideId);

  if (!ride) return null;

  const saved = savedRideIds.includes(ride.id);
  const route = routeOf(ride);
  const tags = ride.tags ?? [];

  const handleSave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    toggleSaved(ride.id);

    toast(
      "info",
      saved ? "Removed from saved rides" : "Saved for later"
    );
  };

  return (
    <article
      className={cn(
        "relative flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
        variant === "rail" &&
          "w-[84%] shrink-0 snap-start sm:w-[340px]",
        className
      )}
    >
      {/* Ride information */}
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Badge tone="forest">{ride.campus}</Badge>
          <RideStatusBadge status={ride.status} isFull={ride.isFull} />
          <GenderBadge ride={ride} />
        </div>

        <button
          type="button"
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={
            saved ? "Remove from saved rides" : "Save ride"
          }
          title={saved ? "Remove saved ride" : "Save ride"}
          className="relative z-20 grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Bookmark
            className={cn(
              "h-5 w-5",
              saved && "fill-current text-accent-strong"
            )}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Route */}
      <h3 className="mt-2 font-display text-lg font-extrabold leading-snug">
        <Link
          to={`/rides/${ride.id}`}
          className="relative z-10 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-sm hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="break-words">{route.from}</span>

          <ArrowRight
            className="h-4 w-4 shrink-0 text-accent-strong"
            aria-hidden="true"
          />

          <span className="break-words">{route.to}</span>
        </Link>
      </h3>

      {/* Departure time */}
      <p className="tnum mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{formatDay(ride.departAt)}</span>
        <span aria-hidden="true">·</span>
        <strong className="text-foreground">
          {formatTime(ride.departAt)}
        </strong>
      </p>

      {/* Ride tags */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      {/* Driver and fare */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={ride.driver.name} size="sm" />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {ride.driver.name}
            </p>
            <Stars value={ride.driver.rating} />
          </div>
        </div>

        <div className="tnum shrink-0 text-right font-display text-xl font-extrabold">
          {formatPrice(ride.pricePerSeat)}
          <span className="block text-xs font-medium text-muted-foreground">
            per seat
          </span>
        </div>
      </div>

      {/* Available seats */}
      <div className="mt-3">
        <SeatMeter
          seatsLeft={ride.seatsLeft}
          seatsTotal={ride.seatsTotal}
        />
      </div>
    </article>
  );
}