import { formatDate } from "@/lib/domain/format";
import type { PublicApplication } from "@/lib/domain/types";

export const COMMUNITY_GROUP_URL =
  "https://chat.whatsapp.com/BvIAXo2j31J9bzeUMaBPj2?mode=gi_t";

export function buildRegistrationAnnouncement(
  application: PublicApplication,
  publicUrl: string,
): string {
  return [
    "Hola, ya registré mi postulación en Rumbo AU.",
    "",
    `Nombre o alias: ${application.displayName}`,
    `Fecha de postulación: ${formatDate(application.applicationDate)}`,
    `Estado: ${application.status.label}`,
    `Intento: ${application.attemptNumber}`,
    `Teléfono visible: ${application.maskedPhone}`,
    "",
    `Ficha pública: ${publicUrl}`,
    "",
    "Cuando cambie mi estado, lo actualizaré en la misma ficha.",
  ].join("\n");
}
