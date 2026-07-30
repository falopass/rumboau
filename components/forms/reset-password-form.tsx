"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/app/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="form-sheet"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        startTransition(async () => {
          const result = await resetPasswordAction({ token, password, confirmPassword });
          if (!result.ok) setMessage(result.message);
        });
      }}
    >
      <p className="eyebrow">Enlace de un solo uso</p>
      <h2>Define una contraseña nueva</h2>
      <p>Al cambiarla se cerrarán las sesiones anteriores.</p>
      {message ? <div className="form-error" role="alert">{message}</div> : null}
      <div className="field">
        <label htmlFor="reset-password">Nueva contraseña</label>
        <input
          className="input"
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="reset-confirm-password">Repite la contraseña</label>
        <input
          className="input"
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Actualizando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}

