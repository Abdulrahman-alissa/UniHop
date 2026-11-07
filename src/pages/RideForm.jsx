import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Info, Lock, Save, Send, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { AREAS, CAMPUSES, RIDE_TAGS } from "../data";
import { formatPrice, genderWord, routeOf } from "../lib/format";
import { Badge, EmptyState, SectionHeading } from "../components/ui";
import { Button, ButtonLink } from "../components/Button";
import { CampusPicker, CheckboxRow, SelectInput, TextAreaInput, TextInput, ToggleChip } from "../components/Field";
import { ConfirmDialog } from "../components/Overlay";

const pad = (n) => String(n).padStart(2, "0");
const toDate = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const toTime = (iso) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const combine = (date, time) => (date && time ? new Date(`${date}T${time}`).toISOString() : null);
const todayStr = () => toDate(new Date().toISOString());
const EMPTY = { direction: "toCampus", girlsOnly: false, originArea: "", originLabel: "", campus: "", meetingPoint: "", departDate: todayStr(), departTime: "07:30", hasReturn: true, returnTime: "17:30", seatsTotal: "3", pricePerSeat: "4", notes: "", tags: [] };

const Fieldset = ({ legend, children, first }) => (
  <fieldset className={`space-y-4 ${first ? "" : "mt-8 border-t border-border pt-6"}`}><legend className="mb-2 font-display text-lg font-extrabold">{legend}</legend>{children}</fieldset>
);

