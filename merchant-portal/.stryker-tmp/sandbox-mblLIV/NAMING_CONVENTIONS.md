# Naming Conventions

## Services (`/core/services/`)
- **Class-based services**: `*Service.ts` (e.g., `AuditLogService.ts`, `DashboardService.ts`)
- **Function-based modules**: descriptive name without suffix (e.g., `OrderProtection.ts`)

## UI Components
- **Design System Primitives**: `/ui/design-system/primitives/` (Badge, Text, Skeleton)
- **Domain Components**: `/ui/design-system/domain/` (domain-specific UI)
- **Layout Components**: `/ui/design-system/layouts/`
- **Hooks**: `/ui/hooks/` (all React hooks)

## Infrastructure
- **Database Gateway**: `/infra/docker-core/` (PostgREST client)
- **Readers**: `/infra/readers/` (read-only data access)
- **Writers**: `/infra/writers/` (write operations)

## Features (`/features/`)
```
features/<domain>/<feature>/
├── components/    # Feature-specific UI components
├── pages/         # Route pages
├── services/      # Feature service layer (business logic)
└── hooks/         # Feature-specific hooks (if needed)
```

## Tests (`/tests/`)
- Mirror source structure: `tests/unit/services/`, `tests/unit/core/`, etc.
- Test file: `<SourceFile>.test.ts`
