import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { isDemoMode } from "@/lib/data/repository";

const COOKIE_NAME = "rumbo_participant";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface ParticipantSession {
  participantId: string;
  passwordVersion: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (isDemoMode()) {
      return new TextEncoder().encode("rumbo-development-only-secret-32-chars");
    }
    throw new Error("SESSION_SECRET debe contener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(secret);
}

export async function setParticipantSession(session: ParticipantSession): Promise<void> {
  const token = await new SignJWT({
    passwordVersion: session.passwordVersion,
    role: "participant",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.participantId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getParticipantSession(): Promise<ParticipantSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const result = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (result.payload.role !== "participant" || !result.payload.sub) return null;
    return {
      participantId: result.payload.sub,
      passwordVersion: Number(result.payload.passwordVersion ?? 0),
    };
  } catch {
    return null;
  }
}

export async function clearParticipantSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
