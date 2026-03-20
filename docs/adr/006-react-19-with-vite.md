# ADR-006: React 19 with Vite

## Status

Accepted

## Context

We needed a frontend framework and build tool for a large, multi-surface SPA
that serves 6 different user interfaces (POS, KDS, Admin, Staff App, QR
Ordering, Reservations). The choice needed to support:

- Fast development builds (the codebase has ~60 core modules)
- Code splitting per surface (lazy-loaded feature modules)
- TypeScript 5.9 with strict mode
- Mobile deployment via Capacitor
- Modern React patterns (hooks, context, concurrent features)

## Decision

We chose **React 19** + **Vite** + **TypeScript 5.9** + **Tailwind CSS 4**.

- **React 19** -- provides `useSyncExternalStore` natively (used by Zustand
  stores), improved concurrent rendering, and the latest hooks API. We
  shimmed `use-sync-external-store` to use React 19's native implementation
  (see `shims/`).
- **Vite** -- fast HMR in development, Rollup-based production builds with
  tree-shaking and code splitting. Path aliases (`@domain`, `@infra`,
  `@features`, `@shared`, `@core`) are configured in Vite.
- **TypeScript 5.9** -- strict mode enabled, providing strong type safety
  across the domain layer and infrastructure adapters.
- **Tailwind CSS 4** -- utility-first styling with a design token system
  (`ui/design-system/tokens.ts`, `tokens.css`).
- **Capacitor 8** -- wraps the SPA for native mobile deployment (AppStaff
  surface on iOS/Android).

## Consequences

**Positive:**
- Sub-second HMR during development, even with 60+ core modules
- Native `useSyncExternalStore` eliminates external polyfill issues
- Vite's code splitting naturally aligns with our surface/feature architecture
- TypeScript strict mode catches errors at compile time
- Tailwind eliminates CSS specificity wars and enables consistent design
- Single codebase deploys to web and mobile (via Capacitor)

**Negative:**
- React 19 is recent; some third-party libraries needed compatibility patches
- Vite's Rollup-based builds can be slower than esbuild for very large bundles
- Tailwind utility classes can make JSX verbose
- Capacitor adds a native build step and platform-specific debugging
- Strict TypeScript requires more upfront type definitions
