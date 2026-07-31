import { hashPassword } from "@/lib/security/passwords";
import { createPublicId } from "@/lib/security/tokens";
import { sortBoardApplications } from "@/lib/domain/board";
import { maskPhone, normalizeName } from "@/lib/domain/format";
import { STATUSES } from "@/lib/domain/constants";
import type {
  AdminNote,
  AdminOverview,
  ApplicationWriteInput,
  BoardFilters,
  BoardResult,
  CreateParticipantInput,
  DataRepository,
  PasswordIdentity,
  ParticipantWorkspace,
  PublicApplication,
  PublicDocument,
  PublicEvent,
  PublicTip,
  ResetTokenRecord,
  TipCategory,
} from "@/lib/domain/types";

interface DemoParticipant {
  id: string;
  publicId: string;
  displayName: string;
  normalizedName: string;
  phoneE164: string;
  membershipVerified: boolean;
  passwordHash: string;
  passwordVersion: number;
}

interface DemoApplication extends PublicApplication {
  participantId: string;
  visible: boolean;
}

const participants = new Map<string, DemoParticipant>();
const applications = new Map<string, DemoApplication>();
const resetTokens = new Map<string, { participantId: string; expiresAt: string; used: boolean }>();
const adminNotes = new Map<string, AdminNote[]>();
let initializationPromise: Promise<void> | null = null;

const seedProfiles = [
  {
    name: "Josefa",
    date: "2026-04-01",
    origin: "Chile",
    attempt: 1,
    status: "granted" as const,
    banks: ["BancoEstado"],
    notes: "Actualicé antecedentes y el cambio quedó reflejado dos días después.",
    grantedDate: "2026-04-21",
  },
  {
    name: "Cami Norte",
    date: "2026-04-03",
    origin: "Chile",
    attempt: 1,
    status: "waiting" as const,
    banks: ["Banco de Chile", "Wise"],
    notes: "Postulación individual desde Chile.",
  },
  {
    name: "Nico F.",
    date: "2026-04-05",
    origin: "Canadá",
    attempt: 1,
    status: "information_requested" as const,
    banks: ["Scotiabank"],
    notes: "Me solicitaron información adicional. Sin datos sensibles en esta nota.",
  },
  {
    name: "Fran R.",
    date: "2026-04-10",
    origin: "Chile",
    attempt: 2,
    status: "documents_sent" as const,
    banks: ["Santander"],
    notes: null,
  },
  {
    name: "Vale C.",
    date: "2026-05-02",
    origin: "Nueva Zelanda",
    attempt: 1,
    status: "waiting" as const,
    banks: ["Wise"],
    notes: "Esperando respuesta, sin solicitudes nuevas.",
  },
  {
    name: "Tomás P.",
    date: "2026-05-18",
    origin: "Chile",
    attempt: 1,
    status: "granted" as const,
    banks: ["BCI"],
    notes: "Marqué el estado apenas recibí la notificación.",
    grantedDate: "2026-06-13",
  },
  {
    name: "Paz Austral",
    date: "2026-06-07",
    origin: "Australia",
    attempt: 2,
    status: "waiting" as const,
    banks: ["BancoEstado", "Wise"],
    notes: null,
  },
  {
    name: "Anto S.",
    date: "2026-06-21",
    origin: "Chile",
    attempt: 1,
    status: "withdrawn" as const,
    banks: ["Banco Falabella"],
    notes: "Proceso retirado por decisión personal.",
  },
];

