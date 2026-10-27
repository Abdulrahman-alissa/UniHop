import { cn } from "../lib/cn";

// UniHop emblem (public/unihop-logo.png). It's round, so size it with h-* only.
export default function Logo({ className = "h-10" }) {
  return <img src={`${import.meta.env.BASE_URL}unihop-logo.png`} alt="UniHop, LAU student ride-share" className={cn("aspect-square w-auto shrink-0", className)} />;
}