export default function RideForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { currentUser, getRideView, createRide, updateRide, setRideStatus, canManageRide, toast } = useStore();
  const existing = isEdit ? getRideView(id) : undefined;
  const [f, setF] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setF({ direction: existing.direction, girlsOnly: existing.girlsOnly, originArea: existing.originArea, originLabel: existing.originLabel, campus: existing.campus, meetingPoint: existing.meetingPoint, departDate: toDate(existing.departAt), departTime: toTime(existing.departAt),
      hasReturn: Boolean(existing.returnAt), returnTime: existing.returnAt ? toTime(existing.returnAt) : "17:30", seatsTotal: String(existing.seatsTotal), pricePerSeat: String(existing.pricePerSeat), notes: existing.notes, tags: existing.tags });
    // eslint-disable-next-line
  }, [id]);

  const set = (k, v) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const toUni = f.direction === "toCampus";
  const route = routeOf({ direction: f.direction, originArea: f.originArea || "Home area", campus: f.campus || "Campus" });

  if (!currentUser) return <Navigate to={`/auth?next=${encodeURIComponent(isEdit ? `/rides/${id}/edit` : "/rides/new")}`} replace />;
  if (isEdit && !existing) return <EmptyState title="Ride not found" description="It may have been removed." action={<ButtonLink to="/dashboard">Open my dashboard</ButtonLink>} />;
  if (isEdit && !canManageRide(id))
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary"><Lock className="h-5 w-5" aria-hidden /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Only the driver can edit this ride</h1>
        <p className="mt-2 text-muted-foreground">{existing.driver.name} posted it, so the controls belong to them. You can still view it or book a seat.</p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row"><ButtonLink to={`/rides/${id}`}>View the ride</ButtonLink><ButtonLink to="/rides" variant="outline">Browse rides</ButtonLink></div>
      </div>
    );

  const validate = () => {
    const e = {};
    if (f.originArea.trim().length < 2) e.originArea = "Tell passengers where you're leaving from.";
    if (f.originLabel.trim().length < 5) e.originLabel = "Add a precise pickup point (5+ characters).";
    if (!f.campus) e.campus = "Choose LAU Beirut or LAU Byblos.";
    if (f.meetingPoint.trim().length < 3) e.meetingPoint = "Where on campus?";
    const depart = combine(f.departDate, f.departTime);
    if (!depart) e.departTime = "Set a departure date and time.";
    else if (new Date(depart) < Date.now() - 60000) e.departTime = "Departure must be in the future.";
    if (f.hasReturn) {
      const ret = combine(f.departDate, f.returnTime);
      if (!ret) e.returnTime = "Set a return time or switch to one way.";
      else if (depart && new Date(ret) <= new Date(depart)) e.returnTime = "Return must be after departure.";
    }
    const seats = Number(f.seatsTotal), booked = existing?.seatsBooked ?? 0;
    if (!Number.isInteger(seats) || seats < 1 || seats > 6) e.seatsTotal = "Offer between 1 and 6 seats.";
    else if (isEdit && seats < booked) e.seatsTotal = `${booked} seat(s) already booked, so you can't offer fewer.`;
    const price = Number(f.pricePerSeat);
    if (f.pricePerSeat === "" || Number.isNaN(price) || price < 0 || price > 50) e.pricePerSeat = "Set a fare between $0 and $50.";
    if (f.notes.length > 400) e.notes = "Keep the note under 400 characters.";
    return e;
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return toast("error", "Check the highlighted fields", "A few details need your attention.");
    const draft = { direction: f.direction, girlsOnly: f.girlsOnly, originArea: f.originArea.trim(), originLabel: f.originLabel.trim(), campus: f.campus, meetingPoint: f.meetingPoint.trim(), departAt: combine(f.departDate, f.departTime),
      returnAt: f.hasReturn ? combine(f.departDate, f.returnTime) : null, seatsTotal: Number(f.seatsTotal), pricePerSeat: Number(f.pricePerSeat), notes: f.notes.trim(), tags: f.tags };
    const res = isEdit ? updateRide(id, draft) : createRide(draft);
    if (!res.ok) return toast("error", "Couldn't save", res.error);
    toast("success", isEdit ? "Ride updated" : "Ride posted", isEdit ? "Passengers see the new details." : "Your seats are on the board.");
    nav(`/rides/${isEdit ? id : res.rideId}`);
  };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm">
        <Link to={isEdit ? `/rides/${id}` : "/dashboard"} className="inline-flex items-center gap-1.5 font-semibold hover:text-accent-strong"><ArrowLeft className="h-4 w-4" aria-hidden />{isEdit ? "Back to ride" : "Dashboard"}</Link>
      </nav>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">{isEdit ? "Edit ride" : "Post a ride"}</p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold sm:text-4xl">{isEdit ? "Update your ride details" : "Offer the seats in your car"}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Describe the route, when you leave and how many seats are free. You're the only person who can edit or cancel it.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-8">
        <form onSubmit={submit} noValidate className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <Fieldset legend="Route" first>
            <div>
              <span className="mb-1.5 block text-sm font-semibold">Direction</span>
              <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
                {[["toCampus", "Home to uni"], ["fromCampus", "Uni to home"]].map(([value, label]) => (
                  <button key={value} type="button" role="radio" aria-checked={f.direction === value} onClick={() => set("direction", value)}
                    className={`min-h-11 cursor-pointer rounded-lg px-2 text-sm font-bold ${f.direction === value ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>{label}</button>
                ))}
              </div>
            </div>
            <TextInput id="origin" label={toUni ? "Pickup area" : "Drop-off area"} list="areas" placeholder="e.g. Jounieh" autoComplete="off" value={f.originArea} onChange={(e) => set("originArea", e.target.value)} error={errors.originArea} />
            <datalist id="areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
            <div>
              <span className="mb-1.5 block text-sm font-semibold">Campus</span>
              <CampusPicker options={CAMPUSES} value={f.campus} onChange={(v) => set("campus", v)} label="Campus" />
              {errors.campus && <p role="alert" className="mt-1.5 text-sm font-medium text-destructive">{errors.campus}</p>}
            </div>
            <TextInput id="label" label={toUni ? "Exact pickup point" : "Exact drop-off point"} placeholder="e.g. Maameltein exit, outside the petrol station" value={f.originLabel} onChange={(e) => set("originLabel", e.target.value)} error={errors.originLabel} hint={toUni ? "Be precise. Passengers wait here." : "Where you drop passengers off."} />
            <TextInput id="meet" label={toUni ? "On-campus drop-off point" : "On-campus pickup point"} placeholder="e.g. Lower gate" value={f.meetingPoint} onChange={(e) => set("meetingPoint", e.target.value)} error={errors.meetingPoint} />
          </Fieldset>
          <Fieldset legend="Timing">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput id="date" label="Departure date" type="date" min={todayStr()} value={f.departDate} onChange={(e) => set("departDate", e.target.value)} />
              <TextInput id="time" label="Departure time" type="time" value={f.departTime} onChange={(e) => set("departTime", e.target.value)} error={errors.departTime} />
            </div>
            <CheckboxRow id="return" label="I also drive back" description="Add a return leg on the same day." checked={f.hasReturn} onChange={(e) => set("hasReturn", e.target.checked)} />
            {f.hasReturn && <TextInput id="rtime" label="Return time" type="time" value={f.returnTime} onChange={(e) => set("returnTime", e.target.value)} error={errors.returnTime} />}
          </Fieldset>
          <Fieldset legend="Seats and fare">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectInput id="seats" label="Seats you can offer" value={f.seatsTotal} onChange={(e) => set("seatsTotal", e.target.value)} options={[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} seat${n > 1 ? "s" : ""}` }))} error={errors.seatsTotal} hint={isEdit && existing.seatsBooked ? `${existing.seatsBooked} already booked` : undefined} />
              <TextInput id="price" label="Fare per seat (USD)" type="number" inputMode="decimal" min="0" max="50" value={f.pricePerSeat} onChange={(e) => set("pricePerSeat", e.target.value)} error={errors.pricePerSeat} hint="A fair share of fuel." />
            </div>
            <div><p className="mb-2 text-sm font-semibold">Ride features</p>
              <div className="flex flex-wrap gap-2">{RIDE_TAGS.map((t) => <ToggleChip key={t} active={f.tags.includes(t)} onClick={() => set("tags", f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])}>{t}</ToggleChip>)}</div></div>
          </Fieldset>
          <Fieldset legend="Who can ride">
            <p className="text-sm">You are posting as a <strong>{genderWord(currentUser.gender)}</strong> driver. Passengers will see this on the ride.</p>
            {currentUser.gender === "female" && (
              <CheckboxRow id="girls" label="Girls only" description="Only girls will see this ride and be able to book it." checked={f.girlsOnly} onChange={(e) => set("girlsOnly", e.target.checked)} />
            )}
          </Fieldset>
          <Fieldset legend="Note to passengers">
            <TextAreaInput id="notes" label="Anything they should know?" maxLength={400} placeholder="e.g. No stops. I wait five minutes at the pickup point." value={f.notes} onChange={(e) => set("notes", e.target.value)} error={errors.notes} hint={`${f.notes.length}/400`} />
          </Fieldset>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Button type="submit" variant="accent" size="lg" className="sm:flex-1" icon={isEdit ? <Save className="h-5 w-5" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}>{isEdit ? "Save changes" : "Post ride to the board"}</Button>
            <ButtonLink to={isEdit ? `/rides/${id}` : "/dashboard"} variant="outline" size="lg">Discard</ButtonLink>
          </div>
          {isEdit && <div className="mt-6 border-t border-border pt-5"><Button variant="danger" icon={<Trash2 className="h-4 w-4" aria-hidden />} disabled={existing.status === "cancelled"} onClick={() => setConfirm(true)}>{existing.status === "cancelled" ? "Ride already cancelled" : "Cancel this ride"}</Button></div>}
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24" aria-label="Preview">
          <div className="rounded-2xl border border-border bg-card p-5">
            <SectionHeading eyebrow="Preview" title="What passengers see" />
            <div className="mt-4 flex flex-wrap gap-2"><Badge tone="forest">{f.campus || "Campus not set"}</Badge><Badge tone="success">Seats open</Badge><Badge tone={f.girlsOnly ? "gold" : "muted"}>{f.girlsOnly ? "Girls only" : `${genderWord(currentUser.gender)} driver`}</Badge></div>
            <p className="mt-3 font-display text-xl font-extrabold">{route.from} <span className="text-accent-strong" aria-hidden>→</span> {route.to}</p>
            <dl className="tnum mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" aria-hidden />Departs</dt><dd className="font-semibold">{f.departDate} · {f.departTime}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Return</dt><dd className="font-semibold">{f.hasReturn ? f.returnTime : "One way"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Seats offered</dt><dd className="font-semibold">{f.seatsTotal}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Fare per seat</dt><dd className="font-semibold">{formatPrice(Number(f.pricePerSeat) || 0)}</dd></div>
            </dl>
            {f.tags.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">{f.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
          </div>
          <p className="flex gap-2 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Other students can view and book your ride. Only you can edit or cancel it.</p>
        </aside>
      </div>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Cancel this ride?" description="Every passenger booked on it loses their seat." confirmLabel="Yes, cancel the ride"
        onConfirm={() => { const r = setRideStatus(id, "cancelled"); toast(r.ok ? "success" : "error", r.ok ? "Ride cancelled" : r.error); if (r.ok) nav("/dashboard"); }} />
    </div>
  );
}