async function initializeDemoData() {
  const passwordHash = await hashPassword("rumbo-demo-2026");
  const now = new Date().toISOString();

  for (const [index, seed] of seedProfiles.entries()) {
    const participantId = `demo-participant-${index + 1}`;
    const participantPublicId = `person_demo_${index + 1}`;
    const applicationId = `demo-application-${index + 1}`;
    const applicationPublicId = `app_demo_${index + 1}`;
    participants.set(participantId, {
      id: participantId,
      publicId: participantPublicId,
      displayName: seed.name,
      normalizedName: normalizeName(seed.name),
      phoneE164: `+569${String(10_000_001 + index)}`,
      membershipVerified: true,
      passwordHash,
      passwordVersion: 1,
    });

    const documents: PublicDocument[] = [
      {
        id: `${applicationId}-passport`,
        label: "Pasaporte",
        state: "sent",
        stateDate: seed.date,
        publicNote: null,
      },
      {
        id: `${applicationId}-funds`,
        label: "Comprobante de fondos",
        state: seed.status === "information_requested" ? "requested" : "sent",
        stateDate: seed.date,
        publicNote: null,
      },
    ];
    const events: PublicEvent[] = [
      {
        id: `${applicationId}-event`,
        type: "application_created",
        description: "Postulación agregada al tablero.",
        createdAt: `${seed.date}T15:00:00.000Z`,
      },
    ];
    const tips: PublicTip[] =
      index === 0
        ? [
            {
              id: `${applicationId}-tip`,
              category: "process",
              content: "Anota cada cambio con fecha; ayuda mucho cuando revisas tu propia línea de tiempo.",
              createdAt: now,
            },
          ]
        : [];

    applications.set(applicationPublicId, {
      id: applicationId,
      publicId: applicationPublicId,
      participantId,
      displayName: seed.name,
      maskedPhone: maskPhone(`+569${String(10_000_001 + index)}`),
      membershipVerified: true,
      originCountry: seed.origin,
      applicationDate: seed.date,
      grantedAt: "grantedDate" in seed ? (seed.grantedDate ?? null) : null,
      attemptNumber: seed.attempt,
      status: STATUSES[seed.status],
      publicNotes: seed.notes,
      banks: seed.banks,
      documents,
      tips,
      events,
      createdAt: `${seed.date}T15:00:00.000Z`,
      updatedAt: now,
      visible: true,
    });
  }
}

async function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = initializeDemoData().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  await initializationPromise;
}

function cloneApplication(application: DemoApplication): PublicApplication {
  const { visible: _visible, ...publicApplication } = structuredClone(application);
  void _visible;
  return publicApplication;
}

function filterApplications(rows: DemoApplication[], filters: BoardFilters): DemoApplication[] {
  const query = normalizeName(filters.query ?? "");
  return rows.filter((application) => {
    if (!application.visible) return false;
    if (query && !normalizeName(application.displayName).includes(query)) return false;
    if (filters.status && application.status.slug !== filters.status) return false;
    if (filters.dateFrom && application.applicationDate < filters.dateFrom) return false;
    if (filters.dateTo && application.applicationDate > filters.dateTo) return false;
    if (filters.origin && application.originCountry !== filters.origin) return false;
    if (filters.attempt && application.attemptNumber !== filters.attempt) return false;
    if (filters.bank && !application.banks.includes(filters.bank)) return false;
    if (filters.document && !application.documents.some((item) => item.state === filters.document)) {
      return false;
    }
    if (filters.hasNotes && !application.publicNotes && application.tips.length === 0) return false;
    return true;
  });
}

function workspaceFor(participant: DemoParticipant): ParticipantWorkspace {
  return {
    participantId: participant.id,
    participantPublicId: participant.publicId,
    displayName: participant.displayName,
    passwordVersion: participant.passwordVersion,
    applications: [...applications.values()]
      .filter((application) => application.participantId === participant.id)
      .sort((a, b) => a.attemptNumber - b.attemptNumber)
      .map(cloneApplication),
  };
}

