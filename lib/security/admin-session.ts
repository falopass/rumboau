import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getRepository, isDemoMode } from "@/lib/data/repository";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
} from "@/lib/data/demo-repository";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

const DEMO_COOKIE = "rumbo_demo_admin";

export interface AdminIdentity {
  id: string;
  email: string;
}

function getDemoSecret(): Uint8Array {
  const value =
    process.env.SESSION_SECRET ?? "rumbo-development-only-secret-32-chars";
  return new TextEncoder().encode(value);
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  if (isDemoMode()) {
    if (email !== DEMO_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
      throw new Error("Correo o contraseña incorrectos.");
    }
    const token = await new SignJWT({ role: "admin", email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("demo-admin")
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(getDemoSecret());
    const store = await cookies();
    store.set(DEMO_COOKIE, token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return;
  }

  const client = await createSupabaseAuthServerClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error("Correo o contraseña incorrectos.");
  if (!(await getRepository().isAdmin(data.user.id))) {
    await client.auth.signOut();
    throw new Error("Esta cuenta no tiene acceso administrativo.");
  }
}

export async function getAdmin(): Promise<AdminIdentity | null> {
  if (isDemoMode()) {
    const store = await cookies();
    const token = store.get(DEMO_COOKIE)?.value;
    if (!token) return null;
    try {
      const verified = await jwtVerify(token, getDemoSecret(), {
        algorithms: ["HS256"],
      });
      if (verified.payload.role !== "admin" || !verified.payload.sub) return null;
      return {
        id: verified.payload.sub,
        email: String(verified.payload.email ?? DEMO_ADMIN_EMAIL),
      };
    } catch {
      return null;
    }
  }

  const client = await createSupabaseAuthServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  if (!(await getRepository().isAdmin(data.user.id))) return null;
  return { id: data.user.id, email: data.user.email ?? "admin" };
}

export async function signOutAdmin(): Promise<void> {
  if (isDemoMode()) {
    const store = await cookies();
    store.delete(DEMO_COOKIE);
    return;
  }
  const client = await createSupabaseAuthServerClient();
  await client.auth.signOut();
}

