# Contributing directly to the Truth

> [!CAUTION]
> This repository is governed by **Strict Canon Law**.
> Violating architectural principles will result in immediate rejection by the CI Gates.

## The Doctrine (Read First)
Before writing a single line of code, you MUST read:
1. [SYSTEM_TRUTH_CODEX.md](./SYSTEM_TRUTH_CODEX.md) - The 3 Laws of TPV/Core (Truth First)
2. [CANON.md](./CANON.md) - The 6 Laws of AppStaff (Nervous System)

## Development Workflow

### 1. The Gates
We have two primary gates that protect the codebase:
- **Truth Gate**: Protects TPV integrity. No regressions allowed in offline capability.
- **Canon Gate**: Protects AppStaff design. No manual tasks, no cross-role breaches.

### 2. Branching Strategy
- `main`: The frozen core. Production ready.
- `opus/*`: Development branches for active Missions.

### 3. Commit Convention
We follow strict Conventional Commits focused on the Roadmap Missions:
- `feat(opus): ...`
- `fix(tpv): ...`
- `style(canon): ...`
- `refactor(logger): ...`

## Architectural Rules

### Logs (Sovereign Logger)
- **Do not use `console.log`**.
- Use `Logger` from `src/core/logger/Logger.ts`.
- Levels:
    - `info`: Local development interactions
    - `warn`: Recoverable issues
    - `error`: Logic failures
    - `critical`: System halts (sends to Supabase `app_logs`)

### State Management
- **TPV**: Use `OrderContextReal` (The Optimistic Queue).
- **AppStaff**: Use `StaffContext` (The Nervous System).

### UI
- Do not create new colors. Use `src/ui/design-system/tokens.ts`.
- Do not bypass `FlowGate` or `OperationGate`.

## Setup
```bash
npm install
npm run dev
```

## Testing
- **Unit/Integration**: `npm run test`
- **Truth Suite**: `npm run test:truth`

---
*By contributing, you agree to uphold the Truth First doctrine.*
