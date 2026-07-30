"use client";

import { useRef, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { COMMUNITY_GROUP_URL } from "@/lib/domain/community";

export function RegistrationSuccess({ message }: { message: string }) {
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2400);
    } catch {
      messageRef.current?.focus();
      messageRef.current?.select();
      setCopyState("manual");
    }
  };

  return (
    <section className="registration-success" aria-labelledby="registration-success-title">
      <div className="registration-success-heading">
        <span className="success-mark" aria-hidden="true">
          <Check size={21} strokeWidth={2.5} />
        </span>
        <div>
          <p className="eyebrow">Postulación publicada</p>
          <h2 id="registration-success-title">Ahora avisa en el grupo</h2>
          <p>
            Copia este resumen y pégalo en el chat. Solo contiene los datos públicos
            esenciales de tu registro.
          </p>
        </div>
      </div>

      <label className="sr-only" htmlFor="registration-announcement">
        Mensaje listo para compartir en WhatsApp
      </label>
      <textarea
        ref={messageRef}
        className="share-message"
        id="registration-announcement"
        readOnly
        value={message}
      />

      <div className="registration-success-actions">
        <button className="button button-primary" type="button" onClick={copyMessage}>
          {copyState === "copied" ? (
            <Check aria-hidden="true" size={17} />
          ) : (
            <Copy aria-hidden="true" size={17} />
          )}
          {copyState === "copied" ? "Mensaje copiado" : "Copiar mensaje"}
        </button>
        <a
          className="button button-secondary"
          href={COMMUNITY_GROUP_URL}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle aria-hidden="true" size={17} />
          Ir al grupo y pegar
        </a>
      </div>

      {copyState === "manual" ? (
        <p className="copy-help" role="status">
          No pudimos copiar automáticamente. El mensaje quedó seleccionado para que
          uses Ctrl+C.
        </p>
      ) : (
        <p className="sr-only" role="status" aria-live="polite">
          {copyState === "copied" ? "Mensaje copiado al portapapeles." : ""}
        </p>
      )}
    </section>
  );
}
