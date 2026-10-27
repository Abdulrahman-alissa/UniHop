import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlusCircle, SlidersHorizontal, X } from "lucide-react";
import { useStore } from "../store";
import { AREAS, CAMPUSES } from "../data";
import { Button, ButtonLink } from "../components/Button";
import { CampusPicker, TextInput, CheckboxRow } from "../components/Field";
import { Modal } from "../components/Overlay";
import { EmptyState } from "../components/ui";
import RideCard from "../components/RideCard";
import { cn } from "../lib/cn";

const INITIAL = { origin: "", campus: "", direction: "", girlsOnly: false, date: "", seats: 0, maxPrice: 10, hideFull: true };
const DIRECTIONS = [["", "Both"], ["toCampus", "To uni"], ["fromCampus", "From uni"]];
const SORTS = [["soonest", "Soonest first"], ["cheapest", "Cheapest first"], ["seats", "Most seats free"]];

// Used in the desktop sidebar and the mobile filter sheet
function Filters({ f, set, reset, isGirl }) {
  return (
    <div className="space-y-4">
      <div><span className="mb-1.5 block text-sm font-semibold" id="campus-lbl">Campus</span><CampusPicker options={CAMPUSES} allLabel="Both" value={f.campus} onChange={(v) => set("campus", v)} label="Campus" /></div>
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Direction</span>
        <div role="radiogroup" aria-label="Direction" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          {DIRECTIONS.map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={f.direction === value} onClick={() => set("direction", value)}
              className={cn("min-h-11 cursor-pointer rounded-lg px-1 text-sm font-bold", f.direction === value ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground")}>{label}</button>
          ))}
        </div>
      </div>
      <TextInput id="f-origin" label="Area" list="areas" placeholder="e.g. Jounieh" value={f.origin} onChange={(e) => set("origin", e.target.value)} />
      <datalist id="areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
      <TextInput id="f-date" label="Date" type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
      <div>
        <span id="seat-lbl" className="mb-1.5 block text-sm font-semibold">Seats needed</span>
        <div role="group" aria-labelledby="seat-lbl" className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button key={n} type="button" aria-pressed={f.seats === n} onClick={() => set("seats", n)}
              className={cn("min-h-11 cursor-pointer rounded-xl border font-bold", f.seats === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{n === 0 ? "Any" : `${n}+`}</button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="f-price" className="mb-1.5 flex justify-between text-sm font-semibold"><span>Max fare per seat</span><span className="tnum">${f.maxPrice}</span></label>
        <input id="f-price" type="range" min="2" max="10" value={f.maxPrice} onChange={(e) => set("maxPrice", Number(e.target.value))} className="h-11 w-full accent-[var(--primary)]" />
      </div>
      {isGirl && <CheckboxRow id="f-girls" label="Girls only rides" checked={f.girlsOnly} onChange={(e) => set("girlsOnly", e.target.checked)} />}
      <CheckboxRow id="f-full" label="Hide full rides" checked={f.hideFull} onChange={(e) => set("hideFull", e.target.checked)} />
      <Button variant="outline" fullWidth onClick={reset}>Reset filters</Button>
    </div>
  );
}

export default function Rides() {
  const { upcoming, currentUser } = useStore();
  const isGirl = currentUser?.gender === "female";
  const [params, setParams] = useSearchParams();
  const [f, setF] = useState({ ...INITIAL, campus: CAMPUSES.includes(params.get("campus")) ? params.get("campus") : "" });
  const [sort, setSort] = useState("soonest");
  const [sheet, setSheet] = useState(false); // mobile filter sheet show/hide
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const reset = () => { setF(INITIAL); setParams({}, { replace: true }); };

  const results = useMemo(() => {
    const list = upcoming.filter((r) =>
      r.originArea.toLowerCase().includes(f.origin.trim().toLowerCase()) &&
      (!f.campus || r.campus === f.campus) &&
      (!f.direction || r.direction === f.direction) &&
      (!f.girlsOnly || r.girlsOnly) &&
      (!f.date || new Date(r.departAt).toLocaleDateString("en-CA") === f.date) &&
      r.seatsLeft >= f.seats && r.pricePerSeat <= f.maxPrice && (!f.hideFull || !r.isFull));
    if (sort === "cheapest") list.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    if (sort === "seats") list.sort((a, b) => b.seatsLeft - a.seatsLeft);
    return list;
  }, [upcoming, f, sort]);

  const chips = [
    f.campus && ["campus", f.campus, ""], f.direction && ["direction", f.direction === "toCampus" ? "To uni" : "From uni", ""], f.girlsOnly && ["girlsOnly", "Girls only", false], f.origin && ["origin", `From ${f.origin}`, ""], f.date && ["date", f.date, ""],
    f.seats > 0 && ["seats", `${f.seats}+ seats`, 0], f.maxPrice < 10 && ["maxPrice", `Up to $${f.maxPrice}`, 10],
  ].filter(Boolean);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">Ride list</p>
      <h1 className="mt-1.5 font-display text-3xl font-extrabold sm:text-4xl">Find a ride</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Rides to and from campus. Filter by direction, area, date and seats.</p>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-72 shrink-0 lg:block" aria-label="Filters">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-5"><h2 className="mb-4 font-display text-lg font-extrabold">Filters</h2><Filters f={f} set={set} reset={reset} isGirl={isGirl} /></div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="sticky top-[57px] z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur lg:static lg:mx-0 lg:rounded-2xl lg:border lg:bg-card lg:p-3">
            <p className="tnum font-bold" aria-live="polite">{results.length} {results.length === 1 ? "ride" : "rides"} found</p>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" icon={<SlidersHorizontal className="h-4 w-4" aria-hidden />} onClick={() => setSheet(true)}>Filters{chips.length ? ` (${chips.length})` : ""}</Button>
              <label htmlFor="sort" className="sr-only">Sort rides</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold">
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
              {chips.map(([k, label, empty]) => (
                <li key={k}><button onClick={() => set(k, empty)} aria-label={`Remove filter ${label}`} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-semibold text-secondary-foreground">{label}<X className="h-3.5 w-3.5" aria-hidden /></button></li>
              ))}
            </ul>
          )}

          {results.length === 0 ? (
            <EmptyState className="mt-5" title="No rides match those filters" description="Try another date, a different campus or show full rides too."
              action={<div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={reset}>Clear all filters</Button><ButtonLink to="/rides/new" variant="accent" icon={<PlusCircle className="h-4 w-4" aria-hidden />}>Post this route</ButtonLink></div>} />
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">{results.map((r) => <li key={r.id}><RideCard rideId={r.id} className="h-full" /></li>)}</ul>
          )}
        </div>
      </div>

      <Modal open={sheet} onClose={() => setSheet(false)} title="Filters" footer={<Button fullWidth onClick={() => setSheet(false)}>Show {results.length} {results.length === 1 ? "ride" : "rides"}</Button>}>
        <Filters f={f} set={set} reset={reset} isGirl={isGirl} />
      </Modal>
    </div>
  );
}
