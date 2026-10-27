import { Compass } from "lucide-react";
import Logo from "../components/Logo";
import { ButtonLink } from "../components/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Logo className="h-20 opacity-60" />
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-accent-strong">Page not found</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">This route is not on the board</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page moved or never existed. Head back to the ride board to find your next seat.</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ButtonLink to="/rides" variant="accent" icon={<Compass className="h-4 w-4" aria-hidden />}>Find a ride</ButtonLink>
        <ButtonLink to="/" variant="outline">Back to home</ButtonLink>
      </div>
    </div>
  );
}
