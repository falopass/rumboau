"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { createResetLinkAction, toggleVisibilityAction } from "@/app/actions";

export function AdminControls({
  applicationPublicId,
  isPublic,
}: {
  applicationPublicId: string;
  isPublic: boolean;
}) {
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [pending, startTransition] = useTransition();

  const copy = async () => {
    await navigator.clipboard.writeText(resetUrl);
    setMessage("Enlace copiado.");
  };

  return (
    <div>
      <div className="button-row" style={{ marginTop: 0 }}>
        <button
          className="button button-secondary button-compact"
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await toggleVisibilityAction(applicationPublicId, !isPublic);
              setMessage(result.message);
            })
          }
        >
          {isPublic ? <EyeOff aria-hidden="true" size={15} /> : <Eye aria-hidden="true" size={15} />}
          {isPublic ? "Ocultar" : "Publicar"}
        </button>
        <button
          className="button button-secondary button-compact"
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await createResetLinkAction(applicationPublicId);
              setMessage(result.message);
              if (result.resetUrl) setResetUrl(result.resetUrl);
            })
          }
        >
          <KeyRound aria-hidden="true" size={15} />
          Recuperar
        </button>
      </div>
      {message ? <p className="document-meta" role="status">{message}</p> : null}
      {resetUrl ? (
        <div className="field">
          <label htmlFor={`reset-${applicationPublicId}`}>Enlace de un solo uso</label>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <input className="input" id={`reset-${applicationPublicId}`} readOnly value={resetUrl} />
            <button className="button button-compact" type="button" onClick={copy} aria-label="Copiar enlace">
              {message === "Enlace copiado." ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

