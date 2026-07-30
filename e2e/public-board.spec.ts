import { test, expect } from "@playwright/test";

async function waitForHydration(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");
}

test("public board filters and opens a detail", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await expect(page.getByRole("heading", { name: /La espera/i })).toBeVisible();
  await expect(page.getByText("Modo demostración")).toBeVisible();
  await expect(page.getByText("23", { exact: true })).toBeVisible();
  await expect(page.getByText("+569XXXXX001").first()).toBeVisible();
  await expect(page.getByText("Grupo verificado").first()).toBeVisible();
  await page.getByLabel("Estado").selectOption("granted");
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByText("Josefa", { exact: true })).toBeVisible();
  await page.getByText("Josefa", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Josefa" })).toBeVisible();
  await expect(page.getByText("BancoEstado")).toBeVisible();
});

test("participant unlocks their workspace with the record password", async ({ page }) => {
  await page.goto("/postulaciones/app_demo_1/editar");
  await waitForHydration(page);
  await page.getByLabel("Contraseña").fill("rumbo-demo-2026");
  await page.getByRole("button", { name: "Editar mi registro" }).click();
  await expect(page).toHaveURL(/\/mi-registro/);
  await expect(page.getByRole("heading", { name: /Hola, Josefa/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Editar postulación" })).toBeVisible();
});

test("admin can enter the protected dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Administración" })).toBeVisible();
  await expect(page.getByText("Resumen WhatsApp")).toBeVisible();
});

test("anonymous visitors cannot open administration or export data", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  const exportResponse = await page.request.get("/api/admin/export");
  expect(exportResponse.status()).toBe(403);
  expect(await exportResponse.text()).toBe("Acceso denegado");
});
