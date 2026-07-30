import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/security/admin-session";
import { getRepository } from "@/lib/data/repository";
import { formatDate } from "@/lib/domain/format";
import { AdminControls } from "@/components/admin/admin-controls";
import { AdminNoteForm } from "@/components/admin/admin-note-form";
import { AdminTipControls } from "@/components/admin/admin-tip-controls";
import { MembershipControl } from "@/components/admin/membership-control";

export const dynamic = "force-dynamic";

export default async function AdminApplicationPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const { publicId } = await params;
  const overview = await getRepository().listAdminOverview();
  const application = overview.applications.find((item) => item.publicId === publicId);
  if (!application) notFound();
  const notes = await getRepository().getAdminNotes(publicId);

  return (
    <div className="page-width page-content">
      <div className="detail-hero">
        <div>
          <p className="eyebrow">Ficha administrativa</p>
          <h1>{application.displayName}</h1>
          <p>{formatDate(application.applicationDate)} · intento {application.attemptNumber}</p>
        </div>
        <AdminControls applicationPublicId={publicId} isPublic={application.isPublic !== false} />
      </div>
      <div className="detail-grid">
        <section className="detail-panel">
          <p className="eyebrow">Datos públicos</p>
          <h2>Resumen</h2>
          <p><strong>Estado:</strong> {application.status.label}</p>
          <p><strong>Origen:</strong> {application.originCountry}</p>
          <p><strong>Teléfono privado:</strong> {application.participantPhone || "No registrado"}</p>
          <MembershipControl
            applicationPublicId={publicId}
            initialVerified={application.membershipVerified}
          />
          <p><strong>Bancos:</strong> {application.banks.join(", ") || "No declarados"}</p>
          <p><strong>Nota:</strong> {application.publicNotes || "Sin nota pública"}</p>
          <a href={`/postulaciones/${publicId}`} target="_blank" rel="noreferrer">Abrir ficha pública ↗</a>
          {application.tips.length ? (
            <div className="tip-list admin-tip-list">
              <h3>Consejos publicados</h3>
              {application.tips.map((tip) => (
                <article className="tip-row" key={tip.id}>
                  <div>
                    <p>{tip.content}</p>
                    <span className="document-meta">{tip.category}</span>
                  </div>
                  <AdminTipControls tipId={tip.id} />
                </article>
              ))}
            </div>
          ) : null}
        </section>
        <section className="detail-panel">
          <p className="eyebrow">Solo administración</p>
          <h2>Notas internas</h2>
          <AdminNoteForm applicationPublicId={publicId} />
          <div className="tip-list" style={{ marginTop: "1rem" }}>
            {notes.map((note) => (
              <article className="tip-row" key={note.id}>
                <div><p>{note.content}</p><span className="document-meta">{note.authorLabel}</span></div>
                <time className="document-meta">{formatDate(note.createdAt)}</time>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
