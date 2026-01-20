# Manual Onboarding Protocol (The "Just Do It" Guide)

**Objective:** Get a restaurant running on ChefIApp in < 60 minutes.
**Audience:** Admin / Onboarder.

## Phase 1: Preparation (Before the Meeting)

1.  **Get the Menu:** Ask for a PDF or photo of the menu beforehand.
2.  **Transcription:** Enter the items into the system (using the Wizard or SQL seeds) to avoid boring the user during setup.
    *   *Tip: Use `seed-web-module.ts` or manually via the Setup Wizard.*
3.  **Hardware Check:** Confirm they have:
    *   1x Tablet or Laptop (Manager/TPV).
    *   1x Tablet or Screen (Kitchen).
    *   Stable Wi-Fi.

## Phase 2: The Setup Call (30 Minutes)

1.  **Link:** Send the Deployment Link (`https://merchant-portal-....vercel.app`).
2.  **Account:** Have them create the generic "Owner" account.
3.  **Payment:** Guide them through the Stripe Subscription (or bypass via DB if agreed).
4.  **Menu Verification:** Show them the menu you pre-filled. "Is this correct?".
5.  **Printer (Optional):** If they need thermal printing, install the `ChefIApp Bridge` (native app) - *Not available in MVP Web*.

## Phase 3: The Drill (Simulation)

Ask them to do exactly this:
1.  "Open a table."
2.  "Add a Coca-Cola."
3.  "Send to Kitchen." (Look at the Kitchen Screen).
4.  "Ask for the bill."
5.  "Close the table (Cash)."

> *If they can do this loop without asking for help, they are graduated.*

## Phase 4: Support Handoff

*   **WhatsApp:** Add them to the "ChefIApp VIP Support" group.
*   **Promise:** "If it breaks, message us. We answer in 5 minutes."
