import { Link } from "react-router-dom";
import { CAMPUS_INFO } from "../data";
import Logo from "./Logo";

const link = "py-1 text-muted-foreground hover:text-foreground hover:underline underline-offset-4";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-card pb-10 pt-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3"><Logo className="h-11" /><span className="font-display text-xl font-extrabold">UniHop</span></div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">Share the ride to LAU Beirut and LAU Byblos. Post free seats, book a spot, split the fuel.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col text-sm">
          <h2 className="mb-1 font-display font-extrabold">Explore</h2>
          <Link className={link} to="/rides">Find a ride</Link>
          <Link className={link} to="/rides/new">Post a ride</Link>
          <Link className={link} to="/dashboard">My rides</Link>
          <Link className={link} to="/auth">Sign in</Link>
        </nav>
        <nav aria-label="Campus directions" className="flex flex-col text-sm">
          <h2 className="mb-1 font-display font-extrabold">Getting to campus</h2>
          <a className={link} href={CAMPUS_INFO["LAU Beirut"].url} target="_blank" rel="noreferrer">LAU Beirut directions</a>
          <a className={link} href={CAMPUS_INFO["LAU Byblos"].url} target="_blank" rel="noreferrer">LAU Byblos directions</a>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-border px-4 pt-5 text-sm text-muted-foreground lg:px-8">© {new Date().getFullYear()} UniHop</p>
    </footer>
  );
}
