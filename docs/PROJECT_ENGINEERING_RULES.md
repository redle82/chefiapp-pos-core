# PROJECT ENGINEERING RULES
>
> Project: ChefIApp POS Core

This project adheres to the global `ENGINEERING_CONSTITUTION.md`. Below are the specific operational rules for this codebase.

## 1. Stack & Tech Decisions

- **Core**: React (Vite) + TypeScript.
- **State**: Context API (Keep it simple).
- **Styling**: Vanilla CSS (Performance first).
- **Backend/DB**: Supabase (PostgreSQL).

## 2. Directory Structure Authority

- `src/core/*`: Business Logic, Services, Adaptors. **No UI components here.**
- `src/components/*`: Reusable UI Components. **No complex business logic here.**
- `src/pages/*`: Route views. Orchestrates Core + Components.
- `supabase/migrations/*`: The only way to change the DB schema.

## 3. Specific Workflows

- **Migrations**: Always verify with `task_boundary` before applying.
- **Pixel/SEO**: All public pages MUST have SEO meta tags and Pixel events.
- **Payment**: Critical path. Any change to `PaymentService` requires manual regression test.

## 4. Automation Hooks

- **Lint**: `npm run lint` must pass before commit.
- **Build**: `npm run build` must pass before deploy.

---
*See `ENGINEERING_CONSTITUTION.md` for global rules.*
