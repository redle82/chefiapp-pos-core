# PAGE TYPES AND TEMPLATES CONTRACT
## (ChefIApp Product DNA)

**Status:** CANONICAL  
**Type:** PRODUCT / ARCHITECTURE  
**Scope:** Page Archetypes, Templates, UX Boundaries  
**Hierarchy:** Subordinate to [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md)

---

## 1. Purpose

This contract defines **which types of pages exist in the ChefIApp ecosystem**,  
**what role each page plays**, and **which templates / stacks are appropriate per layer**.

It establishes a core rule:

> **The template does not define the product.  
> The role of the page defines the template.**

All design, routing, UX, and implementation decisions must follow this contract.

---

## 2. Reference Contracts

This document is cross-referenced by:

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md)
- [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md)
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md)
- [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md)
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md)
- [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md)

---

## 3. Canonical Page Archetypes

ChefIApp recognizes **exactly five (5) page archetypes**.

No page may exist outside these categories.

---

### A) Landing Page (Marketing / Conversion)

**Objective**
- Present the product
- Explain value
- Convert visitors into users

**Characteristics**
- Static or semi-static content
- CTA-driven
- No Runtime
- No RestaurantContext
- No Core access

**Typical Routes**
- `/`
- `/pricing`
- `/features`
- `/demo`
- `/signup`

**Status**
- Mandatory
- Not part of the operational system

**Boot Mode**
- PUBLIC

---

### B) Signup / Auth Pages

**Objective**
- Create account
- Authenticate user
- Transition from marketing to product

**Characteristics**
- Minimal UI
- Auth-only logic
- No restaurant lifecycle decisions

**Typical Routes**
- `/login`
- `/signup`
- `/forgot-password`

**Status**
- Mandatory
- Transitional layer

**Boot Mode**
- AUTH

---

### C) Admin Dashboard (Portal de Gestão) — *THIS IS THE SYSTEM*

**Objective**
- Manage the restaurant
- Configure the business
- Act as the operational cockpit

**Characteristics**
- Sidebar + topbar
- Multi-section navigation
- Forms, tables, configuration flows
- Always accessible after login
- Uses banners / checklists, never blocking gates

**Typical Routes**
- `/app/dashboard`
- `/app/restaurant`
- `/app/menu`
- `/app/people`
- `/app/payments`
- `/app/settings`
- `/app/publish`

**Status**
- ESSENTIAL
- Core of the product

**Boot Mode**
- MANAGEMENT

---

### D) Operational UI (TPV / KDS)

**Objective**
- Real-time operation
- Orders, payments, kitchen flow

**Characteristics**
- Fullscreen
- No sidebar
- Touch-first UX
- Performance-oriented
- Strict lifecycle gates

**Typical Routes**
- `/op/tpv`
- `/op/kds`
- `/op/cash`

**Status**
- ESSENTIAL
- Operational layer only

**Boot Mode**
- OPERATIONAL

---

### E) App Mobile (Staff)

**Objective**
- Enable staff execution (waiter / kitchen / floor)

**Characteristics**
- Native mobile app
- Simplified UI
- Task-driven
- Never part of web routing

**Typical Routes**
- Internal to mobile app only

**Status**
- Separate system
- Not accessible via web

**Boot Mode**
- STAFF_MOBILE

---

## 4. Recommended Stack and Templates (ChefIApp)

### Landing
- SaaS Landing templates
- Next.js or Astro
- Static-first

### Auth
- Minimal form templates
- Integrated with Auth provider

### Portal de Gestão
- Admin Dashboard templates
- React + Tailwind + Shadcn
- Sidebar-based layout

### TPV / KDS
- Custom Operational UI
- Fullscreen, no layout chrome
- Purpose-built components

### Staff Mobile
- Native mobile stack
- Independent from web templates

---

## 5. Anti-Patterns (STRICTLY FORBIDDEN)

The following are architectural violations:

- Using an Admin Dashboard as a landing page
- Using onboarding wizards as the main system
- Mixing TPV/KDS with sidebar-based layouts
- Using blog or content templates as management portals
- Letting templates dictate product behavior

---

## 6. Golden Rule

> **The page role defines the template.  
> The template never defines the product.**

Template selection must always be justified by the **page archetype and system layer**,  
never by trend, convenience, or technology hype.

---

## 7. Enforcement

Any new page, redesign, or UX change must:

1. Declare its archetype
2. Declare its boot mode
3. Comply with this contract

Non-compliant pages must not be merged.
