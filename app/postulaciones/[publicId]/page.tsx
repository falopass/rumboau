import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import { buildShareText, formatDate, formatLongDate, daysSince } from "@/lib/domain/format";
import { DOCUMENT_STATE_LABELS, TIP_CATEGORY_LABELS } from "@/lib/domain/constants";
import { StatusBadge } from "@/components/status-badge";
import { ShareButton } from "@/components/share-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const application = await getRepository().getPublicApplication(publicId);
  return {
    title: application ? `${application.displayName} · ${application.status.label}` : "Postulación",
    robots: { index: false, follow: false },
  };
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const application = await getRepository().getPublicApplication(publicId);
  if (!application) notFound();
  const sent = application.documents.filter((document) => document.state === "sent").length;

  return (
    <div className="page-width page-content">
      <div className="detail-hero">
        <div>
          <p className="eyebrow">Postulación comunitaria · intento {application.attemptNumber}</p>
          <h1>{application.displayName}</h1>
          <p className="public-phone">
            {application.maskedPhone}
            {application.membershipVerified ? (
              <span className="verification-badge">Grupo verificado</span>
            ) : (
              <span className="verification-pending">Grupo por verificar</span>
            )}
          </p>
          <div className="button-row">
            <StatusBadge status={application.status} />
            <ShareButton
              text={buildShareText(application)}
              url={`/postulaciones/${application.publicId}`}
            />
            <Link
              className="button button-secondary"
              href={`/postulaciones/${application.publicId}/editar`}
            >
              Editar con contraseña
            </Link>
          </div>
        </div>
        {application.status.slug === "granted" ? (
          <Image
            className="granted-stamp"
            src="/visuals/granted-stamp.svg"
            alt="Estado granted declarado por la comunidad"
            width={132}
            height={132}
            loading="eager"
          />
        ) : (
          <span className="detail-code">{application.publicId}</span>
        )}
      </div>

      <dl className="facts">
        <div className="fact">
          <dt>Fecha de postulación</dt>
          <dd>{formatLongDate(application.applicationDate)}</dd>
        </div>
        <div className="fact">
          <dt>Postuló desde</dt>
          <dd>{application.originCountry}</dd>
        </div>
        <div className="fact">
          <dt>Tiempo transcurrido</dt>
          <dd>{daysSince(application.applicationDate)} días</dd>
        </div>
      </dl>

      <div className="detail-grid" style={{ marginTop: "2rem" }}>
        <div className="detail-stack">
          <section className="detail-panel">
            <p className="eyebrow">Registro de cambios</p>
            <h2>Línea de tiempo</h2>
            {application.events.length ? (
              <div className="timeline">
                {application.events.map((event) => (
                  <div className="timeline-item" key={event.id}>
                    <span className="timeline-dot" aria-hidden="true" />
                    <div className="timeline-content">
                      <p>{event.description}</p>
                      <time dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Aún no hay cambios públicos registrados.</p>
            )}
          </section>

          {application.publicNotes ? (
            <section className="detail-panel">
              <p className="eyebrow">Contexto compartido</p>
              <h2>Nota de la persona</h2>
              <p>{application.publicNotes}</p>
            </section>
          ) : null}

          <section className="detail-panel">
            <p className="eyebrow">Aprendizajes</p>
            <h2>Consejos asociados</h2>
            {application.tips.length ? (
              <div className="tip-list">
                {application.tips.map((tip) => (
                  <article className="tip-row" key={tip.id}>
                    <div>
                      <strong>{TIP_CATEGORY_LABELS[tip.category]}</strong>
                      <p>{tip.content}</p>
                    </div>
                    <time className="document-meta">{formatDate(tip.createdAt)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <p>Esta postulación todavía no tiene consejos públicos.</p>
            )}
          </section>
        </div>

        <aside className="detail-stack">
          <section className="detail-panel">
            <p className="eyebrow">Declaración pública</p>
            <h2>Documentos</h2>
            {application.documents.length ? (
              <div className="document-list">
                {application.documents.map((document) => (
                  <div className="document-row" key={document.id}>
                    <div>
                      <strong>{document.label}</strong>
                      {document.publicNote ? <p>{document.publicNote}</p> : null}
                    </div>
                    <span className="document-meta">
                      {DOCUMENT_STATE_LABELS[document.state]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <Image src="/visuals/empty-documents.svg" alt="" width={180} height={150} />
            )}
            <p className="document-meta">{sent} documento{sent === 1 ? "" : "s"} marcado{sent === 1 ? "" : "s"} como enviado{sent === 1 ? "" : "s"}.</p>
          </section>
          <section className="detail-panel">
            <p className="eyebrow">Acreditación de fondos</p>
            <h2>Bancos o instituciones</h2>
            {application.banks.length ? (
              <div className="mini-list">
                {application.banks.map((bank) => <span key={bank}>{bank}</span>)}
              </div>
            ) : (
              <p>Sin institución declarada.</p>
            )}
            <p className="document-meta">No se recopilan cuentas, saldos ni cartolas.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
