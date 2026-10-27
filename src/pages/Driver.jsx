import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CarFront, GraduationCap, Languages, ShieldCheck } from "lucide-react";
import { useStore } from "../store";
import { Avatar, Badge, EmptyState, Stars } from "../components/ui";
import { ButtonLink } from "../components/Button";
import RideCard from "../components/RideCard";

// Driver profile with their open rides
export default function Driver() {
  const { id } = useParams();
  const { users, ridesByDriver, canSee } = useStore();
  const driver = users.find((u) => u.id === id);
  if (!driver) return <EmptyState title="Driver not found" description="This profile doesn't exist." action={<ButtonLink to="/rides">Browse rides</ButtonLink>} />;
  const rides = ridesByDriver(driver.id).filter((r) => r.status === "open" && canSee(r));
  const car = driver.car;
  return (
    <div>
      <Link to="/rides" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-accent-strong"><ArrowLeft className="h-4 w-4" aria-hidden />Ride list</Link>
      <section aria-labelledby="driver-name" className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={driver.name} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 id="driver-name" className="font-display text-3xl font-extrabold">{driver.name}</h1>
            <p className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4" aria-hidden />{driver.gender === "female" ? "Girl" : "Boy"} · {driver.campus}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3"><Stars value={driver.rating} count={car?.trips} />{driver.verified && <Badge tone="success"><ShieldCheck className="h-3 w-3" aria-hidden />LAU verified</Badge>}</div>
          </div>
        </div>
        {driver.bio && <p className="mt-5 text-muted-foreground">{driver.bio}</p>}
        {car && (
          <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><CarFront className="h-4 w-4" aria-hidden />Vehicle</dt><dd className="mt-1 font-bold">{car.color} {car.make} {car.model}</dd><dd className="text-sm text-muted-foreground">Plate {car.plate}</dd></div>
            <div><dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><Languages className="h-4 w-4" aria-hidden />Speaks</dt><dd className="mt-1 font-bold">{car.languages.join(", ")}</dd><dd className="text-sm text-muted-foreground">{car.permitVerified ? "Campus permit on file" : "Permit pending"}</dd></div>
          </dl>
        )}
      </section>
      <h2 className="mt-8 font-display text-2xl font-extrabold">Rides by {driver.name.split(" ")[0]}</h2>
      {rides.length === 0 ? <EmptyState className="mt-4" title="No open rides" description="This driver has no upcoming rides right now." /> : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">{rides.map((r) => <li key={r.id}><RideCard rideId={r.id} className="h-full" /></li>)}</ul>
      )}
    </div>
  );
}
