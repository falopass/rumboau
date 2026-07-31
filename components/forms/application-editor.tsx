"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { adminSaveApplicationAction, saveApplicationAction } from "@/app/actions";
import {
  COMMON_DOCUMENTS,
  COUNTRY_OPTIONS,
  DOCUMENT_STATE_LABELS,
  STATUS_OPTIONS,
} from "@/lib/domain/constants";
import type { PublicApplication } from "@/lib/domain/types";
import { applicationSchema } from "@/lib/validation/schemas";

const editorSchema = applicationSchema.omit({ banks: true }).extend({
  banksText: z.string().trim().max(300),
});
type EditorValues = z.infer<typeof editorSchema>;

export function ApplicationEditor({
  application,
  adminMode = false,
}: {
  application?: PublicApplication;
  adminMode?: boolean;
}) {
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<EditorValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      originCountry: application?.originCountry ?? "Chile",
      applicationDate: application?.applicationDate ?? "",
      attemptNumber: application?.attemptNumber ?? 0,
      status: application?.status.slug ?? "waiting",
      publicNotes: application?.publicNotes ?? "",
      banksText: application?.banks.join(", ") ?? "",
      documents: application?.documents.map((document) => ({
        id: document.id,
        label: document.label,
        state: document.state,
        stateDate: document.stateDate ?? "",
        publicNote: document.publicNote ?? "",
      })) ?? [],
    },
  });
  const documents = useFieldArray({ control: form.control, name: "documents" });

  const submit = form.handleSubmit((values) => {
    setState(null);
    startTransition(async () => {
      const payload = {
        ...values,
        banks: values.banksText.split(",").map((value: string) => value.trim()).filter(Boolean),
      };
      const result =
        adminMode && application
          ? await adminSaveApplicationAction(payload, application.publicId)
          : await saveApplicationAction(payload, application?.publicId);
      setState(result);
    });
  });

  return (
    <form className="workspace-card" onSubmit={submit} noValidate>
      <div className="workspace-card-head">
        <div>
          <p className="eyebrow">{application ? `Intento ${application.attemptNumber}` : "Nuevo intento"}</p>
          <h2>{application ? "Editar postulación" : "Agregar otra postulación"}</h2>
        </div>
        {application ? <span className="detail-code">{application.publicId}</span> : null}
      </div>
      {state ? (
        <div className={state.ok ? "form-success" : "form-error"} role="status">
          {state.message}
        </div>
      ) : null}
      <div className="form-grid">
        <div className="field">
          <label>Fecha</label>
          <input className="input" type="date" {...form.register("applicationDate")} />
        </div>
        <div className="field">
          <label>País desde donde postulaste</label>
          <select className="select" {...form.register("originCountry")}>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Intento</label>
          <input
            className="input"
            type="number"
            min={0}
            max={20}
            step={1}
            inputMode="numeric"
            {...form.register("attemptNumber", { valueAsNumber: true })}
          />
        </div>
        <div className="field">
          <label>Estado</label>
          <select className="select" {...form.register("status")}>
            {STATUS_OPTIONS.map((status) => <option key={status.slug} value={status.slug}>{status.label}</option>)}
          </select>
        </div>
        <div className="field full">
          <label>Bancos para acreditar fondos</label>
          <input className="input" placeholder="Separados por comas" {...form.register("banksText")} />
        </div>
        <div className="field full">
          <label>Nota pública</label>
          <textarea className="textarea" {...form.register("publicNotes")} />
        </div>
      </div>
      <div>
        <h3>Documentos declarados</h3>
        <div className="repeat-list">
          {documents.fields.map((field, index) => (
            <div className="repeat-item" key={field.id}>
              <div className="field">
                <label>Documento</label>
                <input className="input" list="editor-document-options" {...form.register(`documents.${index}.label`)} />
              </div>
              <div className="field">
                <label>Estado</label>
                <select className="select" {...form.register(`documents.${index}.state`)}>
                  {Object.entries(DOCUMENT_STATE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <button
                className="button button-compact button-danger"
                type="button"
                onClick={() => documents.remove(index)}
                aria-label={`Eliminar documento ${index + 1}`}
              >
                <Trash2 aria-hidden="true" size={16} />
              </button>
            </div>
          ))}
        </div>
        <datalist id="editor-document-options">
          {COMMON_DOCUMENTS.map((document) => <option key={document} value={document} />)}
        </datalist>
        <button
          className="button button-secondary button-compact"
          type="button"
          onClick={() => documents.append({ label: "", state: "pending", stateDate: "", publicNote: "" })}
          style={{ marginTop: "0.75rem" }}
        >
          <Plus aria-hidden="true" size={16} /> Agregar documento
        </button>
      </div>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending
          ? "Guardando…"
          : adminMode
            ? "Guardar cambios como admin"
            : application
              ? "Guardar cambios"
              : "Agregar intento"}
      </button>
    </form>
  );
}
