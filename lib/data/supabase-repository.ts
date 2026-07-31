import { STATUSES } from "@/lib/domain/constants";
import { sortBoardApplications } from "@/lib/domain/board";
import { normalizeName } from "@/lib/domain/format";
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
  PublicTip,
  ResetTokenRecord,
  TipCategory,
} from "@/lib/domain/types";
import { createPublicId } from "@/lib/security/tokens";
import {
  createSupabasePublicClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/clients";

interface PublicViewRow {
  id: string;
  public_id: string;
  display_name: string;
  masked_phone: string;
  membership_verified: boolean;
  origin_country: string;
  application_date: string;
  granted_at: string | null;
  attempt_number: number;
  status_slug: keyof typeof STATUSES;
  status_label: string;
  status_tone: "waiting" | "action" | "success" | "danger" | "muted";
  public_notes: string | null;
  created_at: string;
  updated_at: string;
  banks: string[];
  documents: Array<{
    id: string;
    label: string;
    state: PublicDocument["state"];
    stateDate: string | null;
    publicNote: string | null;
  }>;
  tips: Array<{
    id: string;
    category: PublicTip["category"];
    content: string;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

interface PrivateApplicationRow extends PublicViewRow {
  participant_id: string;
  is_public: boolean;
  participant: {
    display_name: string;
    phone_e164: string | null;
    membership_verified: boolean;
  };
}

function mapRow(row: PublicViewRow): PublicApplication {
  return {
    id: row.id,
    publicId: row.public_id,
    displayName: row.display_name,
    maskedPhone: row.masked_phone,
    membershipVerified: row.membership_verified,
    originCountry: row.origin_country,
    applicationDate: row.application_date,
    grantedAt: row.granted_at,
    attemptNumber: row.attempt_number,
    status: {
      slug: row.status_slug,
      label: row.status_label,
      tone: row.status_tone,
    },
    publicNotes: row.public_notes,
    banks: Array.isArray(row.banks) ? row.banks : [],
    documents: Array.isArray(row.documents) ? row.documents : [],
    tips: Array.isArray(row.tips) ? row.tips : [],
    events: Array.isArray(row.events) ? row.events : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadPublicView(): Promise<PublicApplication[]> {
  const client = createSupabasePublicClient();
  const { data, error } = await client
    .from("public_application_board")
    .select("*")
    .order("application_date", { ascending: true })
    .limit(1000);
  if (error) throw new Error(`No se pudo cargar el tablero: ${error.message}`);
  return ((data ?? []) as unknown as PublicViewRow[]).map(mapRow);
}

function matchesFilters(application: PublicApplication, filters: BoardFilters): boolean {
  const query = normalizeName(filters.query ?? "");
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
}

async function loadPrivateApplications(includeHidden = true): Promise<PrivateApplicationRow[]> {
  const client = createSupabaseServiceClient();
  let query = client
    .from("applications")
    .select(`
      id,
      public_id,
      participant_id,
      origin_country,
      application_date,
      granted_at,
      attempt_number,
      status_slug,
      public_notes,
      is_public,
      created_at,
      updated_at,
      participant:participants!inner(display_name,phone_e164,membership_verified),
      status:application_statuses!inner(label,tone),
      documents:application_documents(id,label,state,state_date,public_note),
      funds:application_funds_sources(bank:banks(name)),
      tips:community_tips(id,category,content,created_at,moderation_status),
      events:application_events(id,event_type,description,created_at,visible_public)
    `)
    .is("deleted_at", null)
    .order("application_date", { ascending: true })
    .limit(1000);
  if (!includeHidden) query = query.eq("is_public", true);
  const { data, error } = await query;
  if (error) throw new Error(`No se pudieron cargar las postulaciones: ${error.message}`);

  return (data ?? []).map((raw) => {
    const row = raw as unknown as {
      id: string;
      public_id: string;
      participant_id: string;
      origin_country: string;
      application_date: string;
      granted_at: string | null;
      attempt_number: number;
      status_slug: keyof typeof STATUSES;
      public_notes: string | null;
      is_public: boolean;
      created_at: string;
      updated_at: string;
      participant: {
        display_name: string;
        phone_e164: string | null;
        membership_verified: boolean;
      };
      status: { label: string; tone: PublicViewRow["status_tone"] };
      documents: Array<{
        id: string;
        label: string;
        state: PublicDocument["state"];
        state_date: string | null;
        public_note: string | null;
      }>;
      funds: Array<{ bank: { name: string } }>;
      tips: Array<{
        id: string;
        category: PublicTip["category"];
        content: string;
        created_at: string;
        moderation_status: string;
      }>;
      events: Array<{
        id: string;
        event_type: string;
        description: string;
        created_at: string;
        visible_public: boolean;
      }>;
    };
    return {
      id: row.id,
      public_id: row.public_id,
      participant_id: row.participant_id,
      participant: row.participant,
      display_name: row.participant.display_name,
      masked_phone: row.participant.phone_e164
        ? `${row.participant.phone_e164.slice(0, 4)}XXXXX${row.participant.phone_e164.slice(-3)}`
        : "Número privado",
      membership_verified: row.participant.membership_verified,
      origin_country: row.origin_country,
      application_date: row.application_date,
      granted_at: row.granted_at,
      attempt_number: row.attempt_number,
      status_slug: row.status_slug,
      status_label: row.status.label,
      status_tone: row.status.tone,
      public_notes: row.public_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_public: row.is_public,
      banks: row.funds.map((item) => item.bank.name),
      documents: row.documents.map((document) => ({
        id: document.id,
        label: document.label,
        state: document.state,
        stateDate: document.state_date,
        publicNote: document.public_note,
      })),
      tips: row.tips
        .filter((tip) => tip.moderation_status === "visible")
        .map((tip) => ({
          id: tip.id,
          category: tip.category,
          content: tip.content,
          createdAt: tip.created_at,
        })),
      events: row.events
        .filter((event) => event.visible_public)
        .map((event) => ({
          id: event.id,
          type: event.event_type,
          description: event.description,
          createdAt: event.created_at,
        })),
    };
  });
}

async function replaceAndFetch(
  participantId: string,
  input: ApplicationWriteInput,
  applicationPublicId?: string,
): Promise<PublicApplication> {
  const client = createSupabaseServiceClient();
  const publicId = applicationPublicId ?? createPublicId("app");
  const rpc = applicationPublicId ? "update_application_owned" : "create_application_owned";
  const { error } = await client.rpc(rpc, {
    p_participant_id: participantId,
    p_application_public_id: publicId,
    p_origin_country: input.originCountry,
    p_application_date: input.applicationDate,
    p_attempt_number: input.attemptNumber,
    p_status_slug: input.status,
    p_public_notes: input.publicNotes ?? "",
    p_banks: input.banks,
    p_documents: input.documents,
  });
  if (error) throw new Error(`No se pudo guardar la postulación: ${error.message}`);
  const applications = await loadPrivateApplications(true);
  const found = applications.find((application) => application.public_id === publicId);
  if (!found) throw new Error("La postulación se guardó, pero no pudo recargarse.");
  return { ...mapRow(found), participantId: found.participant_id };
}

export const supabaseRepository: DataRepository = {
  async listPublicApplications(filters: BoardFilters): Promise<BoardResult> {
    const rows = await loadPublicView();
    const filtered = sortBoardApplications(
      rows.filter((application) => matchesFilters(application, filters)),
      filters.sort,
      filters.direction,
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / filters.pageSize));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * filters.pageSize;
    return {
      applications: filtered.slice(start, start + filters.pageSize),
      total: filtered.length,
      page,
      pageSize: filters.pageSize,
      availableOrigins: [...new Set(rows.map((item) => item.originCountry))].sort(),
      availableBanks: [...new Set(rows.flatMap((item) => item.banks))].sort(),
    };
  },

  async getPublicApplication(publicId) {
    const rows = await loadPublicView();
    return rows.find((row) => row.publicId === publicId) ?? null;
  },

  async listPublicTips() {
    return (await loadPublicView())
      .flatMap((application) => application.tips)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createParticipant(input: CreateParticipantInput) {
    const client = createSupabaseServiceClient();
    const participantPublicId = createPublicId("person");
    const applicationPublicId = createPublicId("app");
    const { data, error } = await client.rpc("create_participant_application", {
      p_participant_public_id: participantPublicId,
      p_application_public_id: applicationPublicId,
      p_display_name: input.displayName,
      p_normalized_name: normalizeName(input.displayName),
      p_phone_e164: input.phoneE164,
      p_password_hash: input.passwordHash,
      p_consent_at: input.consentAt,
      p_origin_country: input.originCountry,
      p_application_date: input.applicationDate,
      p_attempt_number: input.attemptNumber,
      p_status_slug: input.status,
      p_public_notes: input.publicNotes ?? "",
      p_banks: input.banks,
      p_documents: input.documents,
    });
    if (error) throw new Error(`No se pudo crear el registro: ${error.message}`);
    const result = (data?.[0] ?? null) as
      | { participant_id: string; application_id: string }
      | null;
    if (!result) throw new Error("Supabase no devolvió el registro creado.");
    const workspace = await this.getWorkspace(result.participant_id);
    if (!workspace) throw new Error("No se pudo cargar el registro recién creado.");
    return workspace;
  },

  async findPasswordIdentity(applicationPublicId): Promise<PasswordIdentity | null> {
    const client = createSupabaseServiceClient();
    const { data, error } = await client
      .from("applications")
      .select("participant:participants!inner(id,public_id,password_hash,password_version)")
      .eq("public_id", applicationPublicId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(`No se pudo verificar el acceso: ${error.message}`);
    if (!data) return null;
    const participant = (data as unknown as {
      participant: {
        id: string;
        public_id: string;
        password_hash: string;
        password_version: number;
      };
    }).participant;
    return {
      participantId: participant.id,
      participantPublicId: participant.public_id,
      passwordHash: participant.password_hash,
      passwordVersion: participant.password_version,
    };
  },

  async getWorkspace(participantId): Promise<ParticipantWorkspace | null> {
    const client = createSupabaseServiceClient();
    const { data, error } = await client
      .from("participants")
      .select("id,public_id,display_name,password_version")
      .eq("id", participantId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`);
    if (!data) return null;
    const rows = await loadPrivateApplications(true);
    const participant = data as {
      id: string;
      public_id: string;
      display_name: string;
      password_version: number;
    };
    return {
      participantId: participant.id,
      participantPublicId: participant.public_id,
      displayName: participant.display_name,
      passwordVersion: participant.password_version,
      applications: rows
        .filter((row) => row.participant_id === participantId)
        .map((row) => ({ ...mapRow(row), participantId })),
    };
  },

  createApplication(participantId, input) {
    return replaceAndFetch(participantId, input);
  },

  updateApplication(participantId, applicationPublicId, input) {
    return replaceAndFetch(participantId, input, applicationPublicId);
  },

  async adminUpdateApplication(applicationPublicId, input, adminId) {
    const client = createSupabaseServiceClient();
    const { data: application, error: lookupError } = await client
      .from("applications")
      .select("id,participant_id")
      .eq("public_id", applicationPublicId)
      .maybeSingle();
    if (lookupError || !application) throw new Error("Postulación no encontrada.");

    const updated = await replaceAndFetch(
      application.participant_id,
      input,
      applicationPublicId,
    );
    const { error: auditError } = await client.from("admin_audit_log").insert({
      admin_id: adminId,
      action: "application_updated",
      entity_type: "application",
      entity_id: application.id,
      metadata: { source: "admin_panel" },
    });
    if (auditError) {
      throw new Error(`Cambio aplicado, pero falló la auditoría: ${auditError.message}`);
    }
    return updated;
  },

  async addTip(participantId, applicationPublicId, category: TipCategory, content: string) {
    const client = createSupabaseServiceClient();
    const { data: application, error: lookupError } = await client
      .from("applications")
      .select("id")
      .eq("public_id", applicationPublicId)
      .eq("participant_id", participantId)
      .maybeSingle();
    if (lookupError || !application) throw new Error("No tienes permiso para agregar consejos aquí.");
    const { error } = await client.from("community_tips").insert({
      participant_id: participantId,
      application_id: application.id,
      category,
      content,
    });
    if (error) throw new Error(`No se pudo publicar el consejo: ${error.message}`);
  },

  async deleteParticipant(participantId) {
    const client = createSupabaseServiceClient();
    const { error } = await client.from("participants").delete().eq("id", participantId);
    if (error) throw new Error(`No se pudieron eliminar los datos: ${error.message}`);
  },

  async listAdminOverview(): Promise<AdminOverview> {
    const rows = await loadPrivateApplications(true);
    const mapped = rows.map((row) => ({
      ...mapRow(row),
      participantId: row.participant_id,
      participantPhone: row.participant.phone_e164 ?? undefined,
      isPublic: row.is_public,
    }));
    const groups = new Map<string, PublicApplication[]>();
    for (const application of mapped) {
      const key = `${normalizeName(application.displayName)}|${application.applicationDate}|${application.originCountry}|${application.attemptNumber}`;
      groups.set(key, [...(groups.get(key) ?? []), application]);
    }
    return {
      applications: mapped,
      hiddenApplications: rows.filter((row) => !row.is_public).length,
      duplicateGroups: [...groups.entries()]
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

  async setApplicationVisibility(applicationPublicId, visible, adminId) {
    const client = createSupabaseServiceClient();
    const { data, error } = await client
      .from("applications")
      .update({ is_public: visible })
      .eq("public_id", applicationPublicId)
      .select("id")
      .single();
    if (error) throw new Error(`No se pudo cambiar la visibilidad: ${error.message}`);
    const { error: auditError } = await client.from("admin_audit_log").insert({
      admin_id: adminId,
      action: visible ? "application_published" : "application_hidden",
      entity_type: "application",
      entity_id: data.id,
    });
    if (auditError) throw new Error(`Cambio aplicado, pero falló la auditoría: ${auditError.message}`);
  },

  async setMembershipVerified(applicationPublicId, verified, adminId) {
    const client = createSupabaseServiceClient();
    const { data: application, error: lookupError } = await client
      .from("applications")
      .select("id,participant_id")
      .eq("public_id", applicationPublicId)
      .maybeSingle();
    if (lookupError || !application) throw new Error("Postulación no encontrada.");
    const { error } = await client
      .from("participants")
      .update({
        membership_verified: verified,
        membership_verified_at: verified ? new Date().toISOString() : null,
        membership_verified_by: verified ? adminId : null,
      })
      .eq("id", application.participant_id);
    if (error) throw new Error(`No se pudo actualizar la verificación: ${error.message}`);
    await client.from("admin_audit_log").insert({
      admin_id: adminId,
      action: verified ? "membership_verified" : "membership_unverified",
      entity_type: "participant",
      entity_id: application.participant_id,
    });
  },

  async getAdminNotes(applicationPublicId): Promise<AdminNote[]> {
    const client = createSupabaseServiceClient();
    const { data: application, error: applicationError } = await client
      .from("applications")
      .select("id")
      .eq("public_id", applicationPublicId)
      .maybeSingle();
    if (applicationError || !application) throw new Error("Postulación no encontrada.");
    const { data, error } = await client
      .from("admin_notes")
      .select("id,content,created_at,author:admin_users(display_name)")
      .eq("application_id", application.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`No se pudieron cargar las notas: ${error.message}`);
    return (data ?? []).map((raw) => {
      const note = raw as unknown as {
        id: string;
        content: string;
        created_at: string;
        author: { display_name: string };
      };
      return {
        id: note.id,
        content: note.content,
        authorLabel: note.author.display_name,
        createdAt: note.created_at,
      };
    });
  },

  async addAdminNote(applicationPublicId, content, adminId) {
    const client = createSupabaseServiceClient();
    const { data: application, error: applicationError } = await client
      .from("applications")
      .select("id")
      .eq("public_id", applicationPublicId)
      .maybeSingle();
    if (applicationError || !application) throw new Error("Postulación no encontrada.");
    const { error } = await client.from("admin_notes").insert({
      application_id: application.id,
      author_id: adminId,
      content,
    });
    if (error) throw new Error(`No se pudo guardar la nota: ${error.message}`);
    await client.from("admin_audit_log").insert({
      admin_id: adminId,
      action: "admin_note_created",
      entity_type: "application",
      entity_id: application.id,
    });
  },

  async setTipVisibility(tipId, visible, adminId) {
    const client = createSupabaseServiceClient();
    const { error } = await client
      .from("community_tips")
      .update({ moderation_status: visible ? "visible" : "hidden" })
      .eq("id", tipId);
    if (error) throw new Error(`No se pudo moderar el consejo: ${error.message}`);
    await client.from("admin_audit_log").insert({
      admin_id: adminId,
      action: visible ? "tip_published" : "tip_hidden",
      entity_type: "community_tip",
      entity_id: tipId,
    });
  },

  async createPasswordReset(applicationPublicId, tokenHash, adminId, expiresAt) {
    const client = createSupabaseServiceClient();
    const { data, error } = await client
      .from("applications")
      .select("participant_id")
      .eq("public_id", applicationPublicId)
      .maybeSingle();
    if (error || !data) throw new Error("Postulación no encontrada.");
    await client
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("participant_id", data.participant_id)
      .is("used_at", null);
    const { error: insertError } = await client.from("password_reset_tokens").insert({
      participant_id: data.participant_id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: adminId,
    });
    if (insertError) throw new Error(`No se pudo crear el enlace: ${insertError.message}`);
  },

  async consumePasswordReset(tokenHash, newPasswordHash): Promise<ResetTokenRecord> {
    const client = createSupabaseServiceClient();
    const { data, error } = await client.rpc("consume_password_reset", {
      p_token_hash: tokenHash,
      p_password_hash: newPasswordHash,
    });
    if (error || !data?.[0]) {
      throw new Error("El enlace de recuperación es inválido o venció.");
    }
    const result = data[0] as {
      participant_id: string;
      password_version: number;
    };
    return {
      participantId: result.participant_id,
      passwordVersion: result.password_version,
    };
  },

  async isAdmin(userId) {
    const client = createSupabaseServiceClient();
    const { data, error } = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();
    if (error) throw new Error(`No se pudo validar el rol: ${error.message}`);
    return Boolean(data);
  },

  async exportPublicRows() {
    return loadPublicView();
  },
};
