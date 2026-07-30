import Link from "next/link";
import { Brand } from "./brand";
import { isDemoMode } from "@/lib/data/repository";
import { COMMUNITY_GROUP_URL } from "@/lib/domain/community";

export function SiteHeader() {
  return (
    <>
      {isDemoMode() ? (
        <div className="demo-banner">
          Modo demostración · datos ficticios · clave participante: rumbo-demo-2026
        </div>
      ) : null}
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="site-nav" aria-label="Navegación principal">
            <Link className="nav-link" href="/consejos">
              Consejos
            </Link>
            <Link className="nav-link" href="/mi-registro">
              Mi registro
            </Link>
            <Link className="nav-link nav-primary" href="/postulaciones/nueva">
              Agregar postulación
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width footer-grid">
        <p>
          Rumbo AU organiza datos compartidos por la comunidad. No pertenece al
          Gobierno de Australia y no entrega asesoría migratoria ni predicciones.
        </p>
        <div className="footer-actions">
          <a href={COMMUNITY_GROUP_URL} target="_blank" rel="noreferrer">
            Ir al grupo de WhatsApp
          </a>
          <Link href="/admin/login">Administración</Link>
        </div>
      </div>
    </footer>
  );
}
