"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepository } from "@/lib/data/repository";
import {
  adminLoginSchema,
  applicationSchema,
  createParticipantSchema,
  participantLoginSchema,
  resetPasswordSchema,
  tipSchema,
} from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import {
  clearParticipantSession,
  getParticipantSession,
  setParticipantSession,
} from "@/lib/security/participant-session";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security/request";
import { createResetToken, hashToken } from "@/lib/security/tokens";
import { getAdmin, signInAdmin, signOutAdmin } from "@/lib/security/admin-session";
import { normalizeChilePhone } from "@/lib/domain/format";

export interface ActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  resetUrl?: string;
}

const failure = (message: string, fieldErrors?: ActionState["fieldErrors"]): ActionState => ({
  ok: false,
  message,
  fieldErrors,
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export async function createParticipantAction(payload: unknown): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await enforceRateLimit("participant-create", 8, 60 * 60);
    const parsed = createParticipantSchema.safeParse(payload);
    if (!parsed.success) {
      return failure("Revisa los campos marcados.", parsed.error.flatten().fieldErrors);
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const repository = getRepository();
    const workspace = await repository.createParticipant({
      displayName: parsed.data.displayName,
      phoneE164: normalizeChilePhone(parsed.data.phone),
      passwordHash,
      consentAt: new Date().toISOString(),
      originCountry: parsed.data.originCountry,
      applicationDate: parsed.data.applicationDate,
      attemptNumber: parsed.data.attemptNumber,
      status: parsed.data.status,
      publicNotes: parsed.data.publicNotes,
      banks: parsed.data.banks,
      documents: parsed.data.documents,
    });
    await setParticipantSession({
      participantId: workspace.participantId,
      passwordVersion: workspace.passwordVersion,
    });
  } catch (error) {
    return failure(errorMessage(error));
  }
  revalidatePath("/");
  redirect("/mi-registro?creado=1");
}

export async function participantLoginAction(payload: unknown): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await enforceRateLimit("participant-login", 5, 15 * 60);
    const parsed = participantLoginSchema.safeParse(payload);
    if (!parsed.success) {
      return failure("Revisa los datos de acceso.", parsed.error.flatten().fieldErrors);
    }
    const identity = await getRepository().findPasswordIdentity(
      parsed.data.applicationPublicId,
    );
    const valid =
      identity && (await verifyPassword(identity.passwordHash, parsed.data.password));
    if (!identity || !valid) return failure("Contraseña incorrecta.");
    await setParticipantSession({
      participantId: identity.participantId,
      passwordVersion: identity.passwordVersion,
    });
  } catch (error) {
    return failure(errorMessage(error));
  }
  redirect("/mi-registro");
}

export async function participantLogoutAction(): Promise<void> {
  await clearParticipantSession();
  redirect("/");
}

async function requireParticipant() {
  const session = await getParticipantSession();
  if (!session) throw new Error("Tu sesión venció. Vuelve a ingresar con tu contraseña.");
  const workspace = await getRepository().getWorkspace(session.participantId);
  if (!workspace || workspace.passwordVersion !== session.passwordVersion) {
    await clearParticipantSession();
    throw new Error("Tu sesión ya no es válida.");
  }
  return workspace;
}

export async function saveApplicationAction(
  payload: unknown,
  applicationPublicId?: string,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await enforceRateLimit("application-write", 60, 60 * 60);
    const workspace = await requireParticipant();
    const parsed = applicationSchema.safeParse(payload);
    if (!parsed.success) {
      return failure("Revisa los campos marcados.", parsed.error.flatten().fieldErrors);
    }
    if (applicationPublicId) {
      await getRepository().updateApplication(
        workspace.participantId,
        applicationPublicId,
        parsed.data,
      );
    } else {
      await getRepository().createApplication(workspace.participantId, parsed.data);
    }
  } catch (error) {
    return failure(errorMessage(error));
  }
  revalidatePath("/");
  revalidatePath("/mi-registro");
  if (applicationPublicId) revalidatePath(`/postulaciones/${applicationPublicId}`);
  return { ok: true, message: "Cambios guardados." };
}

