"use client";

import { useState, useTransition } from "react";
import { deleteParticipantAction } from "@/app/actions";

export function DeleteDataForm() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button className="button button-danger" type="button" onClick={() => setOpen(true)}>
        Eliminar todos mis datos
      </button>
      {open ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Acción irreversible</p>
            <h2 id="delete-title">Eliminar tu perfil y postulaciones</h2>
            <p>
              Se borrarán también documentos declarados, eventos y consejos. Esta
              acción no se puede deshacer.
            </p>
            {message ? <div className="form-error" role="alert">{message}</div> : null}
            <div className="field">
              <label htmlFor="delete-password">Confirma con tu contraseña</label>
              <input
                className="input"
                id="delete-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="button-row">
              <button className="button button-secondary" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button
                className="button button-danger"
                type="button"
                disabled={pending}
                onClick={() => {
                  setMessage("");
                  startTransition(async () => {
                    const result = await deleteParticipantAction(password);
                    if (!result.ok) setMessage(result.message);
                  });
                }}
              >
                {pending ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

