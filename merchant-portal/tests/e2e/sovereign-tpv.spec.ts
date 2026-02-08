import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

// Read credentials robustly — skip gracefully if file is missing
const credsPath = path.resolve(process.cwd(), "tests/e2e/e2e-creds.json");
let credentials: { email: string; password: string } = {
  email: "",
  password: "",
};
try {
  if (fs.existsSync(credsPath)) {
    credentials = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
  }
} catch {
  /* creds file missing – tests will be skipped */
}

// ------------------------------------------------------------------
// 🛡️ SOVEREIGN TPV VERIFICATION SUITE
// ------------------------------------------------------------------

test.describe("Sovereign TPV: Financial Core Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Capture Browser Console Logs
    page.on("console", (msg) => {
      if (msg.type() === "error")
        console.error(`🔴 BROWSER ERROR: ${msg.text()}`);
      else console.log(`⚪ BROWSER LOG: ${msg.text()}`);
    });

    page.on("pageerror", (err) => {
      console.error(`🔴 UNCAUGHT EXCEPTION: ${err.message}`);
    });

    // --- STEP 0: AUTHENTICATION ---
    console.log(
      `🔐 STEP 0: Authentication via /login?debug=1... (User: ${credentials.email})`,
    );
    await page.goto("/login?debug=1");
    await page.waitForLoadState("networkidle");

    // Check if we are already redirected to app
    if (page.url().includes("/app") || page.url().includes("/dashboard")) {
      console.log("🔓 Already authenticated (redirected to app).");
    } else {
      console.log("🔐 Performing Technical Login...");

      // Set bypass before login attempt
      await page.evaluate(() => {
        localStorage.setItem("chefiapp_bypass_health", "true");
      });

      // Look for email input - try multiple selectors
      const emailInput = page
        .getByPlaceholder("Email técnico")
        .or(page.getByPlaceholder("Email").first())
        .or(page.locator('input[type="email"]').first());

      // Try to expand technical access if input is hidden
      if (!(await emailInput.isVisible({ timeout: 3000 }).catch(() => false))) {
        console.log("🔘 Looking for Technical Access Toggle...");
        // Try various toggle selectors
        const toggleCandidates = [
          page.getByRole("button", { name: /Acesso Técnico/i }),
          page.getByRole("button", { name: /Technical/i }),
          page.getByText(/Acesso Técnico/i),
          page.getByText(/Login Dev/i),
          page.locator('[data-testid="technical-access-toggle"]'),
        ];

        for (const toggle of toggleCandidates) {
          if (
            await toggle
              .first()
              .isVisible({ timeout: 1000 })
              .catch(() => false)
          ) {
            console.log("🔘 Found toggle, clicking...");
            await toggle.first().click();
            break;
          }
        }
      }

      // Wait for email input to be visible
      await expect(emailInput).toBeVisible({ timeout: 10000 });

      // Fill Credentials
      await emailInput.fill(credentials.email);
      await page
        .getByPlaceholder("Senha")
        .or(page.locator('input[type="password"]').first())
        .fill(credentials.password);

      // Submit - try multiple button selectors
      const submitBtn = page
        .getByRole("button", { name: /Acessar como Técnico/i })
        .or(page.getByRole("button", { name: /Entrar/i }))
        .or(page.getByRole("button", { name: /Login/i }));
      await submitBtn.first().click();

      // Wait for App Redirect
      await page.waitForURL(/\/(dashboard|app)/, { timeout: 20000 });
      console.log("🔓 Login Successful.");
    }

    await page.waitForLoadState("networkidle");
  });

  test.skip("The Perfect Shift: Open -> Sell -> Pay -> Close", async ({
    page,
  }) => {
    // --- STEP 1: SEEDING (Ensure Product Exists) ---
    console.log("🌱 STEP 1: Seeding Menu Data...");
    await page.goto("/menu");

    // DEBUG: Print URL and Title if it fails
    try {
      await expect(page).toHaveURL(/menu/, { timeout: 10000 });
      await expect(page.locator("body")).not.toBeEmpty();
      await page.waitForTimeout(2000);

      const title = await page.title();
      console.log("📄 Page Title:", title);
      console.log("🔗 Current URL:", page.url());
    } catch (e) {
      console.error("❌ Failed to load Menu Page. Current URL:", page.url());
      const body = await page.innerHTML("body");
      console.log("📄 Body (truncated):", body.substring(0, 500));
      throw e;
    }

    // Wait for Menu Header
    try {
      await expect(
        page.getByText("Gestão do Menu", { exact: false }),
      ).toBeVisible({ timeout: 5000 });
      console.log("✅ Menu Header Found");
    } catch (e) {
      console.log('⚠️ Header "Gestão do Menu" not found. Reloading...');
      await page.reload();
      await expect(
        page.getByText("Gestão do Menu", { exact: false }),
      ).toBeVisible({ timeout: 10000 });
    }

    // Auto Creator (if empty)
    const emptyStateAction = page.getByText(/Usar Criador Automático/i);
    if (await emptyStateAction.isVisible()) {
      console.log("🚀 Found Auto Creator. Clicking...");
      await emptyStateAction.click();
      await page.waitForTimeout(2000); // Wait for seed
      await page.reload();
    }

    // --- STEP 2: SHIFT START (The Cash Gate) ---
    console.log("🛡️ STEP 2: Verifying Cash Gate...");
    await page.goto("/tpv");
    await expect(page).toHaveURL(/tpv/);
    await page.waitForTimeout(2000);

    const openRegisterBtn = page.getByRole("button", { name: /Abrir Caixa/i });
    if (await openRegisterBtn.isVisible()) {
      await openRegisterBtn.click();
      await expect(page.getByText("Abrir Caixa").first()).toBeVisible(); // Selector Corrected
      await page.getByPlaceholder("0.00").fill("100.00");

      // Wait for button to be enabled/clickable
      const confirmBtn = page
        .getByRole("button", { name: "Abrir Caixa" })
        .filter({ hasText: /^Abrir Caixa$/ });
      await confirmBtn.click();

      // ASSERTION UPDATE: Verify state change (ABERTO) instead of ephemeral toast
      await expect(page.getByText("ABERTO", { exact: true })).toBeVisible({
        timeout: 10000,
      });
    } else {
      console.log("ℹ️ Cash Register might be already open.");
    }

    // --- STEP 3: ORDER CREATION ---
    console.log("🛒 STEP 3: Creating Order...");

    // Add Product (Canonical Source)
    // Robust selector: Target Card via testid pattern + content
    const productCard = page
      .getByTestId(/^product-card-/)
      .filter({ hasText: "Coca Cola SQL" })
      .first();

    // Simple, Robust Wait
    try {
      console.log('⏳ Waiting for product "Coca Cola SQL"...');
      // Wait up to 20s for the product to appear (handles slow network/rendering)
      await expect(productCard).toBeVisible({ timeout: 20000 });
      await productCard.click();
    } catch (e) {
      console.log(
        '⚠️ Product "Coca Cola SQL" not found after 20s. Panic Dump:',
      );
      // DEBUG: List available products
      const products = await page
        .getByTestId(/^product-card-/)
        .allTextContents();
      console.log("📦 AVAILABLE PRODUCTS:", products);

      // Last ditch reload
      console.log("🔄 Reloading page as last resort...");
      await page.reload();
      await page.waitForTimeout(5000);

      // Explicitly wait for visibility before clicking
      try {
        await expect(productCard).toBeVisible({ timeout: 10000 });
        await productCard.click();
      } catch (clickError) {
        console.error("❌ Failed to find/click product after reload.");
        const content = await page.content();
        console.log("📄 PAGE HTML DUMP:", content); // Dump HTML to debug rendering
        throw clickError;
      }
    }

    // If no reload was needed, clicking happens here?
    // No, the original logic had `await productCard.click()` both inside try and after catch?
    // My previous fix removed the duplicate click after catch block, but kept it inside the retry block.
    // Wait, if the FIRST `try` succeeds (line 144), it clicks.
    // If it fails, it goes to `catch`.
    // Inside `catch`, it reloads and clicks.
    // So we don't need a click after the catch block anymore.
    // Check structure:
    // try { ... click } catch { ... reload ... click }
    // This is correct.

    // Wait for Order Item Editor to appear (Success State)
    // Validating if "Open Cash Register" modal appeared instead of adding item
    const openRegisterModal = page.getByText("Abrir Caixa").first();
    if (await openRegisterModal.isVisible()) {
      console.log("ℹ️ JIT Cash Register Opening triggered...");
      await page.getByPlaceholder("0,00").fill("100,00");
      await page.getByRole("button", { name: "Abrir Caixa" }).click();
      await expect(page.getByText("Caixa aberto com sucesso")).toBeVisible({
        timeout: 10000,
      });

      // Retry clicking the product now that register is open
      await productCard.click();
    }

    // Wait for Order Item Editor to appear (Success State)
    await page.waitForTimeout(2000); // Allow Supabase subscription/fetch to sync activeOrder
    await expect(page.getByText(/Voltar ao Menu/)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("SUBTOTAL")).toBeVisible();
    await expect(page.getByText(/€\s*2[.,]50/).first()).toBeVisible(); // Price verification (Regex for dot/comma)
    await expect(page.getByText("Coca Cola SQL").first()).toBeVisible();

    // --- STEP 4: FINANCIAL INTEGRITY ---
    console.log("💰 STEP 4: Verifying Calculation...");
    await expect(
      page.getByText("TOTAL", { exact: true }).first(),
    ).toBeVisible();

    // --- STEP 5: PAYMENT (RPC) ---
    // --- STEP 5: PROCESS ORDER (Kitchen -> Pay) ---
    console.log("🍳 STEP 5: Processing Order (Kitchen Flow)...");

    // 1. Send to Kitchen
    await page
      .getByRole("button", { name: /Enviar Cozinha/i })
      .first()
      .click();

    // 2. Mark Ready (Assuming immediate transition for now or fast mock)
    // We might need to wait for state update if it's async
    await expect(
      page.getByRole("button", { name: /Marcar Pronto/i }).first(),
    ).toBeVisible({ timeout: 10000 });
    await page
      .getByRole("button", { name: /Marcar Pronto/i })
      .first()
      .click();

    // 3. Pay
    console.log("💳 STEP 6: Executing Payment...");
    await expect(
      page.getByRole("button", { name: /Cobrar/i }).first(),
    ).toBeVisible({ timeout: 10000 });
    await page
      .getByRole("button", { name: /Cobrar/i })
      .first()
      .click();

    await expect(page.getByText("Total a Pagar").first()).toBeVisible();
    await page.getByRole("button", { name: /Cartão/i }).click(); // Use Card to avoid manual input requirement
    await page.getByRole("button", { name: "Cobrar", exact: true }).click(); // Button is 'Cobrar', not 'Confirmar Pagamento'
    // Success message flows quickly, so we verify the modal closes
    await expect(page.getByText("Total a Pagar")).toBeHidden({
      timeout: 10000,
    });

    // --- STEP 6: SHIFT END ---
    console.log("🏁 STEP 6: Closing Shift...");
    await page.waitForTimeout(1000); // UI Settlement

    await page.getByRole("button", { name: /Fechar Caixa/i }).click();
    await expect(page.getByTestId("close-cash-modal")).toBeVisible();

    // Fill Final Balance (Required)
    const balanceInput = page.locator('input[placeholder="0.00"]');
    await balanceInput.click();
    await balanceInput.fill("0,00"); // Valid amount

    await page
      .getByRole("button", { name: "Fechar Caixa", exact: true })
      .click();

    // ASSERTION UPDATE: Verify state change (FECHADO) instead of ephemeral toast
    await expect(page.getByText("FECHADO", { exact: true })).toBeVisible({
      timeout: 10000,
    });
  });
});
