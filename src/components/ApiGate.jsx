import { useEffect, useState } from "react";
import { Loader2, WifiOff } from "lucide-react";
import { useStore } from "../store";
import { Button } from "./Button";

// Shown instead of the pages while the first API call is running (loading indicator)
// or when the API can't be reached (error message + retry).
export default function ApiGate({ children }) {
  const { boot, reload } = useStore();
  const [slow, setSlow] = useState(false);

  // Free hosting puts the API to sleep; tell people why the first load takes a while.
  useEffect(() => {
    if (boot.state !== "loading") { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(t);
  }, [boot.state]);

  if (boot.state === "ready") return children;

  if (boot.state === "error")
    return (
      <div role="alert" className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/15 text-destructive"><WifiOff className="h-5 w-5" aria-hidden /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Can't reach UniHop</h1>
        <p className="mt-2 text-muted-foreground">{boot.error}</p>
        <Button className="mt-5" onClick={reload}>Try again</Button>
      </div>
    );

  return (
    <div role="status" aria-live="polite" className="grid place-items-center gap-3 py-24 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-accent-strong" aria-hidden />
      <p className="font-display text-lg font-extrabold">Loading rides…</p>
      {slow && <p className="max-w-xs text-sm text-muted-foreground">Waking up the server. This can take up to a minute the first time.</p>}
    </div>
  );
}
