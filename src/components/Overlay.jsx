import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Modal({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}
        className="pop flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl border border-border bg-card sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-extrabold">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, title, description, confirmLabel, onConfirm }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}
      footer={<div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={onClose}>Keep it</Button><Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></div>} />
  );
}
