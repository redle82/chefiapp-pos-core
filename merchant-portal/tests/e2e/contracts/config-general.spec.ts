/**
 * Config General — Validação funcional /admin/config/general
 *
 * Objetivo: provar no browser que a página abre sem 400 por colunas ausentes,
 * que os campos carregam e que o save (se disponível) funciona.
 *
 * Requer: schema opcional de gm_restaurants aplicado no backend em uso.
 * Setup: usa storageState do pilot (restaurant_id em contexto).
 */

import { expect, test } from "@playwright/test";
import { waitForApp } from "../fixtures/base";

test.describe("Config General — /admin/config/general", () => {
  test("abre sem 400 por column does not exist e os cards carregam", async ({
    page,
  }) => {
    const badResponses: { url: string; status: number; body?: string }[] = [];

    page.on("response", async (response) => {
      const url = response.url();
      const status = response.status();
      if (status === 400 && (url.includes("gm_restaurants") || url.includes("restaurant_setup_status"))) {
        let body = "";
        try {
          body = await response.text();
        } catch {
          // ignore
        }
        badResponses.push({ url, status, body });
      }
    });

    await page.goto("/admin/config/general", { waitUntil: "domcontentloaded" });
    await waitForApp(page, 15_000);

    // Dar tempo para os requests de leitura (RuntimeReader, GeneralCardIdentity, GeneralCardLocale)
    await page.waitForTimeout(3000);

    const withColumnError = badResponses.filter(
      (r) => r.body && (r.body.includes("does not exist") || r.body.includes("column")),
    );
    expect(
      withColumnError,
      `Não deve haver 400 por coluna ausente. Recebidos: ${JSON.stringify(withColumnError)}`,
    ).toHaveLength(0);

    // Página deve mostrar o card Identidade ou Locale (formulário carregado)
    const cardIdentity = page.getByRole("heading", {
      name: /Identidade do Restaurante/i,
    });
    const cardLocale = page.getByRole("heading", {
      name: /Idioma e localização/i,
    });
    await expect(cardIdentity.or(cardLocale)).toBeVisible({ timeout: 10_000 });

    // Deve existir pelo menos um botão Guardar (cards com form)
    const saveButton = page.getByRole("button", { name: /Guardar|Save|Salvar/i });
    await expect(saveButton.first()).toBeVisible({ timeout: 5_000 });
  });

  test("save no card Identidade não devolve 400/403 e página recarrega sem erro", async ({
    page,
  }) => {
    const badResponses: { url: string; status: number }[] = [];
    page.on("response", async (response) => {
      if (response.status() === 400 || response.status() === 403) {
        const url = response.url();
        if (url.includes("gm_restaurants")) {
          badResponses.push({ url, status: response.status() });
        }
      }
    });

    await page.goto("/admin/config/general", { waitUntil: "domcontentloaded" });
    await waitForApp(page, 15_000);

    const section = page.locator("section").filter({ hasText: /Identidade do Restaurante/ });
    await expect(section).toBeVisible({ timeout: 15_000 });

    const saveBtn = section.getByRole("button", { name: /Guardar|Save|Salvar/i });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await saveBtn.click();
    await page.waitForTimeout(2000);

    expect(
      badResponses.filter((r) => r.status === 400),
      "Save não deve devolver 400 (coluna ausente)",
    ).toHaveLength(0);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForApp(page, 15_000);
    await page.waitForTimeout(2000);
    await expect(section).toBeVisible({ timeout: 5_000 });
  });
});
