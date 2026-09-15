import { useEffect, useState } from "react";
import { ExclamationTriangle } from "@primeicons/react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

// PrimeReact v11's Tailwind-mode catalog dropped ConfirmDialog entirely (verified
// against the live component registry — not a naming issue, it simply isn't there).
// This hand-builds the same imperative `confirmDialog({message, header, icon, accept})`
// API the app already uses, on top of our own Dialog wrapper, so call sites are
// untouched. A single global listener is enough — the app never opens two confirm
// dialogs at once.
let listener = null;

export function confirmDialog({ message, header, icon, accept }) {
  listener?.({ message, header, icon, accept });
}

export function ConfirmDialog() {
  const [state, setState] = useState(null);

  useEffect(() => {
    listener = setState;
    return () => {
      if (listener === setState) listener = null;
    };
  }, []);

  if (!state) return null;

  return (
    <Dialog header={state.header} visible={!!state} onHide={() => setState(null)} style={{ width: "24rem" }}>
      <div className="flex items-start gap-3">
        {state.icon && <ExclamationTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />}
        <p className="text-sm text-surface-600">{state.message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="text" severity="secondary" size="small" onClick={() => setState(null)}>
          Cancel
        </Button>
        <Button
          size="small"
          onClick={() => {
            state.accept?.();
            setState(null);
          }}
        >
          Confirm
        </Button>
      </div>
    </Dialog>
  );
}
