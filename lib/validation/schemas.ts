import { z } from "zod";
import { DOCUMENT_STATES, STATUS_SLUGS, TIP_CATEGORIES } from "@/lib/domain/types";

const todayInSantiago = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const safePublicText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar ${max} caracteres.`)
    .refine(
      (value) => !/\b(?:rut|pasaporte|cuenta|account)\b[^\d\n]{0,24}\d{5,}/i.test(value),
      `No incluyas RUT, pasaporte ni números de cuenta en ${label.toLocaleLowerCase("es-CL")}.`,
    );

export const documentSchema = z.object({
  id: z.string().optional(),
  label: safePublicText("Documento", 80)
    .min(2, "Escribe el nombre del documento.")
    .refine(
      (value) => value !== "__custom__",
      "Escribe el nombre del documento personalizado.",
    ),
  state: z.enum(DOCUMENT_STATES),
  stateDate: z.string().date().optional().or(z.literal("")),
  publicNote: safePublicText("Nota del documento", 220).optional().or(z.literal("")),
});

export const applicationSchema = z.object({
  originCountry: z.string().trim().min(2, "Selecciona o escribe el país de origen.").max(60),
  applicationDate: z
    .string()
    .date("Ingresa una fecha válida.")
    .refine((value) => value <= todayInSantiago(), "La fecha no puede estar en el futuro."),
  attemptNumber: z.number().int().min(1).max(20),
  status: z.enum(STATUS_SLUGS),
  publicNotes: safePublicText("Nota pública", 1000).optional().or(z.literal("")),
  banks: z.array(z.string().trim().min(2).max(80)).max(8),
  documents: z.array(documentSchema).max(20),
});

export const createParticipantFieldsSchema = applicationSchema.extend({
  displayName: safePublicText("Nombre visible", 60).min(
    2,
    "Elige un nombre visible o alias.",
  ),
  phone: z
    .string()
    .trim()
    .max(12, "El número puede tener como máximo 12 caracteres.")
    .regex(
      /^(?:9\d{8}|\+569\d{8})$/,
      "Ingresa el número como 912345678 o +56912345678.",
    ),
  password: z
    .string()
    .min(10, "Usa al menos 10 caracteres.")
    .max(72, "La contraseña no puede superar 72 caracteres."),
  confirmPassword: z.string(),
  consent: z.boolean(),
  website: z.string().max(0, "No se pudo enviar el formulario.").optional(),
});

export const createParticipantSchema = createParticipantFieldsSchema.superRefine((value, context) => {
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

export const participantLoginSchema = z.object({
  applicationPublicId: z.string().min(6).max(40),
  password: z.string().min(1, "Ingresa tu contraseña.").max(72),
  website: z.string().max(0).optional(),
});

export const tipSchema = z.object({
  applicationPublicId: z.string().min(6).max(40),
  category: z.enum(TIP_CATEGORIES),
  content: safePublicText("Consejo", 600).min(8, "Escribe un consejo un poco más completo."),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(10).max(72),
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden.",
      });
    }
  });

export const adminLoginSchema = z.object({
  email: z.email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});
