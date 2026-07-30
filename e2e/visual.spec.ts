import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

test("visual, overflow, console and keyboard gates", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One Chromium project captures all target widths.");

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await page.waitForFunction(() => document.documentElement.dataset.hydrated === "true");
    await expect(page.getByRole("heading", { name: /La espera/i })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

    await page.screenshot({
      path: `qa/home-${viewport.name}-${viewport.width}.png`,
      fullPage: true,
      animations: "disabled",
      caret: "initial",
    });

    await page.keyboard.press("Tab");
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.tagName !== "BODY"))
      .toBe(true);

    await page.goto("/postulaciones/app_demo_1");
    await expect(page.getByRole("heading", { name: "Josefa" })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    await page.screenshot({
      path: `qa/detail-${viewport.name}-${viewport.width}.png`,
      fullPage: true,
      animations: "disabled",
      caret: "initial",
    });
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/postulaciones/app_demo_1");
  const transitionDurationMs = await page
    .getByRole("link", { name: "Editar con contraseña" })
    .evaluate((element) => {
      const duration = getComputedStyle(element).transitionDuration;
      return duration.endsWith("ms") ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1000;
    });
  expect(transitionDurationMs).toBeLessThanOrEqual(0.01);
  expect(consoleErrors).toEqual([]);
});
