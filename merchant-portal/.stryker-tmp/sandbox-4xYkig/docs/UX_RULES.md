# ChefIApp UX Constitution (v1.0)
> "The Law of the Land" - Rules that cannot be broken by future features.

## 1. The Architecture of Modes
The application is strictly divided into two sovereign modes. A page cannot exist in "limbo".

### 🟢 Operational Mode (TPV)
- **Layout**: `OperationalLayout` (Alias of TPVLayout).
- **Context**: High stress, fast pace, low cognitive load.
- **Rules**:
    - No scrolling (screen-fit).
    - Hard dark backgrounds (`#000` or `zinc-900`).
    - No management features (Sidebar, Settings).
    - **Single Primary Action** per screen.

### 🔵 Administrative Mode (Manager)
- **Layout**: `AdminLayout`.
- **Context**: Deep work, analysis, configuration.
- **Rules**:
    - **Sidebar**: Always visible.
    - **Scannability**: Use `Card` lists and `DataGrid`.
    - **Tokens**: Use semantic colors (`action`, `warning`, `success`).
    - **Legacy Ban**: No `core-status-banner` or inline HTML styles.

---

## 2. Layout Sovereignty Rule (The "Anti-Float" Law)
Every page MUST be wrapped in a layout.
- **Violations**: `<div><Header /> ... </div>` is ILLEGAL.
- **Enforcement**:
    - `Menu`, `Team`, `Dashboard`, `Reports`, `Settings` **MUST** use `AdminLayout`.
    - `POS`, `KDS` **MUST** use `OperationalLayout`.

---

## 3. Admin Functional Rule (The "State" Law)
Administrative interfaces must be deterministic functions of state.

- **UI never decides state**.
    - ❌ Wrong: `if (variable) return <Banner />`
    - ✅ Right: `switch (state.mode) { case 'DRAFT': return <DraftView /> }`
- **Global Banners are Forbidden in Admin**.
    - Do not use fixed headers for alerts.
    - Use **Contextual Cards** (e.g., a "Draft Node" card at the top of the content).

### Regulated States (Menu & Config)
Pages like Menu must implement strict states:
1.  **EMPTY**: Zero state with aggressive CTA ("Bootstrap").
2.  **DRAFT**: Content exists but is private (Visual Indicator: Warning Card).
3.  **ACTIVE**: Content is public and live.
4.  **LOCKED**: Feature blocked by plan/permission.
5.  **ERROR**: System failure (not empty).

---

## 4. Primitives Sovereignty
Do not invent UI. Use the Design System.
- **Text**: Use `<Text>` (never `<p>`, `<h1>`, `<span>`).
- **Containers**: Use `<Card>` (never `div` with border).
- **Actions**: Use `<Button>` (never `button` class `btn`).
- **Feedback**: Use `<Badge>` or `<EmptyState>`.

Any deviation requires a new Primitive in `ui/design-system/primitives/`.
