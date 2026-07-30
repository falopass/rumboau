"use client";

import { useState, useTransition } from "react";
import { addAdminNoteAction } from "@/app/actions";

export function AdminNoteForm({ applicationPublicId }: { applicationPublicId: string }) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await addAdminNoteAction(applicationPublicId, content);
          setMessage(result.message);
          if (result.ok) setContent("");
        });
      }}
    >
      <div className="field">
        <label htmlFor="admin-note">Nueva nota interna</label>
        <textarea
          className="textarea"
          id="admin-note"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Nunca se mostrará en la ficha pública."
        />
      </div>
      {message ? <p className="document-meta" role="status">{message}</p> : null}
      <button className="button button-primary button-compact" disabled={pending} type="submit">
        {pending ? "Guardando…" : "Guardar nota"}
      </button>
    </form>
  );
}

