# Prompt — Unificação total do Design System

**Uso:** Copiar e colar este prompt no Cursor para executar a auditoria e refactor de todas as superfícies de UI, de acordo com o [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) e o [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md).

---

## Prompt (copiar abaixo)

```
Context:
@docs/architecture/CORE_CONTRACT_INDEX.md
@docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md
@core-design-system/README.md
@docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
@docs/architecture/CONTRACT_ENFORCEMENT.md
@docs/architecture/DESIGN_SYSTEM_COVERAGE.md

The ChefIApp OS has a formal Core Design System contract.
The Design System is canonical, subordinate to the Core, and must cover all visible UI across all terminals:
- Landing
- Public Web (GloriaFood-like)
- Web Operational Command Center
- AppStaff (Expo iOS/Android)
- KDS
- TPV

Task:
1. Audit all UI surfaces in:
   - merchant-portal
   - mobile-app
   - KDSMinimal / TPVMinimal
2. Identify:
   - hardcoded colors
   - hardcoded spacing
   - hardcoded fonts
   - UI elements not using core-design-system tokens
3. Create (or update):
   - docs/architecture/DESIGN_SYSTEM_COVERAGE.md
     with a table listing each screen/component and whether it uses the Design System.
4. Refactor incrementally:
   - Replace hardcoded styles with tokens from @chefiapp/core-design-system.
   - Do NOT change layout authority (Shell still controls layout).
5. Ensure:
   - All buttons, inputs, cards, modals, lists, states (loading/error/offline/blocked)
     use Design System tokens or components.
6. Explicitly exclude:
   - Core financial logic
   - Permission logic
   - Runtime / sync / retry / queues
7. If a UI element cannot use the Design System:
   - Document it in DESIGN_SYSTEM_COVERAGE.md
   - Classify as: bug / technical debt / missing contract / architectural violation
8. Do not invent new visual rules.
   The Core Design System contract is the only source of truth.

Output:
- DESIGN_SYSTEM_COVERAGE.md (updated)
- Refactored UI using core-design-system tokens
- No visual regressions
```

---

## Prompt Restaurant OS 2026 (upgrade DS)

Para subir o Design System ao nível Restaurant OS 2026 (dark default, estados universais, tempo visível, tap targets 44–48px, hierarquia brutal, silêncio visual):

```
Context:
@docs/architecture/CORE_DESIGN_SYSTEM_CONTRACT.md
@core-design-system/README.md
@docs/architecture/CORE_OPERATIONAL_UI_CONTRACT.md
@docs/architecture/CORE_WEB_COMMAND_CENTER_CONTRACT.md
@docs/architecture/RESTAURANT_OS_DESIGN_PRINCIPLES.md

Goal:
Upgrade the ChefIApp Design System to a 2026-grade Restaurant OS Design System,
aligned with real-world cognitive, ergonomic and operational expectations
of waiters, kitchen staff, managers and owners.

Task:
1. Extend core-design-system with mandatory Restaurant OS principles:
   - Dark mode as default
   - High-contrast operational colors
   - Universal state system (normal, warning, critical, offline, blocked)
   - Time-first components (elapsed, SLA, delay)
   - Large tap targets (min 44–48px)
   - Clear hierarchy (one dominant state per screen)
   - Reduced visual noise
   - Stable grid and predictable layouts

2. Update tokens: operational colors, typography for distance readability,
   spacing for touch/stress, motion rules (minimal, only feedback).

3. Create/update RESTAURANT_OS_DESIGN_PRINCIPLES.md with section
   "Why this matches waiter mental models"; reference competitors
   (Toast, Lightspeed, Square) only at principle level.

4. Apply Design System to: Web Command Center, AppStaff, KDS, TPV, Web Public.

5. Ensure: no screen defines its own colors or spacing; all states via DS;
   Shell still controls layout authority.

Constraints: Do NOT change Core logic. Do NOT invent new UX paradigms.
Design System reveals, Core governs.
```

Ver [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md).

---

## Referências

- [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md)
- [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md)
- [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md)
- [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md)
