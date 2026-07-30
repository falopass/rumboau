import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import { getParticipantSession } from "@/lib/security/participant-session";
import { ApplicationEditor } from "@/components/forms/application-editor";
import { TipForm } from "@/components/forms/tip-form";
import { DeleteDataForm } from "@/components/forms/delete-data-form";
import { participantLogoutAction } from "@/app/actions";

export const metadata: Metadata = { title: "Mi registro" };
export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const session = await getParticipantSession();
  if (!session) {
    return (
      <div className="page-width page-content">
        <div className="page-heading">
          <p className="eyebrow">Acceso de edición</p>
          <h1>Abre primero tu ficha pública</h1>
          <p>
            Busca tu nombre en el tablero, abre tu postulación y pulsa “Editar con
            contraseña”. Así sabemos qué registro quieres desbloquear.
          </p>
        </div>
        <Link className="button button-primary" href="/#tablero">Buscar mi postulación</Link>
      </div>
    );
  }
  const workspace = await getRepository().getWorkspace(session.participantId);
  if (!workspace || workspace.passwordVersion !== session.passwordVersion) {
    redirect("/");
  }

  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Área privada de edición</p>
        <h1>Hola, {workspace.displayName}</h1>
        <p>
          Aquí puedes actualizar tus intentos y compartir contexto útil. Los cambios
          se reflejan inmediatamente en el tablero público.
        </p>
        <form action={participantLogoutAction}>
          <button className="button button-secondary button-compact" type="submit">Cerrar sesión</button>
        </form>
      </div>

      <div className="workspace-list">
        {workspace.applications.map((application) => (
          <div className="workspace-grid" key={application.publicId}>
            <ApplicationEditor application={application} />
            <TipForm applicationPublicId={application.publicId} />
          </div>
        ))}
        <ApplicationEditor />
      </div>

      <section className="detail-panel" style={{ marginTop: "3rem" }}>
        <p className="eyebrow">Privacidad</p>
        <h2>Eliminar el registro</h2>
        <p>
          Si ya no quieres participar, puedes borrar definitivamente el perfil, todas
          las postulaciones y los consejos asociados.
        </p>
        <DeleteDataForm />
      </section>
    </div>
  );
}

