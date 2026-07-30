import type { Metadata } from "next";
import { CreateParticipantForm } from "@/components/forms/create-participant-form";

export const metadata: Metadata = { title: "Agregar postulación" };

export default function NewApplicationPage() {
  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Registro comunitario</p>
        <h1>Agrega tu postulación</h1>
        <p>
          Elige qué nombre mostrar y registra solamente datos que te acomode hacer
          públicos. Rumbo AU no necesita tu teléfono ni documentos reales.
        </p>
      </div>
      <div className="form-layout">
        <CreateParticipantForm />
        <aside className="side-note">
          <h2>Antes de publicar</h2>
          <ul>
            <li>No escribas RUT, pasaporte, identificadores, cuentas ni saldos.</li>
            <li>La contraseña es la única forma de editar tu registro.</li>
            <li>Si la olvidas, un administrador puede enviarte un enlace de recuperación.</li>
            <li>Todos los datos de este formulario, excepto la contraseña, serán públicos.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

