import { Search } from "lucide-react";
import { DOCUMENT_STATE_LABELS, STATUS_OPTIONS } from "@/lib/domain/constants";
import type { BoardFilters } from "@/lib/domain/types";

export function BoardFilters({
  filters,
  origins,
  banks,
}: {
  filters: BoardFilters;
  origins: string[];
  banks: string[];
}) {
  const advancedFilterCount = [
    filters.origin,
    filters.attempt,
    filters.dateFrom,
    filters.dateTo,
    filters.bank,
    filters.document,
    filters.hasNotes,
  ].filter(Boolean).length;

  return (
    <form className="filters" method="get" aria-label="Filtrar postulaciones">
      <div className="field search-field">
        <label htmlFor="filter-search">Nombre o alias</label>
        <input
          className="input"
          id="filter-search"
          name="q"
          defaultValue={filters.query}
          placeholder="Buscar en el tablero"
        />
      </div>
      <div className="field">
        <label htmlFor="filter-status">Estado</label>
        <select className="select" id="filter-status" name="status" defaultValue={filters.status}>
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status.slug} value={status.slug}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mobile-sort-controls">
        <div className="field">
          <label htmlFor="filter-sort">Ordenar por</label>
          <select className="select" id="filter-sort" name="sort" defaultValue={filters.sort}>
            <option value="date">Fecha</option>
            <option value="person">Persona</option>
            <option value="status">Estado</option>
            <option value="documents">Documentos enviados</option>
            <option value="wait">Días de espera</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filter-direction">Dirección</label>
          <select
            className="select"
            id="filter-direction"
            name="dir"
            defaultValue={filters.direction}
          >
            <option value="asc">Ascendente · A–Z / menor a mayor</option>
            <option value="desc">Descendente · Z–A / mayor a menor</option>
          </select>
        </div>
      </div>
      <button className="button button-primary" type="submit">
        <Search aria-hidden="true" size={17} />
        Filtrar
      </button>

      <details className="advanced-filters" open={advancedFilterCount > 0}>
        <summary>
          <span>Más filtros</span>
          <span className="advanced-filter-count">
            {advancedFilterCount
              ? `${advancedFilterCount} ${advancedFilterCount === 1 ? "activo" : "activos"}`
              : "Origen, fechas, banco y documentos"}
          </span>
        </summary>
        <div className="advanced-filters-grid">
          <div className="field">
            <label htmlFor="filter-origin">Desde</label>
            <select className="select" id="filter-origin" name="origin" defaultValue={filters.origin}>
              <option value="">Cualquier país</option>
              {origins.map((origin) => (
                <option key={origin} value={origin}>
                  {origin}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-attempt">Intento</label>
            <select
              className="select"
              id="filter-attempt"
              name="attempt"
              defaultValue={filters.attempt?.toString()}
            >
              <option value="">Todos</option>
              {[1, 2, 3, 4].map((attempt) => (
                <option key={attempt} value={attempt}>
                  {attempt}°
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-from">Desde fecha</label>
            <input
              className="input"
              id="filter-from"
              name="from"
              type="date"
              defaultValue={filters.dateFrom}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-to">Hasta fecha</label>
            <input
              className="input"
              id="filter-to"
              name="to"
              type="date"
              defaultValue={filters.dateTo}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-bank">Banco fondos</label>
            <select className="select" id="filter-bank" name="bank" defaultValue={filters.bank}>
              <option value="">Todos</option>
              {banks.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-document">Documento</label>
            <select
              className="select"
              id="filter-document"
              name="document"
              defaultValue={filters.document}
            >
              <option value="">Cualquier estado</option>
              {Object.entries(DOCUMENT_STATE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filter-notes">Contenido</label>
            <select
              className="select"
              id="filter-notes"
              name="notes"
              defaultValue={filters.hasNotes ? "true" : ""}
            >
              <option value="">Con o sin notas</option>
              <option value="true">Con notas o consejos</option>
            </select>
          </div>
        </div>
      </details>
    </form>
  );
}
