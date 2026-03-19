## 🛡️ Truth Codex Check
> *By submitting this PR, I certify that I have read `SYSTEM_TRUTH_CODEX.md` and this code complies with the Law.*

### 1. The 3 Laws
- [ ] **UI is Consequence**: No optimistic "success" toasts before `queue.add` or API confirmation.
- [ ] **Online = Fast Offline**: No split logic. Everything goes through the Queue/Reconciler.
- [ ] **Truth Zero**: No onboarding/critical actions if `useCoreHealth` is DOWN.

### 2. Implementation
- [ ] **Observability**: If this touches TPV/Orders, I have updated/verified the status badges/timeline.
- [ ] **Tests**: I have run `npm run test:truth` locally and it passes 100%.
- [ ] **Chaos (Manual)**: *Not required for PR*. Verified manually if this PR touches Core resilience.

### 3. Changes
<!-- Describe what you changed -->

### 4. Risk Assessment
<!-- Does this touch the 'Money' path? (Orders, Payments, Sessions) -->

### 5. Repo hygiene (optional)
- **CI / GitHub setup:** If this PR changes workflows or policies, see [`docs/ops/GITHUB_REPOSITORY_SETUP.md`](../docs/ops/GITHUB_REPOSITORY_SETUP.md).
