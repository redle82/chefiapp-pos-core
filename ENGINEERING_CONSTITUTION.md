# ENGINEERING CONSTITUTION 📜
> **The Operating System of ChefIApp Engineering.**
> Effective immediately.

## 1. NON-NEGOTIABLE PRINCIPLES 🧠
1.  **Code > Documents > Ideas.**
    *   An idea not in code is hallucination.
    *   Code not deployed is waste.
2.  **Definition of Done:**
    *   ✅ Committed (Clean Git Status).
    *   ✅ Tested (Builds + Runs).
    *   ✅ Deployed (or explicitly Justified).
3.  **Backend is Authority.** Frontend is merely a projection of the state.
4.  **Database is the Source of Truth.**
5.  **Reversibility.** Nothing enters that cannot be rolled back.

## 2. OPERATIONAL RULES ⚙️
- **The "Clean State" Law**: You cannot declare a task finished if `git status` is dirty.
- **The "Commit" Law**: Messages must follow `type(scope): description`.
    - *Example*: `feat(pos): add offline queue support`
- **The "Validation" Law**: "It works on my machine" is not valid. It must work in the Build.

## 3. THE DAILY FLOW (STANDARD WORK) 🔁
1.  `git pull` (Sync with Reality)
2.  **Implement** (Change Reality)
3.  **Test** (Verify Reality)
    - `npm run typecheck`
    - `npm run build`
4.  `git commit` (Save Reality)
5.  **DEPLOY** (Ship Reality)
6.  **Update Roadmap** (`PROXIMOS_PASSOS.md`)

## 4. MINIMUM VIABLE TESTS 🧪
Before merging or finishing:
- [ ] **Build Pass**: `npm run build` must succeed.
- [ ] **Lint Pass**: `npm run lint` must succeed.
- [ ] **Smoke Test**: The App must open and navigate to the new feature.
- [ ] **Console check**: No new `console.error` red lines.

## 5. HYGIENE & MAINTENANCE 🧹
- **Tmp Files**: Delete them or move to `_archive/`.
- **Logs**: Never commit `*.log` or debug dumps.
- **Dead Code**: If it's commented out, delete it. Git has history.

## 6. THE GOLDEN DEPLOY RULE 🚀
> **"Where is it deployed?"**

- If the task changed behavior, **it must be deployed**.
- If it is not deployed, you must create a `DEPLOY_BLOCKER` issue or entry in `docs/DEPLOY_LOG.md`.
- **Ambiguity is the enemy.** "Almost done" = "Not done".
