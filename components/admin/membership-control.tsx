"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { setMembershipVerifiedAction } from "@/app/actions";

export function MembershipControl({
  applicationPublicId,
  initialVerified,
}: {
  applicationPublicId: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        className="button button-secondary button-compact"
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await setMembershipVerifiedAction(
              applicationPublicId,
              !verified,
            );
            setMessage(result.message);
            if (result.ok) setVerified(!verified);
          })
        }
      >
        {verified ? (
          <CheckCircle2 aria-hidden="true" size={15} />
        ) : (
          <CircleDashed aria-hidden="true" size={15} />
        )}
        {pending
          ? "Guardando…"
          : verified
            ? "Grupo verificado"
            : "Marcar como verificado"}
      </button>
      {message ? <p className="document-meta" role="status">{message}</p> : null}
    </div>
  );
}
