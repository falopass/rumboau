import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseServiceClient } from "@/lib/supabase/clients";
import { isDemoMode } from "@/lib/data/repository";

const demoBuckets = new Map<string, { startedAt: number; hits: number }>();

export async function assertSameOrigin(): Promise<void> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!origin || !host) return;
  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error("Origen de solicitud no permitido.");
  }
}

async function fingerprint(scope: string): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded ?? headerStore.get("x-real-ip") ?? "local";
  const salt =
    process.env.RATE_LIMIT_SALT ??
    (isDemoMode() ? "rumbo-development-only-rate-limit-salt" : null);
  if (!salt) throw new Error("Falta configurar RATE_LIMIT_SALT.");
  return createHmac("sha256", salt).update(`${scope}:${address}`).digest("hex");
}

export async function enforceRateLimit(
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const keyHash = await fingerprint(scope);
  if (isDemoMode()) {
    const now = Date.now();
    const current = demoBuckets.get(keyHash);
    if (!current || current.startedAt + windowSeconds * 1000 < now) {
      demoBuckets.set(keyHash, { startedAt: now, hits: 1 });
      return;
    }
    current.hits += 1;
    if (current.hits > limit) {
      throw new Error("Demasiados intentos. Espera unos minutos antes de volver a probar.");
    }
    return;
  }

  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("consume_rate_limit", {
    p_key_hash: keyHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error("No se pudo validar el límite de solicitudes.");
  if (!data) {
    throw new Error("Demasiados intentos. Espera unos minutos antes de volver a probar.");
  }
}

