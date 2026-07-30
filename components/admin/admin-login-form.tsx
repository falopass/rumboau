"use client";

import { useState, useTransition } from "react";
import { adminLoginAction } from "@/app/actions";

export function AdminLoginForm({
  demoCredentials,
}: {
  demoCredentials?: { email: string; password: string };
}) {
  const [email, setEmail] = useState(demoCredentials?.email ?? "");
  const [password, setPassword] = useState(demoCredentials?.password ?? "");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="form-sheet"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        startTransition(async () => {
          const result = await adminLoginAction({ email, password });
          if (!result.ok) setMessage(result.message);
        });
      }}
    >
      <p className="eyebrow">Acceso restringido</p>
      <h2>Administración</h2>
      {message ? <div className="form-error" role="alert">{message}</div> : null}
      <div className="field">
        <label htmlFor="admin-email">Correo</label>
        <input
          className="input"
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Contraseña</label>
        <input
          className="input"
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Ingresando…" : "Entrar al panel"}
      </button>
    </form>
  );
}

