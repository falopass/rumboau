import Link from "next/link";
import Image from "next/image";
import { BoardFilters } from "@/components/board-filters";
import { ApplicationRow } from "@/components/application-row";
import { getRepository } from "@/lib/data/repository";
import { daysBetween, parseBoardFilters } from "@/lib/domain/format";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseBoardFilters(params);
  const board = await getRepository().listPublicApplications(filters);
  const fullBoard = await getRepository().listPublicApplications({
    page: 1,
    pageSize: 1000,
  });
  const grantedDurations = fullBoard.applications.flatMap((item) =>
    item.status.slug === "granted" && item.grantedAt
      ? [daysBetween(item.applicationDate, item.grantedAt)]
      : [],
  );
  const averageGrantedDays = grantedDurations.length
    ? Math.round(
        grantedDurations.reduce((total, duration) => total + duration, 0) /
          grantedDurations.length,
      )
    : null;
  const metrics = {
    total: fullBoard.total,
    waiting: fullBoard.applications.filter((item) =>
      ["waiting", "information_requested", "documents_sent"].includes(item.status.slug),
    ).length,
    granted: fullBoard.applications.filter((item) => item.status.slug === "granted").length,
  };
  const totalPages = Math.max(1, Math.ceil(board.total / board.pageSize));
  const queryString = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      value === undefined
        ? []
        : [[key, Array.isArray(value) ? value[0] : value] as [string, string]],
    ),
  );

  const pageHref = (page: number) => {
    const nextParams = new URLSearchParams(queryString);
    nextParams.set("page", String(page));
    return `/?${nextParams.toString()}#tablero`;
  };

  return (
    <>
      <section className="hero">
        <div className="page-width hero-grid">
          <div>
            <p className="eyebrow">Working Holiday Australia · comunidad Chile</p>
            <h1>
              La espera, <em>puesta en orden.</em>
            </h1>
            <p className="hero-copy">
              Fechas, estados, documentos declarados y consejos en un solo registro
              comunitario. Sin editar el mismo mensaje de WhatsApp una y otra vez.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/postulaciones/nueva">
                Agregar mi postulación
              </Link>
              <a className="button button-secondary" href="#tablero">
                Ver cómo van
              </a>
            </div>
          </div>
          <div className="route-visual">
            <picture>
              <source media="(max-width: 700px)" srcSet="/visuals/hero-editorial-mobile.webp" />
              <source type="image/avif" srcSet="/visuals/hero-editorial.avif" />
              <Image
                className="hero-raster"
                src="/visuals/hero-editorial.webp"
                alt="Ruta visual entre Chile y Australia junto a documentos revisados"
                width={800}
                height={400}
                priority
              />
            </picture>
            <span className="route-caption">CL · 33.45° S → AU · 33.86° S</span>
          </div>
        </div>
      </section>

      <section className="page-width board-section" id="tablero">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Registro comunitario</p>
            <h2>Postulaciones en curso</h2>
            <p>
              Información declarada por cada persona. No es una fuente oficial ni
              permite anticipar una resolución.
            </p>
          </div>
          <Link className="button button-secondary" href="/consejos">
            Leer consejos
          </Link>
        </div>

        <div className="metrics-strip" aria-label="Resumen del tablero">
          <div className="metric">
            <strong className="metric-value">{metrics.total}</strong>
            <span className="metric-label">postulaciones visibles</span>
          </div>
          <div className="metric">
            <strong className="metric-value">{metrics.waiting}</strong>
            <span className="metric-label">esperando o respondiendo</span>
          </div>
          <div className="metric">
            <strong className="metric-value">{metrics.granted}</strong>
            <span className="metric-label">marcadas como granted</span>
          </div>
          <div className="metric">
            <strong className="metric-value">
              {averageGrantedDays === null ? "—" : averageGrantedDays}
            </strong>
            <span className="metric-label">
              {averageGrantedDays === null
                ? "aún sin promedio granted"
                : `días promedio · ${grantedDurations.length} granted`}
            </span>
          </div>
        </div>

        <BoardFilters
          filters={filters}
          origins={board.availableOrigins}
          banks={board.availableBanks}
        />

        {board.applications.length ? (
          <div className="ledger">
            <div className="ledger-head" aria-hidden="true">
              <span>Fecha</span>
              <span>Persona</span>
              <span>Estado</span>
              <span>Fondos y docs.</span>
              <span>Espera</span>
              <span />
            </div>
            {board.applications.map((application) => (
              <ApplicationRow key={application.publicId} application={application} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Image src="/visuals/empty-filter.svg" alt="" width={180} height={150} />
            <div>
              <h3>No encontramos coincidencias</h3>
              <p>Prueba quitando un filtro o ampliando el rango de fechas.</p>
              <Link className="button button-secondary" href="/#tablero">
                Limpiar filtros
              </Link>
            </div>
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="pagination" aria-label="Paginación">
            {board.page > 1 ? (
              <Link className="button button-compact" href={pageHref(board.page - 1)}>
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            <span>
              Página {board.page} de {totalPages}
            </span>
            {board.page < totalPages ? (
              <Link className="button button-compact" href={pageHref(board.page + 1)}>
                Siguiente →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </section>
    </>
  );
}
