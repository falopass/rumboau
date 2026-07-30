"use client";

import { useState, useTransition } from "react";
import { EyeOff } from "lucide-react";
import { moderateTipAction } from "@/app/actions";

export function AdminTipControls({ tipId }: { tipId: string }) {
  const [hidden, setHidden] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  if (hidden) {
    return <span className="document-meta" role="status">{message}</span>;
  }

  return (
    <div>
      <button
        className="button button-secondary button-compact"
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await moderateTipAction(tipId, false);
            setMessage(result.message);
            if (result.ok) setHidden(true);
          })
        }
      >
        <EyeOff aria-hidden="true" size={15} />
        {pending ? "Ocultando…" : "Ocultar consejo"}
      </button>
      {message && !hidden ? <p className="document-meta" role="status">{message}</p> : null}
    </div>
  );
}
