import { describe, expect, it } from "vitest";
import {
  buildShareText,
  daysBetween,
  maskPhone,
  normalizeChilePhone,
  normalizeName,
  parseBoardFilters,
  toCsv,
} from "@/lib/domain/format";
import { STATUSES } from "@/lib/domain/constants";
import {
  buildRegistrationAnnouncement,
  COMMUNITY_GROUP_URL,
} from "@/lib/domain/community";
import { createParticipantSchema } from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import type { PublicApplication } from "@/lib/domain/types";

const application: PublicApplication = {
  id: "app-id",
  publicId: "app_public",
  displayName: "Vale C.",
  maskedPhone: "+569XXXXX678",
  membershipVerified: true,
  originCountry: "Chile",
  applicationDate: "2026-04-10",
  grantedAt: null,
  attemptNumber: 1,
  status: STATUSES.waiting,
  publicNotes: null,
  banks: ["BancoEstado"],
  documents: [
    {
      id: "doc-id",
      label: "Pasaporte",
      state: "sent",
      stateDate: "2026-04-10",
      publicNote: null,
    },
  ],
  tips: [],
  events: [],
  createdAt: "2026-04-10T12:00:00.000Z",
  updatedAt: "2026-04-10T12:00:00.000Z",
};

describe("domain helpers", () => {
  it("normalizes names without accents or punctuation", () => {
    expect(normalizeName("  Antónia S. ")).toBe("antonia s");
  });

  it("normalizes and masks Chilean mobile numbers", () => {
    expect(normalizeChilePhone("9 1234 5678")).toBe("+56912345678");
    expect(maskPhone("+56912345678")).toBe("+569XXXXX678");
  });

  it("counts full elapsed days between application and granted", () => {
    expect(daysBetween("2026-04-01", "2026-04-21")).toBe(20);
  });

  it("builds a registration announcement using only essential public fields", () => {
    const text = buildRegistrationAnnouncement(
      {
        ...application,
        publicNotes: "Nota que no debe aparecer",
        banks: ["Banco de prueba"],
      },
      "https://rumboau.vercel.app/postulaciones/app_public",
    );

    expect(text).toContain("Vale C.");
    expect(text).toContain("+569XXXXX678");
    expect(text).toContain("Ficha pública:");
    expect(text).not.toContain("Nota que no debe aparecer");
    expect(text).not.toContain("Banco de prueba");
    expect(COMMUNITY_GROUP_URL).toMatch(/^https:\/\/chat\.whatsapp\.com\//);
  });

  it("parses safe board filters and ignores unsupported values", () => {
    expect(
      parseBoardFilters({
        status: "granted",
        attempt: "2",
        page: "-1",
        document: "sent",
      }),
    ).toMatchObject({
      status: "granted",
      attempt: 2,
      page: 1,
      document: "sent",
    });
  });

  it("builds a compact WhatsApp summary without sensitive fields", () => {
    const text = buildShareText(application);
    expect(text).toContain("Vale C.");
    expect(text).toContain("BancoEstado");
    expect(text).toContain("no es información oficial");
  });

  it("escapes CSV values", () => {
    const csv = toCsv([{ ...application, displayName: 'Vale, "C."' }]);
    expect(csv).toContain('"Vale, ""C."""');
  });
});

describe("validation and passwords", () => {
  it("rejects public notes that appear to include sensitive identifiers", () => {
    const result = createParticipantSchema.safeParse({
      displayName: "Vale C.",
      password: "una-clave-segura",
      confirmPassword: "una-clave-segura",
      consent: true,
      originCountry: "Chile",
      applicationDate: "2026-04-10",
      attemptNumber: 1,
      status: "waiting",
      publicNotes: "Mi pasaporte número 123456789",
      banks: [],
      documents: [],
      website: "",
    });
    expect(result.success).toBe(false);
  });

  it("hashes and verifies passwords with Argon2id", async () => {
    const passwordHash = await hashPassword("rumbo-password-segura");
    expect(passwordHash).not.toContain("rumbo-password-segura");
    await expect(verifyPassword(passwordHash, "rumbo-password-segura")).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, "incorrecta")).resolves.toBe(false);
  });
});
