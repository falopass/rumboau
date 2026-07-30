"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({ text, url }: { text: string; url: string }) {
  const [label, setLabel] = useState("Compartir");
  const share = async () => {
    const absoluteUrl = new URL(url, window.location.origin).toString();
    if (navigator.share) {
      await navigator.share({ title: "Rumbo AU", text, url: absoluteUrl });
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${absoluteUrl}`);
    setLabel("Copiado");
    window.setTimeout(() => setLabel("Compartir"), 1800);
  };
  return (
    <button className="button button-secondary" type="button" onClick={share}>
      <Share2 aria-hidden="true" size={17} />
      {label}
    </button>
  );
}

