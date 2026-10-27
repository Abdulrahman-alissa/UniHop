import { cn } from "../lib/cn";

function Shell({ id, label, error, hint, accessory, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">{label}</label>
        {accessory}
      </div>
      {children}
      {error ? <p id={`${id}-msg`} role="alert" className="mt-1.5 text-sm font-medium text-destructive">{error}</p>
        : hint ? <p id={`${id}-msg`} className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
const input = (error) => cn("min-h-11 w-full rounded-xl border bg-card px-3.5 py-2 text-base focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50", error ? "border-destructive" : "border-border");
const aria = (id, error, hint) => ({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? `${id}-msg` : undefined });

export const TextInput = ({ id, label, error, hint, accessory, ...p }) => (
  <Shell {...{ id, label, error, hint, accessory }}><input className={input(error)} {...aria(id, error, hint)} {...p} /></Shell>
);
export const SelectInput = ({ id, label, error, hint, options, placeholder, ...p }) => (
  <Shell {...{ id, label, error, hint }}>
    <select className={input(error)} {...aria(id, error, hint)} {...p}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </Shell>
);
export const TextAreaInput = ({ id, label, error, hint, ...p }) => (
  <Shell {...{ id, label, error, hint }}><textarea rows={3} className={input(error)} {...aria(id, error, hint)} {...p} /></Shell>
);
export const CheckboxRow = ({ id, label, description, className, ...p }) => (
  <label htmlFor={id} className={cn("flex min-h-11 cursor-pointer items-start gap-3 rounded-xl py-2", className)}>
    <input id={id} type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)]" {...p} />
    <span><span className="block font-semibold">{label}</span>{description && <span className="block text-sm text-muted-foreground">{description}</span>}</span>
  </label>
);
export const ToggleChip = ({ active, children, ...p }) => (
  <button type="button" aria-pressed={active} className={cn("min-h-10 cursor-pointer rounded-full border px-4 text-sm font-semibold", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")} {...p}>{children}</button>
);

export function CampusPicker({ value, onChange, options, label = "Campus", allLabel }) {
  const opts = allLabel ? ["", ...options] : options;
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-xl bg-secondary p-1" style={{ gridTemplateColumns: `repeat(${opts.length}, 1fr)` }}>
      {opts.map((c) => (
        <button key={c || "all"} type="button" role="radio" aria-checked={value === c} onClick={() => onChange(c)}
          className={cn("min-h-11 cursor-pointer rounded-lg px-2 text-sm font-bold", value === c ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground")}>
          {c || allLabel}
        </button>
      ))}
    </div>
  );
}
