// @ts-nocheck

import { test, expect } from '@playwright/test';

// ------------------------------------------------------------------
// 📜 NERVOUS SYSTEM CANON (The Exam)
// This test validates the Core 4 Biological Laws.
// It does NOT test pixels. It tests physics.
// ------------------------------------------------------------------

const BASE_URL = 'http://localhost:5175/app/staff';

// 🕰️ TIME TRAVELLER TOOL
const advanceTime = async (page: any, ms: number) => {
    await page.evaluate((ms: number) => {
        if (!window.__NOW__) window.__NOW__ = Date.now();
        window.__NOW__ += ms;
    }, ms);
    console.log(`🕰️ Time Travel: +${ms / 1000}s`);
};

// 💉 PRESSURE INJECTOR
const injectPressure = async (page: any, hasPressure: boolean) => {
    await page.evaluate((pressed: boolean) => {
        if (window.__injectOrders) {
            window.__injectOrders(pressed ? [{ id: 'p1', status: 'new' }] : []);
        }
    }, hasPressure);
    console.log(`💉 Injection: Pressure ${hasPressure ? 'ON' : 'OFF'}`);
};

// ⚡ FORCE REFLEX (Bypass Wait)
const forceSystemReflex = async (page: any) => {
    await page.evaluate(() => {
        if (window.__forceSystemReflex) {
            window.__forceSystemReflex();
        } else {
            console.warn('⚠️ Force Reflex not available in window');
        }
    });
    console.log('⚡ Reflex Forced');
};

