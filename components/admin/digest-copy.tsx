"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function DigestCopy({ digest }: { digest: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="detail-panel">
      <p className="eyebrow">Resumen WhatsApp</p>
      <h2>Actividad reciente</h2>
      <textarea className="textarea" readOnly value={digest} aria-label="Resumen listo para WhatsApp" />
      <button
        className="button button-secondary"
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(digest);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        }}
      >
        <Copy aria-hidden="true" size={16} />
        {copied ? "Copiado" : "Copiar resumen"}
      </button>
    </div>
  );
}

