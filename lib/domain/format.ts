import type { BoardFilters, PublicApplication } from "./types";

const SANTIAGO_TIMEZONE = "America/Santiago";

export async function getCurrentTimestamp(): Promise<number> {
  return Date.now();
}

export function formatDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(`${date.slice(0, 10)}T12:00:00Z`) : date;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: SANTIAGO_TIMEZONE,
  }).format(value);
}

export function formatLongDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(`${date.slice(0, 10)}T12:00:00Z`) : date;
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: SANTIAGO_TIMEZONE,
  }).format(value);
}

export function daysSince(date: string, now = new Date()): number {
  const start = new Date(`${date.slice(0, 10)}T12:00:00Z`).getTime();
  const end = now.getTime();
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate.slice(0, 10)}T12:00:00Z`).getTime();
  const end = new Date(`${endDate.slice(0, 10)}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function normalizeChilePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) return `+56${digits}`;
  if (digits.length === 11 && digits.startsWith("56")) return `+${digits}`;
  return `+${digits}`;
}

export function maskPhone(value: string): string {
  const normalized = normalizeChilePhone(value);
  if (!/^\+569\d{8}$/.test(normalized)) return "Número privado";
  return `${normalized.slice(0, 4)}XXXXX${normalized.slice(-3)}`;
}

export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseBoardFilters(
  params: Record<string, string | string[] | undefined>,
): BoardFilters {
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const page = Number(first("page") ?? "1");
  const attempt = Number(first("attempt") ?? "");
  const status = first("status");
  const document = first("document");
  const sort = first("sort");
  const direction = first("dir");

  return {
    query: first("q")?.trim() || undefined,
    status:
      status &&
      [
        "waiting",
        "information_requested",
        "documents_sent",
        "granted",
        "rejected",
        "withdrawn",
      ].includes(status)
        ? (status as BoardFilters["status"])
        : undefined,
    dateFrom: first("from") || undefined,
    dateTo: first("to") || undefined,
    origin: first("origin") || undefined,
    attempt: Number.isInteger(attempt) && attempt > 0 ? attempt : undefined,
    bank: first("bank") || undefined,
    document:
      document && ["requested", "pending", "sent"].includes(document)
        ? (document as BoardFilters["document"])
        : undefined,
    hasNotes: first("notes") === "true" ? true : undefined,
    sort:
      sort && ["date", "person", "status", "documents", "wait"].includes(sort)
        ? (sort as BoardFilters["sort"])
        : "date",
    direction: direction === "desc" ? "desc" : "asc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: 20,
  };
}

export function buildShareText(application: PublicApplication): string {
  const documentsSent = application.documents.filter((item) => item.state === "sent").length;
  const bankText = application.banks.length
    ? `Fondos: ${application.banks.join(", ")}.`
    : "Sin banco declarado.";

  return [
    `Rumbo AU · ${application.displayName}`,
    `${application.maskedPhone}${application.membershipVerified ? " · grupo verificado" : ""}.`,
    `${application.status.label} · Postulación ${formatDate(application.applicationDate)} · intento ${application.attemptNumber}.`,
    `${bankText} ${documentsSent} documento${documentsSent === 1 ? "" : "s"} marcado${documentsSent === 1 ? "" : "s"} como enviado${documentsSent === 1 ? "" : "s"}.`,
    "Dato compartido por la comunidad; no es información oficial.",
  ].join("\n");
}

export function toCsv(rows: PublicApplication[]): string {
  const escape = (value: string | number) => {
    const stringValue = String(value);
    return `"${stringValue.replaceAll('"', '""')}"`;
  };

  const header = [
    "Nombre visible",
    "Fecha de postulación",
    "Origen",
    "Intento",
    "Estado",
    "Bancos",
    "Documentos enviados",
    "Última actualización",
  ];

  const body = rows.map((row) => [
    row.displayName,
    row.applicationDate,
    row.originCountry,
    row.attemptNumber,
    row.status.label,
    row.banks.join(" | "),
    row.documents.filter((document) => document.state === "sent").map((document) => document.label).join(" | "),
    row.updatedAt,
  ]);

  return [header, ...body].map((line) => line.map(escape).join(",")).join("\r\n");
}
