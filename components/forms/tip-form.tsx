"use client";

import { useState, useTransition } from "react";
import { addTipAction } from "@/app/actions";
import { TIP_CATEGORY_LABELS } from "@/lib/domain/constants";
import type { TipCategory } from "@/lib/domain/types";

export function TipForm({ applicationPublicId }: { applicationPublicId: string }) {
  const [category, setCategory] = useState<TipCategory>("general");
  const [content, setContent] = useState("");
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="detail-panel"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await addTipAction({ applicationPublicId, category, content });
          setState(result);
          if (result.ok) setContent("");
        });
      }}
    >
      <h2>Compartir un consejo</h2>
      {state ? <div className={state.ok ? "form-success" : "form-error"}>{state.message}</div> : null}
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`tip-category-${applicationPublicId}`}>Categoría</label>
          <select
            className="select"
            id={`tip-category-${applicationPublicId}`}
            value={category}
            onChange={(event) => setCategory(event.target.value as TipCategory)}
          >
            {Object.entries(TIP_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor={`tip-content-${applicationPublicId}`}>Consejo público</label>
          <textarea
            className="textarea"
            id={`tip-content-${applicationPublicId}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </div>
      </div>
      <button className="button button-secondary" disabled={pending} type="submit">
        {pending ? "Publicando…" : "Publicar consejo"}
      </button>
    </form>
  );
}