export async function addTipAction(payload: unknown): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const workspace = await requireParticipant();
    const parsed = tipSchema.safeParse(payload);
    if (!parsed.success) {
      return failure("Revisa el consejo.", parsed.error.flatten().fieldErrors);
    }
    await getRepository().addTip(
      workspace.participantId,
      parsed.data.applicationPublicId,
      parsed.data.category,
      parsed.data.content,
    );
    revalidatePath("/");
    revalidatePath("/consejos");
    revalidatePath(`/postulaciones/${parsed.data.applicationPublicId}`);
    revalidatePath("/mi-registro");
    return { ok: true, message: "Consejo publicado." };
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function deleteParticipantAction(password: string): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await enforceRateLimit("participant-delete", 5, 15 * 60);
    const workspace = await requireParticipant();
    const firstApplication = workspace.applications[0];
    if (!firstApplication) return failure("No encontramos una postulación asociada.");
    const identity = await getRepository().findPasswordIdentity(firstApplication.publicId);
    if (!identity || !(await verifyPassword(identity.passwordHash, password))) {
      return failure("Contraseña incorrecta. No se eliminó ningún dato.");
    }
    await getRepository().deleteParticipant(workspace.participantId);
    await clearParticipantSession();
  } catch (error) {
    return failure(errorMessage(error));
  }
  revalidatePath("/");
  redirect("/?eliminado=1");
}

export async function resetPasswordAction(payload: unknown): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await enforceRateLimit("password-reset", 5, 15 * 60);
    const parsed = resetPasswordSchema.safeParse(payload);
    if (!parsed.success) {
      return failure("Revisa la contraseña.", parsed.error.flatten().fieldErrors);
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const reset = await getRepository().consumePasswordReset(
      hashToken(parsed.data.token),
      passwordHash,
    );
    await setParticipantSession(reset);
  } catch (error) {
    return failure(errorMessage(error));
  }
  redirect("/mi-registro?recuperado=1");
}

export async function adminLoginAction(payload: unknown): Promise<ActionState> {
  try {
    await assertSameOrigin();
    await enforceRateLimit("admin-login", 5, 15 * 60);
    const parsed = adminLoginSchema.safeParse(payload);
    if (!parsed.success) {
      return failure("Revisa las credenciales.", parsed.error.flatten().fieldErrors);
    }
    await signInAdmin(parsed.data.email, parsed.data.password);
  } catch (error) {
    return failure(errorMessage(error));
  }
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await signOutAdmin();
  redirect("/admin/login");
}

export async function toggleVisibilityAction(
  applicationPublicId: string,
  visible: boolean,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await getAdmin();
    if (!admin) return failure("Acceso administrativo requerido.");
    await getRepository().setApplicationVisibility(
      applicationPublicId,
      visible,
      admin.id,
    );
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, message: visible ? "Postulación publicada." : "Postulación oculta." };
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function setMembershipVerifiedAction(
  applicationPublicId: string,
  verified: boolean,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await getAdmin();
    if (!admin) return failure("Acceso administrativo requerido.");
    await getRepository().setMembershipVerified(applicationPublicId, verified, admin.id);
    revalidatePath("/");
    revalidatePath(`/postulaciones/${applicationPublicId}`);
    revalidatePath(`/admin/postulaciones/${applicationPublicId}`);
    revalidatePath("/admin");
    return {
      ok: true,
      message: verified ? "Pertenencia al grupo verificada." : "Verificación retirada.",
    };
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function createResetLinkAction(
  applicationPublicId: string,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await getAdmin();
    if (!admin) return failure("Acceso administrativo requerido.");
    const token = createResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await getRepository().createPasswordReset(
      applicationPublicId,
      hashToken(token),
      admin.id,
      expiresAt,
    );
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return {
      ok: true,
      message: "Enlace generado. Vence en 24 horas y solo puede usarse una vez.",
      resetUrl: `${baseUrl}/recuperar/${token}`,
    };
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function addAdminNoteAction(
  applicationPublicId: string,
  content: string,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await getAdmin();
    if (!admin) return failure("Acceso administrativo requerido.");
    const normalized = content.trim();
    if (!normalized || normalized.length > 2000) {
      return failure("La nota debe tener entre 1 y 2.000 caracteres.");
    }
    await getRepository().addAdminNote(applicationPublicId, normalized, admin.id);
    revalidatePath(`/admin/postulaciones/${applicationPublicId}`);
    return { ok: true, message: "Nota interna guardada." };
  } catch (error) {
    return failure(errorMessage(error));
  }
}

export async function moderateTipAction(
  tipId: string,
  visible: boolean,
): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const admin = await getAdmin();
    if (!admin) return failure("Acceso administrativo requerido.");
    await getRepository().setTipVisibility(tipId, visible, admin.id);
    revalidatePath("/");
    revalidatePath("/consejos");
    revalidatePath("/admin");
    return { ok: true, message: visible ? "Consejo publicado." : "Consejo oculto." };
  } catch (error) {
    return failure(errorMessage(error));
  }
}
