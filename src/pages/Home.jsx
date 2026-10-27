import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CarFront,
  CircleDollarSign,
  Clock,
  Leaf,
  MapPin,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { useStore } from "../store";
import { AREAS, CAMPUSES, CAMPUS_INFO } from "../data";
import {
  routeOf,
  formatDay,
  formatPrice,
  formatTime,
} from "../lib/format";

import {
  Avatar,
  Badge,
  SeatMeter,
  SectionHeading,
} from "../components/ui";

import { ButtonLink, Button } from "../components/Button";
import { CampusPicker } from "../components/Field";
import RideCard from "../components/RideCard";
import Logo from "../components/Logo";
import CampusPhoto from "../components/CampusPhoto";

const STEPS = [
  [
    Search,
    "Search the board",
    "Filter by campus, direction, pickup area, date and available seats.",
  ],
  [
    CalendarClock,
    "Request your seat",
    "Book in a tap and add a note. The driver confirms your request.",
  ],
  [
    CircleDollarSign,
    "Share the fare",
    "Fares are per seat and agreed up front. No surge pricing or platform fees.",
  ],
];

function LiveBoard() {
  const { upcoming } = useStore();
  const now = Date.now();

  const next = upcoming
    .filter((ride) => new Date(ride.departAt).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.departAt).getTime() -
        new Date(b.departAt).getTime()
    )
    .slice(0, 3);

  const seatsToday = upcoming
    .filter(
      (ride) =>
        new Date(ride.departAt).getTime() >= now &&
        formatDay(ride.departAt) === "Today" &&
        !ride.isFull
    )
    .reduce((total, ride) => total + ride.seatsLeft, 0);

  return (
    <div className="float rounded-3xl border border-white/20 bg-[#06231a]/70 p-4 text-white shadow-2xl backdrop-blur-md sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-accent">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-accent"
              aria-hidden="true"
            />
            Live board
          </p>
          <p className="font-display text-lg font-extrabold">
            Leaving next
          </p>
        </div>

        <Badge tone="gold">
          <Users className="h-3 w-3" aria-hidden="true" />
          {seatsToday} seats today
        </Badge>
      </div>

      {next.length > 0 ? (
        <ul className="divide-y divide-white/10">
          {next.map((ride) => {
            const route = routeOf(ride);

            return (
              <li key={ride.id}>
                <Link
                  to={`/rides/${ride.id}`}
                  className="flex items-center gap-3 py-3.5 hover:opacity-80"
                >
                  <Avatar name={ride.driver.name} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-bold">
                      {route.from.replace("LAU ", "")}
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-accent"
                        aria-label="to"
                      />
                      {route.to.replace("LAU ", "")}
                    </p>

                    <p className="tnum flex items-center gap-1.5 text-sm text-white/70">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDay(ride.departAt)}{" "}
                      {formatTime(ride.departAt)} ·{" "}
                      {formatPrice(ride.pricePerSeat)}
                    </p>
                  </div>

                  <div className="w-16 shrink-0">
                    <SeatMeter
                      seatsLeft={ride.seatsLeft}
                      seatsTotal={ride.seatsTotal}
                      showLabel={false}
                    />
                    <p className="tnum mt-1 text-right text-xs font-semibold text-white/70">
                      {ride.seatsLeft} left
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="py-8 text-center">
          <CarFront className="mx-auto h-8 w-8 text-accent" />
          <p className="mt-3 font-bold">No upcoming departures</p>
          <p className="mt-1 text-sm text-white/70">
            Be the first to post a ride.
          </p>
        </div>
      )}

      <ButtonLink
        to="/rides"
        variant="accent"
        fullWidth
        size="sm"
        className="mt-3"
        icon={<Search className="h-4 w-4" aria-hidden="true" />}
      >
        Browse all rides
      </ButtonLink>
    </div>
  );
}

export default function Home() {
  const { upcoming, currentUser } = useStore();
  const nav = useNavigate();

  const [direction, setDirection] = useState("to");
  const [campus, setCampus] = useState("LAU Beirut");
  const [origin, setOrigin] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const now = Date.now();

  const futureRides = upcoming
    .filter((ride) => new Date(ride.departAt).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.departAt).getTime() -
        new Date(b.departAt).getTime()
    );

  const openRides = futureRides.filter(
    (ride) => !ride.isFull && ride.seatsLeft > 0
  );

  const count = (selectedCampus) =>
    openRides.filter((ride) => ride.campus === selectedCampus).length;

  const seats = openRides.reduce(
    (total, ride) => total + ride.seatsLeft,
    0
  );

  const averageFare =
    openRides.length > 0
      ? Math.round(
          (openRides.reduce(
            (total, ride) => total + ride.pricePerSeat,
            0
          ) /
            openRides.length) *
            10
        ) / 10
      : null;

  const verifiedDrivers = new Set(
    openRides
      .filter((ride) => ride.driver.car?.permitVerified)
      .map((ride) => ride.driverId)
  ).size;

  const stats = [
    [Search, "Open rides", openRides.length, "available to book"],
    [Users, "Seats available", seats, "across upcoming rides"],
    [BadgeCheck, "Verified drivers", verifiedDrivers, "with checked permits"],
    [
      Wallet,
      "Average fare",
      averageFare === null ? "—" : formatPrice(averageFare),
      "per seat, agreed up front",
    ],
  ];

  const handleSearch = (event) => {
    event.preventDefault();

    const params = new URLSearchParams({
      campus,
      direction,
    });

    if (origin.trim()) params.set("origin", origin.trim());
    if (departureDate) params.set("date", departureDate);

    nav(`/rides?${params.toString()}`);
  };

  return (
    <div>
      {/* HERO */}
      <section
        aria-labelledby="hero"
        className="relative isolate -mx-4 -mt-5 overflow-hidden rounded-b-3xl bg-[#06231a] text-white ring-1 ring-white/10 sm:mx-0 sm:mt-0 sm:rounded-3xl"
      >
        <CampusPhoto campus="hero" className="-z-10" />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06231a]/90 via-[#06231a]/55 to-transparent lg:from-[#06231a]/80"
        />

        <div className="grid gap-8 px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-12 lg:px-12 lg:pb-20 lg:pt-10">
          <div className="min-w-0">
            <h1
              id="hero"
              className="mt-4 max-w-2xl font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Fill the <span className="text-accent">empty seats</span> on
              the way to campus.
            </h1>

            <p className="mt-4 max-w-xl text-lg text-white/85">
              One board for Beirut and Byblos. Drivers post free seats,
              passengers request them in a tap, and everyone shares the fuel.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                to="/rides"
                variant="accent"
                size="lg"
                icon={<Search className="h-5 w-5" aria-hidden="true" />}
              >
                Find a ride
              </ButtonLink>

              <ButtonLink
                to="/rides/new"
                variant="onDark"
                size="lg"
                icon={<PlusCircle className="h-5 w-5" aria-hidden="true" />}
              >
                Post a ride
              </ButtonLink>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/80">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                @lau.edu accounts
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                Permit-checked drivers
              </li>
              <li className="flex items-center gap-2">
                <CarFront className="h-4 w-4 text-accent" aria-hidden="true" />
                Driver-only ride control
              </li>
            </ul>

            {!currentUser && (
              <p className="mt-5 text-sm text-white/75">
                New here?{" "}
                <Link
                  to="/auth?mode=register"
                  className="font-bold text-accent underline underline-offset-4"
                >
                  Create your student account
                </Link>
              </p>
            )}
          </div>

          <LiveBoard />
        </div>
      </section>

      {/* SEARCH */}
      <form
        onSubmit={handleSearch}
        role="search"
        aria-label="Search rides"
        className="relative z-10 mx-auto -mt-10 grid max-w-5xl gap-4 rounded-2xl border border-border bg-card p-4 shadow-xl sm:-mt-12 sm:p-6"
      >
        <div>
          <h2 className="font-display text-xl font-extrabold">
            Find your ride
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your direction, campus, and departure details.
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Which way are you travelling?
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={direction === "to"}
              onClick={() => setDirection("to")}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition sm:px-4 ${
                direction === "to"
                  ? "border-accent bg-accent/10 text-accent-strong ring-1 ring-accent/40"
                  : "border-border hover:border-accent/50"
              }`}
            >
              Going to LAU
            </button>

            <button
              type="button"
              aria-pressed={direction === "from"}
              onClick={() => setDirection("from")}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition sm:px-4 ${
                direction === "from"
                  ? "border-accent bg-accent/10 text-accent-strong ring-1 ring-accent/40"
                  : "border-border hover:border-accent/50"
              }`}
            >
              Leaving LAU
            </button>
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">
              {direction === "to" ? "Destination campus" : "Departure campus"}
            </label>
            <CampusPicker
              options={CAMPUSES}
              value={campus}
              onChange={setCampus}
              label={direction === "to" ? "Destination campus" : "Departure campus"}
            />
          </div>

          <div>
            <label
              htmlFor="home-from"
              className="mb-1.5 block text-sm font-semibold"
            >
              {direction === "to" ? "Leaving from" : "Going to"}
            </label>

            <input
              id="home-from"
              list="home-areas"
              placeholder="Jounieh, Aley, Batroun…"
              autoComplete="off"
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-card px-3.5 text-base focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />

            <datalist id="home-areas">
              {AREAS.map((area) => (
                <option key={area} value={area} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor="departure-date"
              className="mb-1.5 block text-sm font-semibold"
            >
              Departure date
            </label>

            <input
              id="departure-date"
              type="date"
              min={new Date().toLocaleDateString("en-CA")}
              value={departureDate}
              onChange={(event) => setDepartureDate(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-border bg-card px-3.5 text-base focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
          </div>

          <Button
            type="submit"
            className="min-h-11"
            icon={<Search className="h-4 w-4" aria-hidden="true" />}
          >
            Search
          </Button>
        </div>
      </form>

      {/* STATISTICS */}
      <section aria-label="Board statistics" className="mt-10">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(([Icon, label, value, hint]) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/20 text-accent-strong">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <dt className="mt-3 text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">
                {label}
              </dt>
              <dd className="tnum font-display text-3xl font-extrabold leading-tight">
                {value}
              </dd>
              <p className="text-sm text-muted-foreground">{hint}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* UPCOMING RIDES */}
      <section aria-labelledby="soon" className="mt-12">
        <SectionHeading
          eyebrow="Next departures"
          title="Rides leaving soon"
          description="Seats update as students book."
          action={
            <ButtonLink
              to="/rides"
              variant="subtle"
              size="sm"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              See all {openRides.length} rides
            </ButtonLink>
          }
        />

        <h2 id="soon" className="sr-only">
          Rides leaving soon
        </h2>

        {futureRides.length > 0 ? (
          <div className="no-scrollbar -mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
            {futureRides.slice(0, 6).map((ride) => (
              <RideCard
                key={ride.id}
                rideId={ride.id}
                variant="rail"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-border bg-card p-8 text-center">
            <CarFront className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-bold">No upcoming rides</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to post a ride.
            </p>
          </div>
        )}
      </section>

      {/* CAMPUS CARDS */}
      <section aria-labelledby="campus" className="mt-12">
        <SectionHeading
          eyebrow="Two campuses, one board"
          title="Built around the LAU commute"
          description="Pick your campus and see rides that end there."
        />

        <h2 id="campus" className="sr-only">
          Campuses
        </h2>

        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAMPUSES.map((selectedCampus) => (
            <li key={selectedCampus}>
              <Link
                to={`/rides?campus=${encodeURIComponent(selectedCampus)}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
              >
                <span className="relative block h-44 overflow-hidden">
                  <CampusPhoto
                    campus={selectedCampus}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#07281f]/85 via-[#07281f]/10 to-transparent"
                  />
                  <span className="absolute bottom-3 left-4 flex items-center gap-2 font-display text-xl font-extrabold text-white">
                    <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
                    {selectedCampus}
                  </span>
                </span>

                <span className="flex flex-1 flex-col p-4">
                  <span className="text-muted-foreground">
                    {CAMPUS_INFO[selectedCampus].blurb}
                  </span>
                  <span className="mt-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-accent-strong">
                    {count(selectedCampus)} open rides
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          ))}

          <li className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0b4a38] to-[#06231a] p-5 text-white ring-1 ring-white/10">
            <div>
              <Badge tone="gold">Drivers</Badge>
              <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight">
                Driving in anyway?
              </h3>
              <p className="mt-2 text-white/80">
                Post your route once. Only you can edit or cancel it.
              </p>
            </div>
            <ButtonLink
              to="/rides/new"
              variant="accent"
              fullWidth
              className="mt-5"
              icon={<PlusCircle className="h-4 w-4" aria-hidden="true" />}
            >
              Post a ride
            </ButtonLink>
          </li>
        </ul>
      </section>

      {/* HOW IT WORKS */}
      <section
        aria-labelledby="how"
        className="mt-12 rounded-2xl border border-border bg-card p-5 sm:p-8"
      >
        <SectionHeading
          eyebrow="How it works"
          title="Three steps from doorstep to campus"
        />

        <h2 id="how" className="sr-only">
          How it works
        </h2>

        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {STEPS.map(([Icon, title, description], index) => (
            <li key={title} className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-strong">
                Step {index + 1}
              </p>
              <h3 className="font-display text-lg font-extrabold">
                {title}
              </h3>
              <p className="mt-1 text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}