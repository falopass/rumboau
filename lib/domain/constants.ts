import type { ApplicationStatus, DocumentState, StatusSlug, TipCategory } from "./types";

export const STATUSES: Record<StatusSlug, ApplicationStatus> = {
  waiting: { slug: "waiting", label: "Esperando respuesta", tone: "waiting" },
  information_requested: {
    slug: "information_requested",
    label: "Información solicitada",
    tone: "action",
  },
  documents_sent: {
    slug: "documents_sent",
    label: "Documentos enviados",
    tone: "action",
  },
  granted: { slug: "granted", label: "Granted", tone: "success" },
  rejected: { slug: "rejected", label: "Rechazada", tone: "danger" },
  withdrawn: { slug: "withdrawn", label: "Retirada", tone: "muted" },
};

export const STATUS_OPTIONS = Object.values(STATUSES);

export const DOCUMENT_STATE_LABELS: Record<DocumentState, string> = {
  requested: "Solicitado",
  pending: "Pendiente",
  sent: "Enviado",
};

export const TIP_CATEGORY_LABELS: Record<TipCategory, string> = {
  process: "Proceso",
  documents: "Documentos",
  banks: "Bancos",
  general: "General",
};

export const COMMON_BANKS = [
  "BancoEstado",
  "Banco de Chile",
  "Santander",
  "BCI",
  "Scotiabank",
  "Itaú",
  "Banco Falabella",
  "MACH",
  "Tenpo",
  "Wise",
] as const;

export const COMMON_DOCUMENTS = [
  "Pasaporte",
  "Resultado de prueba de inglés",
  "Comprobante de fondos",
  "Título o certificado de estudios",
  "Foto tipo pasaporte",
  "Certificado de antecedentes",
  "Examen médico",
  "Información adicional",
] as const;

export const COUNTRY_OPTIONS = [
  "Chile",
  "Australia",
  "Canadá",
  "Nueva Zelanda",
  "España",
  "Alemania",
  "Francia",
  "Reino Unido",
  "Otro",
] as const;
