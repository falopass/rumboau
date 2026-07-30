"use client";

import { useState, useTransition } from "react";
import { participantLoginAction } from "@/app/actions";

export function ParticipantLoginForm({ applicationPublicId }: { applicationPublicId: string }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="form-sheet"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        startTransition(async () => {
          const result = await participantLoginAction({ applicationPublicId, password, website: "" });
          if (!result.ok) setMessage(result.message);
        });
      }}
    >
      <p className="eyebrow">Acceso de edición</p>
      <h2>Ingresa tu contraseña</h2>
      <p>Esta contraseña desbloquea todas tus postulaciones, no solamente esta ficha.</p>
      {message ? <div className="form-error" role="alert">{message}</div> : null}
      <div className="field">
        <label htmlFor="participant-password">Contraseña</label>
        <input
          className="input"
          id="participant-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? "Verificando…" : "Editar mi registro"}
      </button>
    </form>
  );
}

