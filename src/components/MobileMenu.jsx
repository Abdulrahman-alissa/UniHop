import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import Logo from "./Logo";
import { cn } from "../lib/cn";

const DRAG_CLOSE = 80;
const SWIPE_LIMIT = 320;

export default function MobileMenu({
  open,
  onClose,
  links,
  current,
  triggerRef,
}) {
  const { pathname } = useLocation();
  const panelRef = useRef(null);
  const startX = useRef(null);
  const dragRef = useRef(0);
  const previousOverflow = useRef("");
  const [drag, setDrag] = useState(0);

  const updateDrag = (value) => {
    dragRef.current = value;
    setDrag(value);
  };

  // Close when the route changes.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock page scrolling and support keyboard navigation.
  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef?.current;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;

    const getFocusable = () =>
      panel?.querySelectorAll('a[href], button:not([disabled])') ?? [];

    const focusFirst = () => getFocusable()[0]?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const items = getFocusable();
      if (!items.length) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 768) onClose();
    };

    const frame = requestAnimationFrame(focusFirst);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow.current;
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      if (trigger?.isConnected) trigger.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onTouchStart = (event) => {
    startX.current = event.touches[0].clientX;
    updateDrag(0);
  };

  const onTouchMove = (event) => {
    if (startX.current === null) return;

    const distance = event.touches[0].clientX - startX.current;
    updateDrag(Math.max(-SWIPE_LIMIT, Math.min(0, distance)));
  };

  const onTouchEnd = () => {
    if (dragRef.current <= -DRAG_CLOSE) onClose();

    startX.current = null;
    updateDrag(0);
  };

  const row = cn(
    "transition-all duration-300 ease-out",
    open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
  );

  return (
    <div
      id="mobile-menu"
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open
          ? "visible [transition:visibility_0s]"
          : "invisible [transition:visibility_0s_linear_320ms]"
      )}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          "absolute inset-0 h-full w-full bg-black/55 backdrop-blur-[2px]",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        style={
          drag
            ? { opacity: Math.max(0, 1 + drag / SWIPE_LIMIT) }
            : undefined
        }
      />

      {/* Navigation panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={
          drag
            ? {
                transform: `translateX(${drag}px)`,
                transition: "none",
              }
            : undefined
        }
        className={cn(
          "absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col",
          "bg-card shadow-2xl transition-transform duration-300",
          "ease-[cubic-bezier(.32,.72,0,1)]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <Link
            to="/"
            onClick={onClose}
            aria-label="UniHop home"
            className="flex min-w-0 items-center gap-3"
          >
            <Logo className="h-11 w-auto max-w-[120px] object-contain" />
            <span className="whitespace-nowrap font-display text-xl font-extrabold">
              UniHop
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:bg-secondary active:scale-90"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable navigation */}
        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
        >
          <ul className="space-y-1">
            {links.map(([to, label, Icon], index) => (
              <li
                key={to}
                className={row}
                style={{
                  transitionDelay: open
                    ? `${Math.min(100 + index * 40, 350)}ms`
                    : "0ms",
                }}
              >
                <Link
                  to={to}
                  onClick={onClose}
                  aria-current={current === to ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-xl px-3 font-bold",
                    "transition active:scale-[0.97]",
                    current === to
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary active:bg-secondary"
                  )}
                >
                  {Icon && (
                    <Icon
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  )}

                  <span className="flex-1">{label}</span>

                  {current === to && (
                    <span
                      className="h-2 w-2 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}