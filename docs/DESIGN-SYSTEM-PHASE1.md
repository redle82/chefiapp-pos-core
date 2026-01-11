# Design System — Phase 1 Hardening

> **Status:** Complete
> **Date:** 2025-12-25

---

## Overview

Phase 1 DS Hardening migrates all hardcoded values to a unified token system, ensuring consistency across the application and enabling future theming capabilities.

---

## What Changed

### 1. Enhanced Token System (`tokens.ts`)

**New additions:**
- `Brand` — ChefIApp Gold color palette with gradients and shadows
- `Colors.surface` — Dark theme surface colors (base, elevated, overlay, borders)
- `Colors.text` — Text color hierarchy (primary, secondary, tertiary, disabled)
- `Colors.status` — Semantic colors with bg/border/text variants
- `Opacity` — Helper functions for rgba generation
- `Typography.h1-h4` — Heading scale for consistent typography
- `LegacyColorMap` — Migration reference for old hardcoded values

### 2. CSS Custom Properties (`tokens.css`)

A comprehensive CSS variables file with:
- 100+ custom properties covering all design tokens
- Utility classes for common patterns
- Component-specific tokens (input, button, card, badge)

### 3. Migrated Files

| File | Status | Changes |
|------|--------|---------|
| `index.css` | Migrated | Imports tokens.css, uses CSS variables |
| `App.css` | Migrated | All hardcoded values replaced with tokens |

---

## Token Categories

### Brand Colors

```typescript
import { Brand } from '@/ui/design-system';

// ChefIApp Gold
Brand.gold.DEFAULT  // #C9A227
Brand.gold.light    // #E8C547
Brand.gold.dark     // #B8922A
Brand.gold.gradient // linear-gradient(...)
Brand.gold.glow     // box-shadow for primary buttons
```

### Surface Colors (Dark Theme)

```css
--surface-base: #1A1A1A;          /* Page background */
--surface-elevated: rgba(255, 255, 255, 0.03);  /* Cards */
--surface-overlay: rgba(255, 255, 255, 0.04);   /* Hover */
--surface-border: rgba(255, 255, 255, 0.08);    /* Borders */
--surface-border-hover: rgba(255, 255, 255, 0.12);
--surface-border-active: rgba(255, 255, 255, 0.15);
```

### Text Colors

```css
--text-primary: rgba(255, 255, 255, 0.87);   /* Main content */
--text-secondary: rgba(255, 255, 255, 0.60); /* Muted text */
--text-tertiary: rgba(255, 255, 255, 0.40);  /* Placeholders */
--text-disabled: rgba(255, 255, 255, 0.25);  /* Disabled */
```

### Status Colors

```css
/* Success */
--status-success-bg: rgba(34, 197, 94, 0.12);
--status-success-border: rgba(34, 197, 94, 0.25);
--status-success-text: #22C55E;

/* Warning */
--status-warning-bg: rgba(251, 191, 36, 0.12);
--status-warning-border: rgba(251, 191, 36, 0.25);
--status-warning-text: #FBBF24;

/* Error */
--status-error-bg: rgba(239, 68, 68, 0.12);
--status-error-border: rgba(239, 68, 68, 0.25);
--status-error-text: #EF4444;

/* Primary (Gold) */
--status-primary-bg: rgba(201, 162, 39, 0.12);
--status-primary-border: rgba(201, 162, 39, 0.25);
--status-primary-text: #C9A227;
```

### Spacing Scale

```css
--spacing-0: 0px;
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-10: 10px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-18: 18px;
--spacing-xl: 24px;
--spacing-28: 28px;
--spacing-2xl: 32px;
--spacing-3xl: 48px;
--spacing-4xl: 64px;
```

---

## Usage Examples

### In CSS Files

```css
.my-card {
  background: var(--surface-elevated);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.my-card:hover {
  border-color: var(--surface-border-hover);
}

.my-button {
  background: var(--gradient-brand);
  box-shadow: var(--shadow-brand);
  border-radius: var(--radius-10);
  padding: var(--spacing-10) var(--spacing-md);
}
```

### In TypeScript/React

```typescript
import { Colors, Brand, Spacing, cn } from '@/ui/design-system';

// Using tokens directly
const style = {
  backgroundColor: Colors.surface.elevated,
  borderColor: Colors.surface.border,
  padding: Spacing.lg,
};

// Using Brand colors
const primaryButtonStyle = {
  background: Brand.gold.gradient,
  boxShadow: Brand.gold.glow,
};

// Using cn for conditional classes
<div className={cn('card', { 'card--active': isActive })} />
```

### Utility Classes

```html
<!-- Text colors -->
<p class="text-primary">Main content</p>
<p class="text-secondary">Muted text</p>
<p class="text-brand">Gold accent</p>

<!-- Backgrounds -->
<div class="bg-elevated">Card</div>
<div class="bg-success">Success message</div>

<!-- Spacing -->
<div class="p-lg gap-sm">Padded with gap</div>

<!-- Border radius -->
<div class="rounded-md">Medium radius</div>
```

---

## Migration Guide

### Finding Legacy Values

Use `LegacyColorMap` to find the correct token for old hardcoded values:

```typescript
import { LegacyColorMap } from '@/ui/design-system';

// Old: rgba(255, 255, 255, 0.87)
// New: var(--text-primary)
LegacyColorMap['rgba(255, 255, 255, 0.87)'] // 'var(--text-primary)'

// Old: rgba(80, 200, 120, 0.35)
// New: var(--status-success-border)
LegacyColorMap['rgba(80, 200, 120, 0.35)'] // 'var(--status-success-border)'
```

### Common Replacements

| Old Pattern | New Token |
|-------------|-----------|
| `rgba(255, 255, 255, 0.87)` | `var(--text-primary)` |
| `rgba(255, 255, 255, 0.12)` | `var(--surface-border)` |
| `rgba(255, 255, 255, 0.04)` | `var(--surface-elevated)` |
| `rgba(100, 108, 255, 0.18)` | `var(--status-primary-bg)` |
| `rgba(80, 200, 120, 0.12)` | `var(--status-success-bg)` |
| `rgba(255, 180, 80, 0.12)` | `var(--status-warning-bg)` |
| `rgba(255, 80, 80, 0.1)` | `var(--status-error-bg)` |
| `#C9A227` | `var(--color-primary)` |
| `#646cff` | `var(--color-primary)` (migrated to gold) |

---

## Files Reference

```
merchant-portal/src/ui/design-system/
├── tokens.ts         # TypeScript token definitions
├── tokens.css        # CSS custom properties
├── index.ts          # Design system exports
└── [components]/     # DS components
```

---

## Next Steps (Phase 2)

1. **Component Migration** — Replace legacy CSS classes with DS components
2. **ARIA Enhancement** — Add missing accessibility attributes
3. **Storybook Integration** — Document all components visually
4. **Dark/Light Theming** — Prepare for multi-theme support

---

## Validation

To verify the migration:

1. Build the application: `npm run build`
2. Check for CSS errors in console
3. Visual regression test on all pages
4. Ensure no hardcoded hex values remain in new code

---

*Phase 1 DS Hardening complete. System is now token-based.*
