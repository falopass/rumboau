import type { Metadata } from "next";
import Image from "next/image";
import { getRepository } from "@/lib/data/repository";
import { TIP_CATEGORY_LABELS } from "@/lib/domain/constants";
import { formatDate } from "@/lib/domain/format";

export const metadata: Metadata = { title: "Consejos comunitarios" };
export const dynamic = "force-dynamic";

export default async function TipsPage() {
  const tips = await getRepository().listPublicTips();
  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Aprendizajes compartidos</p>
        <h1>Consejos de la comunidad</h1>
        <p>
          Experiencias personales, no instrucciones oficiales. Verifica siempre los
          requisitos vigentes en los canales del Gobierno de Australia.
        </p>
      </div>
      <section className="guide-panel" aria-labelledby="guide-heading">
        <div>
          <p className="eyebrow">Checklist orientativo · fuente externa</p>
          <h2 id="guide-heading">Antes de enviar, revisa tu carpeta</h2>
          <p>
            La guía de Brújula y Tenedor, actualizada el 1 de julio de 2026,
            recomienda preparar estos documentos. Confirma siempre la versión
            vigente en Home Affairs antes de postular.
          </p>
        </div>
        <ul className="guide-grid">
          <li>Pasaporte vigente.</li>
          <li>Resultado aceptado de prueba de inglés.</li>
          <li>Prueba de solvencia con nombre, institución, monto y fecha.</li>
          <li>Título o certificado de estudios, con traducción cuando corresponda.</li>
          <li>Foto tipo pasaporte.</li>
          <li>Original y traducción de cada documento que lo requiera.</li>
        </ul>
        <div className="source-row">
          <a
            href="https://www.brujulaytenedor.com/2016/04/01/wh-australia/"
            target="_blank"
            rel="noreferrer"
          >
            Leer guía consultada ↗
          </a>
          <a
            href="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462"
            target="_blank"
            rel="noreferrer"
          >
            Verificar en Home Affairs ↗
          </a>
        </div>
      </section>
      {tips.length ? (
        <div className="tip-list">
          {tips.map((tip) => (
            <article className="tip-row" key={tip.id}>
              <div>
                <p className="eyebrow">{TIP_CATEGORY_LABELS[tip.category]}</p>
                <p>{tip.content}</p>
              </div>
              <time className="document-meta" dateTime={tip.createdAt}>{formatDate(tip.createdAt)}</time>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Image src="/visuals/empty-tips.svg" alt="" width={180} height={150} />
          <div>
            <h2>Aún no hay consejos</h2>
            <p>Las personas podrán publicarlos desde su área de edición.</p>
          </div>
        </div>
      )}
    </div>
  );
}
