import { test, expect } from "@playwright/test";

async function waitForHydration(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");
}

test("public board filters and opens a detail", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await expect(page.getByRole("heading", { name: /La espera/i })).toBeVisible();
  await expect(page.getByText("Modo demostración")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Las nuevas postulaciones están temporalmente pausadas",
    }),
  ).toBeVisible();
  await expect(page.getByText("3.400 cupos anuales")).toBeVisible();
  await expect(page.getByRole("link", { name: /Revisar estado oficial/ })).toHaveAttribute(
    "href",
    /^https:\/\/immi\.homeaffairs\.gov\.au\/what-we-do\/whm-program\/status-of-country-caps/,
  );
  await expect(page.getByText("23", { exact: true })).toBeVisible();
  await expect(page.getByText("+569XXXXX001").first()).toBeVisible();
  await expect(page.getByText("Grupo verificado").first()).toBeVisible();
  await page.getByLabel("Estado").selectOption("granted");
  await page.getByText("Más filtros", { exact: true }).click();
  await page.getByLabel("Banco fondos").selectOption("BancoEstado");
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

test("new participant receives a safe message ready for the WhatsApp group", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  const alias = mobile ? "QA mensaje móvil" : "QA mensaje escritorio";
  const phone = mobile ? "+56987654321" : "+56987654322";

  await page.goto("/postulaciones/nueva");
  await waitForHydration(page);
  await page.getByLabel("Nombre visible o alias").fill(alias);
  await page.getByLabel("Número usado en el grupo").fill(phone);
  await page.getByLabel("Fecha de postulación").fill("2026-07-20");
  await page.getByLabel("Postulaste desde").fill("Chile");
  await page.getByLabel("Bancos o instituciones para acreditar fondos").fill("Banco privado QA");
  await page.getByLabel("Nota pública opcional").fill("Nota que no debe copiarse");
  const firstDocument = page.getByLabel("Documento 1", { exact: true });
  await expect(firstDocument.getByRole("option")).toContainText([
    "Selecciona un documento",
    "Pasaporte",
    "Resultado de prueba de inglés",
    "Comprobante de fondos",
    "Título o certificado de estudios",
    "Foto tipo pasaporte",
    "Certificado de antecedentes",
    "Examen médico",
    "Información adicional",
    "Otro documento…",
  ]);
  await firstDocument.selectOption("__custom__");
  await page.getByLabel("Nombre del documento 1").fill("Carta explicativa");
  await page.getByLabel("Contraseña", { exact: true }).fill("testing-password-123");
  await page.getByLabel("Repite la contraseña").fill("testing-password-123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Publicar mi postulación" }).click();

  await expect(page).toHaveURL(/\/mi-registro\?creado=1/);
  await expect(page.getByRole("heading", { name: "Ahora avisa en el grupo" })).toBeVisible();
  const message = page.getByLabel("Mensaje listo para compartir en WhatsApp");
  await expect(message).toHaveValue(new RegExp(alias));
  const messageValue = await message.inputValue();
  expect(messageValue).not.toContain("Banco privado QA");
  expect(messageValue).not.toContain("Nota que no debe copiarse");
  await expect(page.getByRole("link", { name: "Ir al grupo y pegar" })).toHaveAttribute(
    "href",
    /^https:\/\/chat\.whatsapp\.com\/BvIAXo2j31J9bzeUMaBPj2/,
  );
  await page.getByRole("button", { name: "Copiar mensaje" }).click();
  await expect(page.getByRole("button", { name: "Mensaje copiado" })).toBeVisible();
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
