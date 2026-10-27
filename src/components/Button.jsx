import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

const base = "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
const variants = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:brightness-105",
  outline: "border border-border bg-card text-foreground hover:border-primary",
  subtle: "bg-secondary text-secondary-foreground hover:brightness-95",
  ghost: "text-foreground hover:bg-secondary",
  danger: "border border-destructive text-destructive hover:bg-destructive hover:text-white",
  onDark: "border border-white/40 text-white hover:bg-white/10",
};
const sizes = { sm: "min-h-10 px-3 text-sm", md: "min-h-11 px-5", lg: "min-h-13 px-6 text-base" };
const cls = ({ variant = "primary", size = "md", fullWidth, className }) =>
  cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);

export function Button({ variant, size, fullWidth, className, icon, children, type = "button", ...rest }) {
  return <button type={type} className={cls({ variant, size, fullWidth, className })} {...rest}>{icon}{children}</button>;
}
export function ButtonLink({ variant, size, fullWidth, className, icon, children, ...rest }) {
  return <Link className={cls({ variant, size, fullWidth, className })} {...rest}>{icon}{children}</Link>;
}
