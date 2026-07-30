export const STATUS_SLUGS = [
  "waiting",
  "information_requested",
  "documents_sent",
  "granted",
  "rejected",
  "withdrawn",
] as const;

export type StatusSlug = (typeof STATUS_SLUGS)[number];

export const DOCUMENT_STATES = ["requested", "pending", "sent"] as const;
export type DocumentState = (typeof DOCUMENT_STATES)[number];

export const TIP_CATEGORIES = ["process", "documents", "banks", "general"] as const;
export type TipCategory = (typeof TIP_CATEGORIES)[number];

export interface ApplicationStatus {
  slug: StatusSlug;
  label: string;
  tone: "waiting" | "action" | "success" | "danger" | "muted";
}

export interface PublicDocument {
  id: string;
  label: string;
  state: DocumentState;
  stateDate: string | null;
  publicNote: string | null;
}

export interface PublicTip {
  id: string;
  category: TipCategory;
  content: string;
  createdAt: string;
}

export interface PublicEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface PublicApplication {
  id: string;
  publicId: string;
  participantId?: string;
  isPublic?: boolean;
  participantPhone?: string;
  displayName: string;
  maskedPhone: string;
  membershipVerified: boolean;
  originCountry: string;
  applicationDate: string;
  grantedAt: string | null;
  attemptNumber: number;
  status: ApplicationStatus;
  publicNotes: string | null;
  banks: string[];
  documents: PublicDocument[];
  tips: PublicTip[];
  events: PublicEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardFilters {
  query?: string;
  status?: StatusSlug;
  dateFrom?: string;
  dateTo?: string;
  origin?: string;
  attempt?: number;
  bank?: string;
  document?: DocumentState;
  hasNotes?: boolean;
  page: number;
  pageSize: number;
}

export interface BoardResult {
  applications: PublicApplication[];
  total: number;
  page: number;
  pageSize: number;
  availableOrigins: string[];
  availableBanks: string[];
}

export interface DashboardMetrics {
  total: number;
  waiting: number;
  granted: number;
  updatedThisWeek: number;
}

export interface ApplicationWriteInput {
  originCountry: string;
  applicationDate: string;
  attemptNumber: number;
  status: StatusSlug;
  publicNotes?: string;
  banks: string[];
  documents: Array<{
    id?: string;
    label: string;
    state: DocumentState;
    stateDate?: string;
    publicNote?: string;
  }>;
}

export interface ParticipantWorkspace {
  participantId: string;
  participantPublicId: string;
  displayName: string;
  passwordVersion: number;
  applications: PublicApplication[];
}

export interface CreateParticipantInput extends ApplicationWriteInput {
  displayName: string;
  phoneE164: string;
  passwordHash: string;
  consentAt: string;
}

export interface PasswordIdentity {
  participantId: string;
  participantPublicId: string;
  passwordHash: string;
  passwordVersion: number;
}

export interface AdminOverview {
  applications: PublicApplication[];
  hiddenApplications: number;
  duplicateGroups: Array<{
    key: string;
    applications: Array<{ publicId: string; displayName: string; applicationDate: string }>;
  }>;
}

export interface ResetTokenRecord {
  participantId: string;
  passwordVersion: number;
}

export interface AdminNote {
  id: string;
  content: string;
  authorLabel: string;
  createdAt: string;
}

export interface DataRepository {
  listPublicApplications(filters: BoardFilters): Promise<BoardResult>;
  getPublicApplication(publicId: string): Promise<PublicApplication | null>;
  listPublicTips(): Promise<PublicTip[]>;
  createParticipant(input: CreateParticipantInput): Promise<ParticipantWorkspace>;
  findPasswordIdentity(applicationPublicId: string): Promise<PasswordIdentity | null>;
  getWorkspace(participantId: string): Promise<ParticipantWorkspace | null>;
  createApplication(
    participantId: string,
    input: ApplicationWriteInput,
  ): Promise<PublicApplication>;
  updateApplication(
    participantId: string,
    applicationPublicId: string,
    input: ApplicationWriteInput,
  ): Promise<PublicApplication>;
  addTip(
    participantId: string,
    applicationPublicId: string,
    category: TipCategory,
    content: string,
  ): Promise<void>;
  deleteParticipant(participantId: string): Promise<void>;
  listAdminOverview(): Promise<AdminOverview>;
  setApplicationVisibility(
    applicationPublicId: string,
    visible: boolean,
    adminId: string,
  ): Promise<void>;
  setMembershipVerified(
    applicationPublicId: string,
    verified: boolean,
    adminId: string,
  ): Promise<void>;
  getAdminNotes(applicationPublicId: string): Promise<AdminNote[]>;
  addAdminNote(
    applicationPublicId: string,
    content: string,
    adminId: string,
  ): Promise<void>;
  setTipVisibility(tipId: string, visible: boolean, adminId: string): Promise<void>;
  createPasswordReset(
    applicationPublicId: string,
    tokenHash: string,
    adminId: string,
    expiresAt: string,
  ): Promise<void>;
  consumePasswordReset(tokenHash: string, newPasswordHash: string): Promise<ResetTokenRecord>;
  isAdmin(userId: string): Promise<boolean>;
  exportPublicRows(): Promise<PublicApplication[]>;
}
