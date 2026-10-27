import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useStore } from "../store";

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const colors = { success: "text-success", error: "text-destructive", info: "text-accent-strong" };

export default function Toasts() {
  const { toasts } = useStore();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:top-auto md:items-end md:pr-6">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className="pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-lg">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${colors[t.type]}`} aria-hidden />
            <div><p className="font-bold">{t.title}</p>{t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}</div>
          </div>
        );
      })}
    </div>
  );
}
