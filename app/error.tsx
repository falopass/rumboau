"use client";

import Image from "next/image";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-width page-content">
      <div className="empty-state">
        <Image src="/visuals/empty-filter.svg" alt="" width={180} height={150} />
        <div>
          <p className="eyebrow">Interrupción temporal</p>
          <h1>No pudimos cargar el registro</h1>
          <p>Intenta nuevamente. Si el problema continúa, avisa a la administración.</p>
          <button className="button button-primary" type="button" onClick={reset}>Reintentar</button>
        </div>
      </div>
    </div>
  );
}
