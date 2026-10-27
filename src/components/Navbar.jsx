import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, PlusCircle, ListChecks, Moon, Sun, LogOut, Menu } from "lucide-react";
import { useStore } from "../store";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import { Avatar } from "./ui";
import { Button, ButtonLink } from "./Button";
import { cn } from "../lib/cn";

const items = [["/", "Home", Home], ["/rides", "Find a ride", Search], ["/rides/new", "Post a ride", PlusCircle], ["/dashboard", "My rides", ListChecks]];

export default function Navbar() {
  const { currentUser, logout, theme, toggleTheme, toast } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const current = pathname === "/" ? "/" : pathname === "/rides/new" || pathname.endsWith("/edit") ? "/rides/new"
    : pathname.startsWith("/rides") || pathname.startsWith("/drivers") ? "/rides" : pathname.startsWith("/dashboard") ? "/dashboard" : null;
  const desk = (active) => cn("rounded-lg px-3 py-2 font-semibold", active ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary");
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 lg:px-8">
          <div className="flex items-center gap-1.5">
            <button ref={menuButton} onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobile-menu"
              className="-ml-2 grid h-11 w-11 cursor-pointer place-items-center rounded-full transition active:scale-90 active:bg-secondary hover:bg-secondary md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <Link to="/" className="flex items-center gap-2.5" aria-label="UniHop home">
              <Logo className="h-10" />
              <span className="font-display text-xl font-extrabold leading-none">UniHop</span>
            </Link>
          </div>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.map(([to, label]) => <Link key={to} to={to} aria-current={current === to ? "page" : undefined} className={desk(current === to)}>{label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="!px-3" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {currentUser ? (
              <>
                <Link to="/dashboard" aria-label="My dashboard"><Avatar name={currentUser.name} size="sm" /></Link>
                <Button variant="outline" size="sm" className="hidden md:inline-flex" icon={<LogOut className="h-4 w-4" />} onClick={() => { logout(); navigate("/"); toast("info", "Signed out"); }}>Sign out</Button>
              </>
            ) : (
              <ButtonLink to="/auth" size="sm">Sign in</ButtonLink>
            )}
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={items} current={current} triggerRef={menuButton} />
    </>
  );
}