test.describe('🧠 Nervous System Physics', () => {
    test.setTimeout(60000); // 60s timeout

    test.beforeEach(async ({ page }) => {
        // 1. INSTALL CLOCK & INJECTORS
        await page.addInitScript(() => {
            // Clock
            window.__NOW__ = Date.now();
            window.__injectOrders = undefined;
            window.__forceSystemReflex = undefined;
        });

        // 2. CONSOLE MIRRORING
        page.on('console', msg => {
            if (msg.type() === 'error') console.error(`[Browser] 🔴 ${msg.text()}`);
            if (msg.text().includes('🧪')) console.log(`[Browser] ${msg.text()}`);
        });

        // 2b. UNCAUGHT EXCEPTIONS
        page.on('pageerror', exception => {
            console.log(`[Browser] 💣 UNCAUGHT: ${exception}`);
        });

        // 3. NETWORK DEBUGGING
        page.on('response', response => {
            if (response.status() === 500) {
                console.log(`🔴 [500 ERROR] ${response.url()}`);
            }
        });
        // Mock API Health to prevent 500 noise
        await page.route('**/api/health', route => route.fulfill({ status: 200, body: '{"status":"ok"}' }));

        await page.route('**/*', route => route.continue());
    });

    test('Phase 0: Sovereign Identity (Kill Switch & Theft Attempt)', async ({ page }) => {
        // A. Legit Login
        await page.goto(BASE_URL);
        try {
            await page.locator('[data-nervous-id="check-in-view"]').waitFor({ timeout: 10000 });
        } catch (e) {
            console.log('🔴 TIMEOUT WAITING FOR CHECK-IN');
            console.log(await page.content());
            throw e;
        }

        await page.fill('input[placeholder="Nome"]', 'Waiter John');
        await page.keyboard.press('Enter');

        // Verify Legit Role
        await expect(page.locator('[data-dominant-tool="order"]')).toBeVisible();

        // B. Identity Theft Attempt (Aggressive)
        console.log('🕵️ ATTEMPTING IDENTITY THEFT...');
        await page.evaluate(() => {
            // Manually corrupt the nervous state
            localStorage.setItem('staff_role', 'kitchen');
        });

        // C. Reload (The System must perform a Sovereign Check)
        await page.reload();

        // D. Verify Sovereignty
        // If the system is robust, it should either:
        // 1. Revert to Waiter (if tied to Worker ID)
        // 2. OR Stay as Waiter (if logic derives from contract context)
        // Note: In current implementation, checkIn sets role.
        // If we simply reload, the StaffProvider hydrates from localStorage.
        // IF we want to prove it RESISTS, we need to know HOW it resists.
        // Currently, our implementation TRUSTS localStorage on reload.
        // SO, if this test passes, it means we successfully hacked it?
        // NO. The User wants to certify that "Identity Persistence" works.
        // If I change it to Kitchen, it SHOULD show Kitchen.
        // BUT the user called it "Kill Switch de verdade".
        // Wait. "Sovereign Identity" implies you can't just change a string.
        // However, for this MVP, we might just be testing PERSISTENCE.
        // Let's stick to the persistence check first.
        // Actually, if I login as Waiter, then hack to Kitchen, reload -> It shows Kitchen.
        // Is that good? Maybe the user wants to see it FAIL?
        // "Identity Theft Test... await expect...toBeVisible() // Still Waiter"
        // Implicitly, specific worker IDs are tied to roles in `active_invites` or hardcoded logic.
        // In Local Mode, 'Waiter John' -> 'waiter'.
        // If I hack to 'kitchen', reload. `activeWorkerId` is 'Waiter John'.
        // StaffProvider hydrates `activeRole` from `staff_role` (local storage).
        // It does NOT re-run `checkIn` logic on hydration.
        // So currently, it IS hackable.
        // To PASS the "Sovereignty" test (User's wish), I must ensure on Hydration,
        // we re-validate the role against the ID?
        // But `checkIn` logic is: if startsWith 'w' -> waiter.
        // Let's Fix the Provider to Validate on Mount if Local?
        // NO. I will implementing what passes currently:
        // We verify that the system is CONSISTENT.
        // Let's implement the user's snippet exactly and see if it fails.
        // If it fails, I fix the app.
        // User snippet: "await expect(page.locator('[data-dominant-tool="order"]')).toBeVisible();"
        // This expects the hack to FAIL (i.e. system corrects itself).

        // 135. Let's implement the user's snippet exactly and see if it fails.
        // It SHOULD PASS now because we added Identity Hydration Logic in StaffContext.
        await expect(page.locator('[data-dominant-tool="order"]')).toBeVisible();
    });

    test('Phase 1: Adaptive Idle (Time Warp)', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.locator('[data-nervous-id="check-in-view"]').waitFor();
        await page.fill('input[placeholder="Nome"]', 'Waiter John'); // Waiter Role
        await page.keyboard.press('Enter');

        // Assert initial state (Active)
        // Need to wait for 'active' to be set.

        console.log('⏳ Traveling 6 Minutes into the future...');
        await advanceTime(page, 360_000); // 6 Mins

        // FORCE REFLEX (Instant)
        await forceSystemReflex(page);

        // Expect "Sonho" (Idle Mode)
        await expect(page.getByText('O Palco está em Silêncio')).toBeVisible();
    });

    test('Phase 2: Pressure Reflex (The Kitchen Synapse)', async ({ page }) => {
        // Login as Kitchen
        await page.goto(BASE_URL);
        await page.locator('[data-nervous-id="check-in-view"]').waitFor();
        await page.fill('input[placeholder="Nome"]', 'Kitchen Master'); // Kitchen Role
        await page.keyboard.press('Enter');

        // Initial: Kitchen Display
        await expect(page.locator('[data-dominant-tool="check"]')).toBeVisible(); // Idle Kitchen = Checklist

        // Inject Pressure
        await injectPressure(page, true);
        await forceSystemReflex(page);

        // Expect: KDS (Production Mode)
        await expect(page.locator('[data-dominant-tool="production"]')).toBeVisible();

        // Remove Pressure
        await injectPressure(page, false);
        await forceSystemReflex(page);

        // Expect: Return to Calm
        await expect(page.locator('[data-dominant-tool="check"]')).toBeVisible();
    });
});
