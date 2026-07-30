import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import { getParticipantSession } from "@/lib/security/participant-session";
import { ParticipantLoginForm } from "@/components/forms/participant-login-form";

export const metadata: Metadata = { title: "Editar postulación" };
export const dynamic = "force-dynamic";

export default async function EditAccessPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const application = await getRepository().getPublicApplication(publicId);
  if (!application) notFound();
  const session = await getParticipantSession();
  if (session) {
    const workspace = await getRepository().getWorkspace(session.participantId);
    if (workspace?.applications.some((item) => item.publicId === publicId)) {
      redirect("/mi-registro");
    }
  }

  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Editar · {application.displayName}</p>
        <h1>Tu registro está protegido</h1>
        <p>
          La visualización es pública, pero solo la contraseña de la persona permite
          modificar sus datos.
        </p>
      </div>
      <div className="form-layout">
        <ParticipantLoginForm applicationPublicId={publicId} />
        <aside className="side-note">
          <h2>¿Olvidaste la contraseña?</h2>
          <p>
            Contacta a una persona administradora del grupo. Podrá generar un enlace
            de un solo uso sin conocer tu contraseña nueva.
          </p>
          <Link href={`/postulaciones/${publicId}`}>Volver a la ficha pública</Link>
        </aside>
      </div>
    </div>
  );
}

