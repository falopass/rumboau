import { createHash, randomBytes } from "node:crypto";

export function createPublicId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

export function createResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

