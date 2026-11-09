import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bookmark, CalendarCheck, Car, CheckCircle2, Clock, MapPin, Pencil, PlusCircle, Star, Trash2, Users, XCircle } from "lucide-react";
import { useStore } from "../store";
import { formatDayTime, formatPrice, routeOf } from "../lib/format";
import { Avatar, Badge, BookingStatusBadge, EmptyState, RideStatusBadge, SeatMeter, SectionHeading } from "../components/ui";
import { Button, ButtonLink } from "../components/Button";
import { ConfirmDialog } from "../components/Overlay";
import RideCard from "../components/RideCard";
import { cn } from "../lib/cn";

const TABS = [["posted", "Rides I posted", Car], ["booked", "My bookings", CalendarCheck], ["requests", "Requests", Users], ["saved", "Saved", Bookmark]];

export default function Dashboard() {
  const { currentUser, ridesByDriver, bookingsByPassenger, bookingsForDriver, ridesWithDrivers, savedRideIds, cancelBooking, respondToBooking, setRideStatus, toast } = useStore();
  const [tab, setTab] = useState("posted");
  const [target, setTarget] = useState(null);

  if (!currentUser) return <Navigate to="/auth?next=%2Fdashboard" replace />;

  const posted = ridesByDriver(currentUser.id);
  const booked = bookingsByPassenger(currentUser.id).filter((b) => b.status !== "cancelled");
  const incoming = bookingsForDriver(currentUser.id).filter((b) => b.status !== "cancelled");
  const saved = ridesWithDrivers.filter((r) => savedRideIds.includes(r.id));
  const pending = incoming.filter((b) => b.status === "pending").length;
  const counts = { posted: posted.length, booked: booked.length, requests: incoming.length, saved: saved.length };
  const stats = [["Rides posted", posted.length, currentUser.campus], ["Seats booked", booked.length, "as a passenger"], ["Open requests", pending, "waiting for you"], ["Driver rating", currentUser.rating ? currentUser.rating.toFixed(1) : "New", "out of 5.0"]];

  return (
    <div>
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 bg-hero p-5 text-white sm:flex-row sm:items-center sm:p-7">
          <Avatar name={currentUser.name} size="xl" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">My dashboard</p>
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{currentUser.name}</h1>
            <p className="text-white/80">{currentUser.gender === "female" ? "Girl" : "Boy"} · {currentUser.campus}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 text-sm text-white/70"><span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" aria-hidden />{currentUser.rating ? `${currentUser.rating.toFixed(1)} rating` : "No ratings yet"}</span><span className="truncate">{currentUser.email}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col">
            <ButtonLink to="/rides/new" variant="accent" icon={<PlusCircle className="h-4 w-4" aria-hidden />}>Post a ride</ButtonLink>
            <ButtonLink to="/rides" variant="onDark">Find a ride</ButtonLink>
          </div>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map(([l, v, h], i) => (
            <div key={l} className={cn("border-border p-4 sm:p-5", i < 2 && "border-b lg:border-b-0", i % 2 === 0 && "border-r", i === 1 && "lg:border-r")}>
              <dt className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">{l}</dt>
              <dd className="tnum mt-1.5 font-display text-3xl font-extrabold leading-none">{v}</dd>
              <p className="mt-1 text-sm text-muted-foreground">{h}</p>
            </div>
          ))}
        </dl>
      </header>

      <div role="tablist" aria-label="Dashboard sections" className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {TABS.map(([key, label, Icon]) => (
          <button key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} onClick={() => setTab(key)}
            className={cn("inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-bold", tab === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50")}>
            <Icon className="h-4 w-4" aria-hidden />{label}
            <span className={cn("tnum rounded-full px-1.5 py-0.5 text-xs", tab === key ? "bg-white/20" : "bg-secondary text-muted-foreground")}>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === "posted" && (
          <>
            <SectionHeading eyebrow="Ownership" title="Rides I posted" description="As the driver you're the only person who can edit or cancel these." />
            {posted.length === 0 ? <EmptyState className="mt-5" title="You haven't posted a ride yet" description="Post the free seats on your next trip to campus." action={<ButtonLink to="/rides/new" variant="accent">Post your first ride</ButtonLink>} /> : (
              <ul className="mt-5 space-y-4">{posted.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2"><Badge tone="forest">{r.campus}</Badge><RideStatusBadge status={r.status} isFull={r.isFull} /></div>
                      <h3 className="mt-2 font-display text-lg font-extrabold"><Link to={`/rides/${r.id}`} className="hover:underline">{routeOf(r).from} <span className="text-accent-strong" aria-hidden>→</span> {routeOf(r).to}</Link></h3>
                      <p className="tnum mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden />{formatDayTime(r.departAt)}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden />{r.meetingPoint}</span>
                        <span>{formatPrice(r.pricePerSeat)}/seat</span>
                      </p>
                    </div>
                    {r.status === "open" && <div className="flex gap-2">
                      <ButtonLink to={`/rides/${r.id}/edit`} variant="subtle" size="sm" icon={<Pencil className="h-4 w-4" aria-hidden />}>Edit</ButtonLink>
                      <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />} onClick={() => setTarget({ kind: "ride", id: r.id, label: `${routeOf(r).from} to ${routeOf(r).to}` })}>Cancel</Button>
                    </div>}
                  </div>
                  <div className="mt-4 border-t border-border pt-4"><SeatMeter seatsLeft={r.seatsLeft} seatsTotal={r.seatsTotal} /></div>
                </li>))}</ul>
            )}
          </>
        )}

        {tab === "booked" && (
          <>
            <SectionHeading eyebrow="As a passenger" title="My bookings" description="Every seat you hold, with the driver and car details." />
            {booked.length === 0 ? <EmptyState className="mt-5" title="No bookings yet" description="Search the board for a ride to your campus." action={<ButtonLink to="/rides">Find a ride</ButtonLink>} /> : (
              <ul className="mt-5 grid gap-4 lg:grid-cols-2">{booked.map((b) => (
                <li key={b.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2"><BookingStatusBadge status={b.status} /><Badge tone="forest">{b.ride.campus}</Badge></div>
                      <h3 className="mt-2 font-display text-lg font-extrabold">{routeOf(b.ride).from} <span className="text-accent-strong" aria-hidden>→</span> {routeOf(b.ride).to}</h3>
                      <p className="tnum text-sm font-semibold">{formatDayTime(b.ride.departAt)}</p>
                    </div>
                    <p className="tnum text-right font-display text-xl font-extrabold">{formatPrice(b.ride.pricePerSeat * b.seats)}<span className="block text-xs font-medium text-muted-foreground">{b.seats} seat{b.seats > 1 && "s"}</span></p>
                  </div>
                  <div className="mt-4 flex items-center gap-3 border-t border-border pt-4"><Avatar name={b.ride.driver.name} size="sm" />
                    <div className="min-w-0"><p className="truncate font-bold">{b.ride.driver.name}</p>{b.ride.driver.car && <p className="truncate text-sm text-muted-foreground">{b.ride.driver.car.color} {b.ride.driver.car.model} · {b.ride.driver.car.plate}</p>}</div></div>
                  {b.note && <p className="mt-3 rounded-xl bg-secondary p-3 text-sm">Your note: {b.note}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink to={`/rides/${b.ride.id}`} variant="outline" size="sm">Ride details</ButtonLink>
                    <Button variant="ghost" size="sm" icon={<XCircle className="h-4 w-4" aria-hidden />} onClick={() => setTarget({ kind: "booking", id: b.id, label: `${routeOf(b.ride).from} to ${routeOf(b.ride).to}` })}>Cancel booking</Button>
                  </div>
                </li>))}</ul>
            )}
          </>
        )}

        {tab === "requests" && (
          <>
            <SectionHeading eyebrow="Only you can manage these" title="Passenger requests" description="Confirm or decline students who asked for a seat in your car." />
            {incoming.length === 0 ? <EmptyState className="mt-5" title="No passenger requests" description="When someone requests a seat on your ride, it shows up here." action={<ButtonLink to="/rides/new">Post a ride</ButtonLink>} /> : (
              <ul className="mt-5 space-y-3">{incoming.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <Avatar name={b.passenger.name} />
                  <div className="min-w-[10rem] flex-1">
                    <p className="font-bold">{b.passenger.name}</p>
                    <p className="text-sm text-muted-foreground">{b.seats} seat{b.seats > 1 && "s"}</p>
                    <p className="text-sm text-muted-foreground">{routeOf(b.ride).from} to {routeOf(b.ride).to} · {formatDayTime(b.ride.departAt)}</p>
                    {b.note && <p className="mt-1 text-sm">“{b.note}”</p>}
                  </div>
                  <BookingStatusBadge status={b.status} />
                  <div className="flex gap-2">
                    <Button size="sm" icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} disabled={b.status === "confirmed"} onClick={() => { const r = respondToBooking(b.id, "confirmed"); toast(r.ok ? "success" : "error", r.ok ? "Request confirmed" : r.error, r.ok ? `${b.passenger.name} is on your ride.` : undefined); }}>Confirm</Button>
                    <Button variant="outline" size="sm" disabled={b.status === "declined"} onClick={() => { const r = respondToBooking(b.id, "declined"); toast(r.ok ? "info" : "error", r.ok ? "Request declined" : r.error, r.ok ? "The seat went back to the board." : undefined); }}>Decline</Button>
                  </div>
                </li>))}</ul>
            )}
          </>
        )}

        {tab === "saved" && (
          <>
            <SectionHeading eyebrow="Shortlist" title="Saved rides" description="Rides you bookmarked while you decide." />
            {saved.length === 0 ? <EmptyState className="mt-5" title="Nothing saved yet" description="Tap the bookmark on any ride to keep it here." action={<ButtonLink to="/rides">Browse rides</ButtonLink>} /> : (
              <ul className="mt-5 grid gap-4 md:grid-cols-2">{saved.map((r) => <li key={r.id}><RideCard rideId={r.id} className="h-full" /></li>)}</ul>
            )}
          </>
        )}
      </div>

      <ConfirmDialog open={Boolean(target)} onClose={() => setTarget(null)} title={target?.kind === "ride" ? "Cancel this ride?" : "Cancel this booking?"}
        description={target?.kind === "ride" ? `Passengers booked on ${target?.label} will lose their seats.` : `Your seat on ${target?.label} goes back to the board.`}
        confirmLabel={target?.kind === "ride" ? "Yes, cancel the ride" : "Yes, cancel my seat"}
        onConfirm={() => { const r = target.kind === "ride" ? setRideStatus(target.id, "cancelled") : cancelBooking(target.id); toast(r.ok ? "success" : "error", r.ok ? (target.kind === "ride" ? "Ride cancelled" : "Booking cancelled") : r.error); }} />
    </div>
  );
}
