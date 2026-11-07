import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Bookmark, CalendarDays, CarFront, CheckCircle2, Clock, Languages, MapPin, MessageSquare, Pencil, Phone, Share2, ShieldCheck, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { formatCountdown, formatFullDate, formatPrice, formatTime, routeOf } from "../lib/format";
import { Avatar, Badge, EmptyState, GenderBadge, RideStatusBadge, SeatMeter, Stars } from "../components/ui";
import { Button, ButtonLink } from "../components/Button";
import { CheckboxRow, SelectInput, TextAreaInput } from "../components/Field";
import { ConfirmDialog, Modal } from "../components/Overlay";
import RideCard from "../components/RideCard";
import CampusPhoto from "../components/CampusPhoto";
import { CAMPUS_INFO } from "../data";
import { cn } from "../lib/cn";

const Card = ({ className, ...p }) => <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6", className)} {...p} />;

export default function RideDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { getRideView, canSee, currentUser, savedRideIds, toggleSaved, bookRide, cancelBooking, setRideStatus, bookings, bookingsForDriver, upcoming, toast } = useStore();
  const ride = getRideView(id);
  const [bookOpen, setBookOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [seats, setSeats] = useState("1");
  const [note, setNote] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState("");

  if (!ride)
    return <EmptyState title="That ride is no longer on the board" description="It may have been removed. Browse the board for other seats." action={<ButtonLink to="/rides">Back to ride list</ButtonLink>} />;

  if (!canSee(ride))
    return <EmptyState title="This ride is for girls only" description="The driver made it available to girls only. Browse the board for other seats." action={<ButtonLink to="/rides">Back to ride list</ButtonLink>} />;

  const route = routeOf(ride);
  const toUni = ride.direction !== "fromCampus";
  const isDriver = currentUser?.id === ride.driverId;
  const mine = currentUser && bookings.find((b) => b.rideId === ride.id && b.passengerId === currentUser.id && (b.status === "pending" || b.status === "confirmed"));
  const saved = savedRideIds.includes(ride.id);
  const requests = isDriver ? bookingsForDriver(currentUser.id).filter((b) => b.rideId === ride.id) : [];
  const similar = upcoming.filter((r) => r.id !== ride.id && r.campus === ride.campus && !r.isFull).slice(0, 2);
  const car = ride.driver.car;
  const canBook = ride.status === "open" && !ride.isFull;

  const openBooking = () => {
    if (!currentUser) { toast("info", "Sign in required", "Use your @lau.edu account to book a seat."); return nav(`/auth?next=${encodeURIComponent(`/rides/${ride.id}`)}`); }
    setErr(""); setAgree(false); setBookOpen(true);
  };
  const submitBooking = (e) => {
    e?.preventDefault();
    if (!agree) return setErr("Please confirm you'll be at the pickup point on time.");
    const r = bookRide(ride.id, Number(seats), note);
    if (!r.ok) return setErr(r.error);
    setBookOpen(false); setNote(""); setSeats("1");
    toast("success", "Request sent", "The driver will confirm your seat.");
  };

  const bookButton = !isDriver && !mine && (
    <Button variant="accent" size="lg" fullWidth disabled={!canBook} onClick={openBooking}>
      {ride.status === "cancelled" ? "Ride cancelled" : ride.isFull ? "Full — no seats left" : `Book a seat${ride.seatsLeft === 1 ? " · last one" : ""}`}
    </Button>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/rides" className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-accent-strong"><ArrowLeft className="h-4 w-4" aria-hidden />Ride list</Link>
        <span aria-hidden>/</span><span className="truncate">{route.from} to {route.to}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-5">
          <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b4a38] to-[#1f7a8c] sm:h-52">
            <CampusPhoto campus={ride.campus} />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#07281f]/85 to-transparent" />
            <p className="absolute bottom-3 left-4 flex items-center gap-2 font-display text-lg font-extrabold text-white"><MapPin className="h-5 w-5 text-accent" aria-hidden />{ride.campus}</p>
          </div>
          <Card aria-labelledby="ride-title">
            <div className="flex flex-wrap items-center gap-2"><Badge tone="forest">{ride.campus}</Badge><RideStatusBadge status={ride.status} isFull={ride.isFull} /><GenderBadge ride={ride} /></div>
            <h1 id="ride-title" className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{route.from} <span className="text-accent-strong" aria-hidden>→</span> {route.to}</h1>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-semibold">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-accent-strong" aria-hidden />{formatFullDate(ride.departAt)}</span>
              <span className="tnum flex items-center gap-2"><Clock className="h-4 w-4 text-accent-strong" aria-hidden />{formatTime(ride.departAt)}{ride.returnAt ? ` · returns ${formatTime(ride.returnAt)}` : " · one way"}</span>
            </p>
            {ride.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{ride.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
              <Button variant="outline" size="sm" aria-pressed={saved} icon={<Bookmark className={cn("h-4 w-4", saved && "fill-current")} aria-hidden />} onClick={() => { toggleSaved(ride.id); toast("info", saved ? "Removed from saved rides" : "Saved for later"); }}>{saved ? "Saved" : "Save ride"}</Button>
              <Button variant="outline" size="sm" icon={<Share2 className="h-4 w-4" aria-hidden />} onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => toast("success", "Link copied"), () => toast("info", "Copy the address bar link to share")) ?? toast("info", "Copy the address bar link to share")}>Share</Button>
              {isDriver && <>
                <ButtonLink to={`/rides/${ride.id}/edit`} variant="subtle" size="sm" icon={<Pencil className="h-4 w-4" aria-hidden />}>Edit ride</ButtonLink>
                <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" aria-hidden />} disabled={ride.status === "cancelled"} onClick={() => setCancelOpen(true)}>{ride.status === "cancelled" ? "Cancelled" : "Cancel ride"}</Button>
              </>}
            </div>
          </Card>

          <Card aria-labelledby="route">
            <h2 id="route" className="font-display text-xl font-extrabold">Pickup and route</h2>
            <ol className="mt-5">
              <li className="relative flex gap-4 pb-6">
                <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px border-l-2 border-dashed border-border" aria-hidden />
                <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><MapPin className="h-4 w-4" aria-hidden /></span>
                <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">Pickup</p><p className="font-bold">{toUni ? ride.originLabel : ride.meetingPoint}</p><p className="tnum text-sm text-muted-foreground">Leaves at {formatTime(ride.departAt)} · {formatCountdown(ride.departAt)}</p></div>
              </li>
              <li className="flex gap-4">
                <span className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><CheckCircle2 className="h-4 w-4" aria-hidden /></span>
                <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">{toUni ? "Arrival" : "Drop-off"}</p><p className="font-bold">{toUni ? ride.meetingPoint : ride.originLabel}</p><p className="text-sm text-muted-foreground">{ride.returnAt ? `Return leg departs ${formatTime(ride.returnAt)}` : "One-way trip"}</p></div>
              </li>
            </ol>
            {CAMPUS_INFO[ride.campus] && <p className="mt-5 rounded-xl border border-accent/40 bg-accent-soft p-4 text-sm"><strong>Why carpool {toUni ? "to" : "from"} {ride.campus}:</strong> {CAMPUS_INFO[ride.campus].tip} <a href={CAMPUS_INFO[ride.campus].url} target="_blank" rel="noreferrer" className="font-bold text-accent-strong underline underline-offset-4">LAU directions and parking</a></p>}
            {ride.notes && <div className="mt-5 rounded-xl bg-secondary p-4"><h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-secondary-foreground"><MessageSquare className="h-4 w-4" aria-hidden />Note from the driver</h3><p className="mt-1.5">{ride.notes}</p></div>}
          </Card>

          <Card aria-labelledby="driver">
            <h2 id="driver" className="font-display text-xl font-extrabold">Your driver</h2>
            <div className="mt-4 flex items-start gap-4">
              <Avatar name={ride.driver.name} size="lg" />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold"><Link to={`/drivers/${ride.driver.id}`} className="underline-offset-4 hover:underline">{ride.driver.name}</Link>{ride.driver.verified && <Badge tone="success"><ShieldCheck className="h-3 w-3" aria-hidden />LAU verified</Badge>}</p>
                <p className="text-muted-foreground">{ride.driver.gender === "female" ? "Girl" : "Boy"} · {ride.driver.campus}</p>
                <div className="mt-1"><Stars value={ride.driver.rating} count={car?.trips} /></div>
              </div>
            </div>
            {ride.driver.bio && <p className="mt-4 text-muted-foreground">{ride.driver.bio}</p>}
            {car && (
              <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
                <div><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><CarFront className="h-4 w-4" aria-hidden />Vehicle</dt><dd className="mt-1 font-bold">{car.color} {car.make} {car.model}</dd><dd className="text-sm text-muted-foreground">Plate {car.plate}</dd></div>
                <div><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><Languages className="h-4 w-4" aria-hidden />Speaks</dt><dd className="mt-1 font-bold">{car.languages.join(", ")}</dd><dd className="text-sm text-muted-foreground">{car.permitVerified ? "Campus permit on file" : "Permit pending"}</dd></div>
              </dl>
            )}
          </Card>

          {isDriver && (
            <Card aria-labelledby="req" className="border-accent/50 bg-accent-soft">
              <h2 id="req" className="font-display text-xl font-extrabold">Booking requests</h2>
              <p className="mt-1 text-sm text-muted-foreground">Only you can see and answer these, because you posted the ride.</p>
              {requests.length === 0 ? <p className="mt-3">No passengers yet.</p> : (
                <ul className="mt-3 space-y-2">{requests.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <Avatar name={b.passenger.name} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate font-bold">{b.passenger.name}</p><p className="truncate text-sm text-muted-foreground">{b.seats} seat{b.seats > 1 && "s"}</p></div>
                    <Badge tone={b.status === "confirmed" ? "success" : b.status === "pending" ? "gold" : "muted"} className="capitalize">{b.status}</Badge>
                    {b.passenger.phone && <a href={`tel:${b.passenger.phone.replace(/\s/g, "")}`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-accent-strong"><Phone className="h-4 w-4" aria-hidden />Call</a>}
                  </li>))}</ul>
              )}
            </Card>
          )}

          {similar.length > 0 && (
            <section aria-labelledby="similar"><h2 id="similar" className="font-display text-xl font-extrabold">Other rides to {ride.campus}</h2>
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">{similar.map((r) => <li key={r.id}><RideCard rideId={r.id} className="h-full" /></li>)}</ul></section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24" aria-label="Booking">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Fare per seat</p>
            <p className="tnum mt-1 font-display text-5xl font-extrabold leading-none">{formatPrice(ride.pricePerSeat)}</p>
            <p className="mt-2 text-muted-foreground">{ride.isFull ? "This ride is full." : `${ride.seatsLeft} of ${ride.seatsTotal} seats still free`}</p>
            <div className="mt-4"><SeatMeter seatsLeft={ride.seatsLeft} seatsTotal={ride.seatsTotal} showLabel={false} /></div>
            <div className="mt-5 space-y-2.5">
              {isDriver ? (
                <><p className="rounded-xl bg-secondary p-3 text-sm font-semibold text-secondary-foreground">You posted this ride. Only you can edit or cancel it.</p>
                  <ButtonLink to={`/rides/${ride.id}/edit`} fullWidth icon={<Pencil className="h-4 w-4" aria-hidden />}>Edit ride details</ButtonLink></>
              ) : mine ? (
                <><div className="rounded-xl border border-success/40 bg-success/10 p-3"><p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4 text-success" aria-hidden />You're on this ride</p><p className="text-sm text-muted-foreground">{mine.seats} seat{mine.seats > 1 && "s"} · {mine.status === "pending" ? "Awaiting driver confirmation" : "Confirmed by the driver"}</p></div>
                  <Button variant="outline" fullWidth onClick={() => { const r = cancelBooking(mine.id); toast(r.ok ? "success" : "error", r.ok ? "Booking cancelled" : r.error); }}>Cancel my booking</Button></>
              ) : bookButton}
              {!currentUser && <p className="text-center text-sm text-muted-foreground"><Link to="/auth" className="font-bold text-accent-strong underline">Sign in</Link> to book or post rides.</p>}
            </div>
          </div>
          {ride.status === "cancelled" && <p className="mt-4 flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 font-medium text-destructive"><AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />The driver cancelled this ride. Bookings were released.</p>}
        </aside>
      </div>

      {bookButton && (
        <div className="fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)] z-20 flex items-center gap-3 border-t border-border bg-card/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <p className="tnum font-display text-2xl font-extrabold leading-none">{formatPrice(ride.pricePerSeat)}<span className="block text-xs font-medium text-muted-foreground">per seat</span></p>
          <div className="flex-1">{bookButton}</div>
        </div>
      )}

      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Confirm your seat" description={`${route.from} to ${route.to} · ${formatFullDate(ride.departAt)} at ${formatTime(ride.departAt)}`}
        footer={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button><Button variant="accent" onClick={submitBooking}>Send request</Button></div>}>
        <form className="space-y-4" onSubmit={submitBooking}>
          <SelectInput id="b-seats" label="Number of seats" value={seats} onChange={(e) => setSeats(e.target.value)}
            options={Array.from({ length: Math.max(1, ride.seatsLeft) }, (_, i) => ({ value: String(i + 1), label: `${i + 1} seat${i ? "s" : ""} · ${formatPrice(ride.pricePerSeat * (i + 1))} total` }))} hint="Fares are paid directly to the driver." />
          <TextAreaInput id="b-note" label="Note for the driver (optional)" maxLength={240} placeholder="e.g. I finish class at 16:00" value={note} onChange={(e) => setNote(e.target.value)} />
          <CheckboxRow id="b-agree" label="I'll be at the pickup point on time" description="Drivers wait a maximum of five minutes." checked={agree} onChange={(e) => { setAgree(e.target.checked); setErr(""); }} />
          {err && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">{err}</p>}
        </form>
      </Modal>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this ride?" description="Every passenger booked on it will lose their seat. This can't be undone." confirmLabel="Yes, cancel the ride"
        onConfirm={() => { const r = setRideStatus(ride.id, "cancelled"); toast(r.ok ? "success" : "error", r.ok ? "Ride cancelled" : r.error); }} />
    </div>
  );
}
