import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/security/admin-session";
import { getRepository } from "@/lib/data/repository";
import { formatDate, getCurrentTimestamp } from "@/lib/domain/format";
import { StatusBadge } from "@/components/status-badge";
import { AdminControls } from "@/components/admin/admin-controls";
import { DigestCopy } from "@/components/admin/digest-copy";
import { adminLogoutAction } from "@/app/actions";

export const metadata: Metadata = { title: "Administración" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  const overview = await getRepository().listAdminOverview();
  const now = await getCurrentTimestamp();
  const lastWeek = overview.applications
    .filter((application) => now - new Date(application.updatedAt).getTime() < 7 * 86_400_000)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const digest = [
    "Rumbo AU · resumen comunitario",
    ...lastWeek.slice(0, 15).map(
      (application) =>
        `• ${application.displayName}: ${application.status.label} · ${formatDate(application.applicationDate)} · intento ${application.attemptNumber}`,
    ),
    "",
    "Datos declarados por la comunidad; no son información oficial.",
  ].join("\n");

  return (
    <div className="page-width page-content">
      <div className="page-heading">
        <p className="eyebrow">Sesión · {admin.email}</p>
        <h1>Administración</h1>
        <p>Moderación, recuperación y exportación sin exponer contraseñas ni tokens.</p>
        <div className="button-row">
          <a className="button button-primary" href="/api/admin/export">Exportar CSV</a>
          <form action={adminLogoutAction}>
            <button className="button button-secondary" type="submit">Cerrar sesión</button>
          </form>
        </div>
      </div>

      <div className="metrics-strip">
        <div className="metric">
          <strong className="metric-value">{overview.applications.length}</strong>
          <span className="metric-label">postulaciones totales</span>
        </div>
        <div className="metric">
          <strong className="metric-value">{overview.applications.filter((item) => item.status.slug === "waiting").length}</strong>
          <span className="metric-label">esperando respuesta</span>
        </div>
        <div className="metric">
          <strong className="metric-value">{overview.hiddenApplications}</strong>
          <span className="metric-label">ocultas por moderación</span>
        </div>
        <div className="metric">
          <strong className="metric-value">{overview.duplicateGroups.length}</strong>
          <span className="metric-label">posibles duplicados</span>
        </div>
      </div>

      {overview.duplicateGroups.length ? (
        <section className="detail-panel admin-duplicates" aria-labelledby="duplicate-heading">
          <p className="eyebrow">Revisión no bloqueante</p>
          <h2 id="duplicate-heading">Posibles registros duplicados</h2>
          <p className="document-meta">
            Coincidencias por nombre normalizado, origen, fecha e intento. Revisa antes de ocultar.
          </p>
          <div className="duplicate-grid">
            {overview.duplicateGroups.map((group) => (
              <article className="duplicate-group" key={group.key}>
                {group.applications.map((application) => (
                  <Link
                    href={`/admin/postulaciones/${application.publicId}`}
                    key={application.publicId}
                  >
                    <strong>{application.displayName}</strong>
                    <span>{formatDate(application.applicationDate)}</span>
                  </Link>
                ))}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="detail-grid">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Grupo</th>
                <th>Banco</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {overview.applications.map((application) => (
                <tr key={application.publicId}>
                  <td>
                    <Link href={`/admin/postulaciones/${application.publicId}`}>
                      <strong>{application.displayName}</strong>
                    </Link>
                    <div className="document-meta">Intento {application.attemptNumber}</div>
                  </td>
                  <td>{formatDate(application.applicationDate)}</td>
                  <td><StatusBadge status={application.status} /></td>
                  <td>{application.membershipVerified ? "Verificado" : "Pendiente"}</td>
                  <td>{application.banks.join(", ") || "—"}</td>
                  <td>
                    <AdminControls
                      applicationPublicId={application.publicId}
                      isPublic={application.isPublic !== false}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DigestCopy digest={digest} />
      </div>
    </div>
  );
}
