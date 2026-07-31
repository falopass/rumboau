"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createParticipantAction } from "@/app/actions";
import {
  COMMON_DOCUMENTS,
  COUNTRY_OPTIONS,
  DOCUMENT_STATE_LABELS,
  STATUS_OPTIONS,
} from "@/lib/domain/constants";
import { createParticipantFieldsSchema } from "@/lib/validation/schemas";

const clientSchema = createParticipantFieldsSchema
  .omit({ banks: true })
  .extend({
    banksText: z.string().trim().max(300),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }
    if (!value.consent) {
      context.addIssue({
        code: "custom",
        path: ["consent"],
        message: "Debes aceptar que estos datos serán públicos.",
      });
    }
  });

type FormValues = z.infer<typeof clientSchema>;

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const CUSTOM_DOCUMENT_VALUE = "__custom__";

export function CreateParticipantForm() {
  const [state, setState] = useState<{ message: string; fieldErrors?: Record<string, string[] | undefined> } | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      displayName: "",
      phone: "",
      originCountry: "Chile",
      applicationDate: today,
      attemptNumber: 0,
      status: "waiting",
      publicNotes: "",
      banksText: "",
      documents: [
        {
          label: COMMON_DOCUMENTS[0],
          state: "sent",
          stateDate: today,
          publicNote: "",
        },
        {
          label: COMMON_DOCUMENTS[1],
          state: "sent",
          stateDate: today,
          publicNote: "",
        },
      ],
      password: "",
      confirmPassword: "",
      consent: false,
      website: "",
    },
  });
  const documents = useFieldArray({
    control: form.control,
    name: "documents",
  });

  const submit = form.handleSubmit((values) => {
    setState(null);
    startTransition(async () => {
      const result = await createParticipantAction({
        ...values,
        banks: values.banksText
          .split(",")
          .map((value: string) => value.trim())
          .filter(Boolean),
      });
      if (!result.ok) setState(result);
    });
  });

  return (
    <form className="form-sheet" onSubmit={submit} noValidate>
      {state ? <div className="form-error" role="alert">{state.message}</div> : null}
      <div className="form-section">
        <p className="eyebrow">01 · Identidad pública</p>
        <h2>¿Cómo quieres aparecer?</h2>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="display-name">Nombre visible o alias</label>
            <input
              className="input"
              id="display-name"
              autoComplete="nickname"
              placeholder="Ej. Vale C. o Cami Norte"
              {...form.register("displayName")}
            />
            <FieldError message={form.formState.errors.displayName?.message} />
          </div>
          <div className="field full">
            <label htmlFor="phone">Número usado en el grupo</label>
            <input
              className="input"
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={12}
              pattern="(?:9[0-9]{8}|\+569[0-9]{8})"
              placeholder="912345678 o +56912345678"
              {...form.register("phone")}
            />
            <p className="field-help">
              Usa 912345678 o +56912345678. Se guarda privado; en público
              aparecerá como +569XXXXX678.
            </p>
            <FieldError message={form.formState.errors.phone?.message} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <p className="eyebrow">02 · Postulación</p>
        <h2>Los datos que ordenan la espera</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="application-date">Fecha de postulación</label>
            <input
              className="input"
              id="application-date"
              type="date"
              max={today}
              {...form.register("applicationDate")}
            />
            <FieldError message={form.formState.errors.applicationDate?.message} />
          </div>
          <div className="field">
            <label htmlFor="origin-country">Postulaste desde</label>
            <select
              className="select"
              id="origin-country"
              {...form.register("originCountry")}
            >
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <FieldError message={form.formState.errors.originCountry?.message} />
          </div>
          <div className="field">
            <label htmlFor="attempt-number">Número de intento</label>
            <input
              className="input"
              id="attempt-number"
              type="number"
              min={0}
              max={20}
              step={1}
              inputMode="numeric"
              {...form.register("attemptNumber", { valueAsNumber: true })}
            />
          </div>
          <div className="field">
            <label htmlFor="status">Estado actual</label>
            <select className="select" id="status" {...form.register("status")}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.slug} value={status.slug}>{status.label}</option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="banks">Bancos o instituciones para acreditar fondos</label>
            <input
              className="input"
              id="banks"
              placeholder="Ej. BancoEstado, Wise"
              {...form.register("banksText")}
            />
            <span className="document-meta">Separa varios nombres con comas. Nunca escribas cuentas ni saldos.</span>
          </div>
          <div className="field full">
            <label htmlFor="public-notes">Nota pública opcional</label>
            <textarea
              className="textarea"
              id="public-notes"
              placeholder="Solo contexto útil para la comunidad; evita identificadores personales."
              {...form.register("publicNotes")}
            />
            <FieldError message={form.formState.errors.publicNotes?.message} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <p className="eyebrow">03 · Documentos declarados</p>
        <h2>¿Qué te solicitaron o enviaste?</h2>
        <div className="repeat-list">
          {documents.fields.map((document, index) => (
            <div className="repeat-item" key={document.id}>
              <div className="field document-picker">
                <label htmlFor={`document-${index}`}>Documento {index + 1}</label>
                <select
                  className="select"
                  id={`document-${index}`}
                  value={
                    COMMON_DOCUMENTS.includes(
                      form.watch(`documents.${index}.label`) as (typeof COMMON_DOCUMENTS)[number],
                    )
                      ? form.watch(`documents.${index}.label`)
                      : form.watch(`documents.${index}.label`)
                        ? CUSTOM_DOCUMENT_VALUE
                        : ""
                  }
                  onChange={(event) => {
                    form.setValue(
                      `documents.${index}.label`,
                      event.target.value,
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                >
                  <option value="">Selecciona un documento</option>
                  {COMMON_DOCUMENTS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value={CUSTOM_DOCUMENT_VALUE}>Otro documento…</option>
                </select>
                {form.watch(`documents.${index}.label`) === CUSTOM_DOCUMENT_VALUE ||
                (form.watch(`documents.${index}.label`) &&
                  !COMMON_DOCUMENTS.includes(
                    form.watch(`documents.${index}.label`) as (typeof COMMON_DOCUMENTS)[number],
                  )) ? (
                  <>
                    <label className="sr-only" htmlFor={`document-custom-${index}`}>
                      Nombre del documento {index + 1}
                    </label>
                    <input
                      className="input"
                      id={`document-custom-${index}`}
                      placeholder="Escribe el nombre del documento"
                      value={
                        form.watch(`documents.${index}.label`) === CUSTOM_DOCUMENT_VALUE
                          ? ""
                          : form.watch(`documents.${index}.label`)
                      }
                      onChange={(event) => {
                        form.setValue(
                          `documents.${index}.label`,
                          event.target.value || CUSTOM_DOCUMENT_VALUE,
                          { shouldDirty: true, shouldValidate: true },
                        );
                      }}
                    />
                  </>
                ) : null}
                <FieldError
                  message={form.formState.errors.documents?.[index]?.label?.message}
                />
              </div>
              <div className="field">
                <label htmlFor={`document-state-${index}`}>Estado</label>
                <select
                  className="select"
                  id={`document-state-${index}`}
                  {...form.register(`documents.${index}.state`)}
                >
                  {Object.entries(DOCUMENT_STATE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
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
        <button
          className="button button-secondary button-compact"
          type="button"
          onClick={() =>
            documents.append({
              label: "",
              state: "pending",
              stateDate: "",
              publicNote: "",
            })
          }
          style={{ marginTop: "0.8rem" }}
        >
          <Plus aria-hidden="true" size={16} />
          Agregar documento
        </button>
      </div>

      <div className="form-section">
        <p className="eyebrow">04 · Acceso privado</p>
        <h2>Protege la edición</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              className="input"
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <FieldError message={form.formState.errors.password?.message} />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Repite la contraseña</label>
            <input
              className="input"
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            <FieldError message={form.formState.errors.confirmPassword?.message} />
          </div>
          <label className="checkbox-row full">
            <input type="checkbox" {...form.register("consent")} />
            <span>
              Entiendo que mi alias, fechas, estado, bancos, documentos declarados,
              notas y consejos serán visibles públicamente.
            </span>
          </label>
          <FieldError message={form.formState.errors.consent?.message} />
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Sitio web</label>
            <input id="website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </div>
        </div>
      </div>

      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Publicar mi postulación"}
      </button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error">{message}</span> : null;
}
