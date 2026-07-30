import { describe, expect, it } from "vitest";
import { demoRepository } from "@/lib/data/demo-repository";
import { hashPassword, verifyPassword } from "@/lib/security/passwords";
import { hashToken } from "@/lib/security/tokens";

describe.sequential("development repository", () => {
  it("filters the public board by status and bank", async () => {
    const result = await demoRepository.listPublicApplications({
      status: "granted",
      bank: "BancoEstado",
      page: 1,
      pageSize: 20,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.applications.every((item) => item.status.slug === "granted")).toBe(true);
    expect(result.applications.every((item) => item.banks.includes("BancoEstado"))).toBe(true);
  });

  it("creates a participant and prevents cross-owner updates", async () => {
    const passwordHash = await hashPassword("testing-password-123");
    const workspace = await demoRepository.createParticipant({
      displayName: "Alias de prueba",
      phoneE164: "+56912345678",
      passwordHash,
      consentAt: new Date().toISOString(),
      originCountry: "Chile",
      applicationDate: "2026-07-01",
      attemptNumber: 1,
      status: "waiting",
      publicNotes: "Registro exclusivamente de prueba.",
      banks: ["Wise"],
      documents: [],
    });
    const application = workspace.applications[0];
    const identity = await demoRepository.findPasswordIdentity(application.publicId);
    expect(identity?.participantId).toBe(workspace.participantId);
    await expect(
      verifyPassword(identity?.passwordHash ?? "", "testing-password-123"),
    ).resolves.toBe(true);
    await expect(
      demoRepository.updateApplication("another-owner", application.publicId, {
        originCountry: "Chile",
        applicationDate: "2026-07-01",
        attemptNumber: 1,
        status: "granted",
        banks: [],
        documents: [],
      }),
    ).rejects.toThrow(/permiso/i);
  });

  it("consumes a password reset token only once and increments the session version", async () => {
    const tokenHash = hashToken("a-long-test-token-that-is-not-public");
    await demoRepository.createPasswordReset(
      "app_demo_2",
      tokenHash,
      "demo-admin",
      new Date(Date.now() + 60_000).toISOString(),
    );
    const result = await demoRepository.consumePasswordReset(
      tokenHash,
      await hashPassword("new-demo-password"),
    );
    expect(result.passwordVersion).toBe(2);
    await expect(
      demoRepository.consumePasswordReset(
        tokenHash,
        await hashPassword("another-password"),
      ),
    ).rejects.toThrow(/inválido|venció/i);
  });
});
