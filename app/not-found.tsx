import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="page-width page-content">
      <div className="empty-state">
        <Image src="/visuals/empty-filter.svg" alt="" width={180} height={150} />
        <div>
          <p className="eyebrow">404 · ruta sin registro</p>
          <h1>No encontramos esta postulación</h1>
          <p>Pudo haber sido eliminada, ocultada o el enlace está incompleto.</p>
          <Link className="button button-primary" href="/">Volver al tablero</Link>
        </div>
      </div>
    </div>
  );
}
