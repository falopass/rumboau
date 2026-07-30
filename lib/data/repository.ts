import type { DataRepository } from "@/lib/domain/types";
import { demoRepository } from "./demo-repository";
import { supabaseRepository } from "./supabase-repository";

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isDemoMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.RUMBO_DEMO_MODE === "true" || !hasSupabaseConfig();
}

export function getRepository(): DataRepository {
  return isDemoMode() ? demoRepository : supabaseRepository;
}