function makeApplication(
  participant: DemoParticipant,
  input: ApplicationWriteInput,
): DemoApplication {
  const now = new Date().toISOString();
  const publicId = createPublicId("app");
  return {
    id: createPublicId("demo"),
    publicId,
    participantId: participant.id,
    displayName: participant.displayName,
    maskedPhone: maskPhone(participant.phoneE164),
    membershipVerified: participant.membershipVerified,
    originCountry: input.originCountry,
    applicationDate: input.applicationDate,
    grantedAt: input.status === "granted" ? now.slice(0, 10) : null,
    attemptNumber: input.attemptNumber,
    status: STATUSES[input.status],
    publicNotes: input.publicNotes || null,
    banks: [...new Set(input.banks)],
    documents: input.documents.map((document) => ({
      id: document.id ?? createPublicId("doc"),
      label: document.label,
      state: document.state,
      stateDate: document.stateDate || null,
      publicNote: document.publicNote || null,
    })),
    tips: [],
    events: [
      {
        id: createPublicId("event"),
        type: "application_created",
        description: "Postulación agregada al tablero.",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
    visible: true,
  };
}

export const demoRepository: DataRepository = {
  async listPublicApplications(filters: BoardFilters): Promise<BoardResult> {
    await ensureInitialized();
    const allVisible = [...applications.values()].filter((application) => application.visible);
    const filtered = sortBoardApplications(
      filterApplications(allVisible, filters),
      filters.sort,
      filters.direction,
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * filters.pageSize;
    return {
      applications: filtered.slice(start, start + filters.pageSize).map(cloneApplication),
      total: filtered.length,
      page,
      pageSize: filters.pageSize,
      availableOrigins: [...new Set(allVisible.map((item) => item.originCountry))].sort(),
      availableBanks: [...new Set(allVisible.flatMap((item) => item.banks))].sort(),
    };
  },

  async getPublicApplication(publicId) {
    await ensureInitialized();
    const application = applications.get(publicId);
    return application?.visible ? cloneApplication(application) : null;
  },

  async listPublicTips() {
    await ensureInitialized();
    return [...applications.values()]
      .filter((application) => application.visible)
      .flatMap((application) => application.tips)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createParticipant(input: CreateParticipantInput) {
    await ensureInitialized();
    const participant: DemoParticipant = {
      id: createPublicId("participant"),
      publicId: createPublicId("person"),
      displayName: input.displayName,
      normalizedName: normalizeName(input.displayName),
      phoneE164: input.phoneE164,
      membershipVerified: false,
      passwordHash: input.passwordHash,
      passwordVersion: 1,
    };
    participants.set(participant.id, participant);
    const application = makeApplication(participant, input);
    applications.set(application.publicId, application);
    return workspaceFor(participant);
  },

  async findPasswordIdentity(applicationPublicId): Promise<PasswordIdentity | null> {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application) return null;
    const participant = participants.get(application.participantId);
    if (!participant) return null;
    return {
      participantId: participant.id,
      participantPublicId: participant.publicId,
      passwordHash: participant.passwordHash,
      passwordVersion: participant.passwordVersion,
    };
  },

  async getWorkspace(participantId) {
    await ensureInitialized();
    const participant = participants.get(participantId);
    return participant ? workspaceFor(participant) : null;
  },

  async createApplication(participantId, input) {
    await ensureInitialized();
    const participant = participants.get(participantId);
    if (!participant) throw new Error("Participante no encontrado.");
    if (
      [...applications.values()].some(
        (application) =>
          application.participantId === participantId &&
          application.attemptNumber === input.attemptNumber,
      )
    ) {
      throw new Error("Ya existe una postulación con ese número de intento.");
    }
    const application = makeApplication(participant, input);
    applications.set(application.publicId, application);
    return cloneApplication(application);
  },

  async updateApplication(participantId, applicationPublicId, input) {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application || application.participantId !== participantId) {
      throw new Error("No tienes permiso para editar esta postulación.");
    }
    const previousStatus = application.status.slug;
    application.originCountry = input.originCountry;
    application.applicationDate = input.applicationDate;
    application.attemptNumber = input.attemptNumber;
    application.status = STATUSES[input.status];
    if (input.status === "granted" && previousStatus !== "granted") {
      application.grantedAt = new Date().toISOString().slice(0, 10);
    } else if (input.status !== "granted") {
      application.grantedAt = null;
    }
    application.publicNotes = input.publicNotes || null;
    application.banks = [...new Set(input.banks)];
    application.documents = input.documents.map((document) => ({
      id: document.id ?? createPublicId("doc"),
      label: document.label,
      state: document.state,
      stateDate: document.stateDate || null,
      publicNote: document.publicNote || null,
    }));
    application.updatedAt = new Date().toISOString();
    application.events.unshift({
      id: createPublicId("event"),
      type: previousStatus === input.status ? "application_updated" : "status_changed",
      description:
        previousStatus === input.status
          ? "Información de la postulación actualizada."
          : "Estado actualizado por la persona postulante.",
      createdAt: application.updatedAt,
    });
    return cloneApplication(application);
  },

  async adminUpdateApplication(applicationPublicId, input) {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application) throw new Error("Postulación no encontrada.");
    return demoRepository.updateApplication(application.participantId, applicationPublicId, input);
  },

  async addTip(participantId, applicationPublicId, category: TipCategory, content: string) {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application || application.participantId !== participantId) {
      throw new Error("No tienes permiso para agregar consejos aquí.");
    }
    application.tips.unshift({
      id: createPublicId("tip"),
      category,
      content,
      createdAt: new Date().toISOString(),
    });
  },

  async deleteParticipant(participantId) {
    await ensureInitialized();
    participants.delete(participantId);
    for (const [key, application] of applications.entries()) {
      if (application.participantId === participantId) applications.delete(key);
    }
  },

  async listAdminOverview(): Promise<AdminOverview> {
    await ensureInitialized();
    const all = [...applications.values()];
    const duplicateMap = new Map<string, DemoApplication[]>();
    for (const application of all) {
      const key = `${normalizeName(application.displayName)}|${application.applicationDate}|${application.originCountry}|${application.attemptNumber}`;
      const group = duplicateMap.get(key) ?? [];
      group.push(application);
      duplicateMap.set(key, group);
    }
    return {
      applications: all.map((application) => ({
        ...cloneApplication(application),
        participantPhone: participants.get(application.participantId)?.phoneE164,
        isPublic: application.visible,
      })),
      hiddenApplications: all.filter((application) => !application.visible).length,
      duplicateGroups: [...duplicateMap.entries()]
        .filter(([, group]) => group.length > 1)
        .map(([key, group]) => ({
          key,
          applications: group.map((application) => ({
            publicId: application.publicId,
            displayName: application.displayName,
            applicationDate: application.applicationDate,
          })),
        })),
    };
  },

  async setApplicationVisibility(applicationPublicId, visible) {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application) throw new Error("Postulación no encontrada.");
    application.visible = visible;
  },

  async setMembershipVerified(applicationPublicId, verified) {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application) throw new Error("Postulación no encontrada.");
    const participant = participants.get(application.participantId);
    if (!participant) throw new Error("Participante no encontrado.");
    participant.membershipVerified = verified;
    for (const item of applications.values()) {
      if (item.participantId === participant.id) item.membershipVerified = verified;
    }
  },

  async getAdminNotes(applicationPublicId) {
    await ensureInitialized();
    return structuredClone(adminNotes.get(applicationPublicId) ?? []);
  },

  async addAdminNote(applicationPublicId, content, adminId) {
    await ensureInitialized();
    if (!applications.has(applicationPublicId)) throw new Error("Postulación no encontrada.");
    const notes = adminNotes.get(applicationPublicId) ?? [];
    notes.unshift({
      id: createPublicId("note"),
      content,
      authorLabel: adminId === "demo-admin" ? "Admin demo" : "Administración",
      createdAt: new Date().toISOString(),
    });
    adminNotes.set(applicationPublicId, notes);
  },

  async setTipVisibility(tipId, visible) {
    await ensureInitialized();
    for (const application of applications.values()) {
      const tipIndex = application.tips.findIndex((tip) => tip.id === tipId);
      if (tipIndex >= 0 && !visible) {
        application.tips.splice(tipIndex, 1);
        return;
      }
    }
  },

  async createPasswordReset(applicationPublicId, tokenHash, _adminId, expiresAt) {
    await ensureInitialized();
    const application = applications.get(applicationPublicId);
    if (!application) throw new Error("Postulación no encontrada.");
    resetTokens.set(tokenHash, {
      participantId: application.participantId,
      expiresAt,
      used: false,
    });
  },

  async consumePasswordReset(tokenHash, newPasswordHash): Promise<ResetTokenRecord> {
    await ensureInitialized();
    const reset = resetTokens.get(tokenHash);
    if (!reset || reset.used || reset.expiresAt < new Date().toISOString()) {
      throw new Error("El enlace de recuperación es inválido o venció.");
    }
    const participant = participants.get(reset.participantId);
    if (!participant) throw new Error("Participante no encontrado.");
    reset.used = true;
    participant.passwordHash = newPasswordHash;
    participant.passwordVersion += 1;
    return {
      participantId: participant.id,
      passwordVersion: participant.passwordVersion,
    };
  },

  async isAdmin(userId) {
    return userId === "demo-admin";
  },

  async exportPublicRows() {
    await ensureInitialized();
    return [...applications.values()]
      .filter((application) => application.visible)
      .map(cloneApplication);
  },
};

export const DEMO_PARTICIPANT_PASSWORD = "rumbo-demo-2026";
export const DEMO_ADMIN_EMAIL = "admin@rumbo.local";
export const DEMO_ADMIN_PASSWORD = "rumbo-admin-demo";
