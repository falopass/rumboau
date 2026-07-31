import Link from "next/link";
import Image from "next/image";
import { BoardFilters } from "@/components/board-filters";
import { ApplicationRow } from "@/components/application-row";
import { getRepository } from "@/lib/data/repository";
import { getPaginationItems } from "@/lib/domain/board";
import { daysBetween, parseBoardFilters } from "@/lib/domain/format";
import type { BoardSortKey } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const COUNTRY_CAP_SOURCE =
  "https://immi.homeaffairs.gov.au/what-we-do/whm-program/status-of-country-caps";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseBoardFilters(params);
  const board = await getRepository().listPublicApplications(filters);
  const fullBoard = await getRepository().listPublicApplications({
    sort: "date",
    direction: "asc",
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

  const nextSortDirection = (sort: BoardSortKey) =>
    filters.sort === sort
      ? filters.direction === "asc"
        ? "desc"
        : "asc"
      : sort === "person" || sort === "status"
        ? "asc"
        : "desc";

  const sortHref = (sort: BoardSortKey) => {
    const nextParams = new URLSearchParams(queryString);
    const direction = nextSortDirection(sort);
    nextParams.set("sort", sort);
    nextParams.set("dir", direction);
    nextParams.set("page", "1");
    return `/?${nextParams.toString()}#tablero`;
  };

  const sortLabel = (sort: BoardSortKey, label: string) => {
    const nextDirection = nextSortDirection(sort) === "asc" ? "ascendente" : "descendente";
    return `Ordenar ${label} de forma ${nextDirection}`;
  };

  const sortIndicator = (sort: BoardSortKey) =>
    filters.sort === sort ? (filters.direction === "asc" ? "↑" : "↓") : "↕";

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
              <source media="(max-width: 700px)" srcSet="/visuals/hero-editorial-mobile.png" />
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

      <div className="page-width cap-notice-wrap">
        <aside className="cap-notice" aria-labelledby="cap-notice-title">
          <div className="cap-notice-status">
            <span className="cap-notice-label">Chile · cupo 462</span>
            <strong>
              <span aria-hidden="true" />
              Pausado
            </strong>
            <span>3.400 cupos anuales</span>
          </div>
          <div className="cap-notice-body">
            <p className="eyebrow">Actualización importante</p>
            <h2 id="cap-notice-title">
              Las nuevas postulaciones están temporalmente pausadas
            </h2>
            <p>
              Home Affairs indica que una pausa puede utilizarse para distribuir
              las postulaciones durante el año o monitorear el límite anual. No
              significa que el cupo esté cerrado: un estado pausado puede volver
              a abrir durante el mismo año de programa.
            </p>
            <p className="cap-notice-guidance">
              <strong>¿Ya postulaste?</strong> Este aviso no reemplaza el estado
              individual de tu solicitud. Revisa cualquier cambio o solicitud de
              información directamente en ImmiAccount.
            </p>
            <div className="cap-notice-meta">
              <span>
                Estado oficial consultado el{" "}
                <time dateTime="2026-07-30">30/07/2026</time>. Puede cambiar.
              </span>
              <a href={COUNTRY_CAP_SOURCE} target="_blank" rel="noreferrer">
                Revisar estado oficial <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </aside>
      </div>

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
            <div className="ledger-head">
              <Link
                aria-label={sortLabel("date", "por fecha")}
                className={filters.sort === "date" ? "sort-link sort-link-active" : "sort-link"}
                href={sortHref("date")}
              >
                Fecha <span aria-hidden="true">{sortIndicator("date")}</span>
              </Link>
              <Link
                aria-label={sortLabel("person", "por persona")}
                className={filters.sort === "person" ? "sort-link sort-link-active" : "sort-link"}
                href={sortHref("person")}
              >
                Persona <span aria-hidden="true">{sortIndicator("person")}</span>
              </Link>
              <Link
                aria-label={sortLabel("status", "por estado")}
                className={filters.sort === "status" ? "sort-link sort-link-active" : "sort-link"}
                href={sortHref("status")}
              >
                Estado <span aria-hidden="true">{sortIndicator("status")}</span>
              </Link>
              <Link
                aria-label={sortLabel("documents", "por documentos enviados")}
                className={
                  filters.sort === "documents" ? "sort-link sort-link-active" : "sort-link"
                }
                href={sortHref("documents")}
              >
                Fondos y docs. <span aria-hidden="true">{sortIndicator("documents")}</span>
              </Link>
              <Link
                aria-label={sortLabel("wait", "por días de espera")}
                className={filters.sort === "wait" ? "sort-link sort-link-active" : "sort-link"}
                href={sortHref("wait")}
              >
                Espera <span aria-hidden="true">{sortIndicator("wait")}</span>
              </Link>
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
            <Link
              aria-disabled={board.page === 1}
              className="pagination-direction"
              href={board.page === 1 ? pageHref(1) : pageHref(board.page - 1)}
              tabIndex={board.page === 1 ? -1 : undefined}
            >
              <span aria-hidden="true">←</span> Anterior
            </Link>
            <div className="pagination-pages">
              {getPaginationItems(board.page, totalPages).map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    aria-hidden="true"
                    className="pagination-ellipsis"
                    key={`ellipsis-${index}`}
                  >
                    …
                  </span>
                ) : (
                  <Link
                    aria-current={item === board.page ? "page" : undefined}
                    aria-label={`Página ${item}`}
                    className="pagination-page"
                    href={pageHref(item)}
                    key={item}
                  >
                    {item}
                  </Link>
                ),
              )}
            </div>
            <Link
              aria-disabled={board.page === totalPages}
              className="pagination-direction"
              href={board.page === totalPages ? pageHref(totalPages) : pageHref(board.page + 1)}
              tabIndex={board.page === totalPages ? -1 : undefined}
            >
              Siguiente <span aria-hidden="true">→</span>
            </Link>
            <span className="sr-only">
              Página {board.page} de {totalPages}
            </span>
          </nav>
        ) : null}
      </section>
    </>
  );
}
