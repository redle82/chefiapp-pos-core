# Backlog — issues sugeridas (2026-02)

Lista derivada da [AUDITORIA_REFATORACAO_2026_02.md](AUDITORIA_REFATORACAO_2026_02.md) (secção 4.2). Usar para criar issues no GitHub quando houver capacidade.

---

## 1. Onboarding — IdentitySection

**Título:** `[onboarding] Implementar lógica real em IdentitySection`

**Descrição:**
- Área: Onboarding / IdentitySection.
- TODO no código: "Implementar lógica real".
- Prioridade: média (se onboarding for crítico para venda).
- Etiquetas sugeridas: `onboarding`, `frontend`.

---

## 2. Owner pages — Integrar com Core

**Título:** `[core] Integrar VisionPage, SimulationPage, StockRealPage, PurchasesPage com Core`

**Descrição:**
- Páginas: Owner/VisionPage, SimulationPage, StockRealPage, PurchasesPage.
- TODO no código: "Integrar com Core" / dados reais.
- Prioridade: baixa (funcionalidade futura).
- Etiquetas sugeridas: `backend`, `core`, `owner`.

---

## 3. TableContext — Realtime

**Título:** `[core] Configurar proxy reverso para Realtime em TableContext`

**Descrição:**
- Área: TableContext.
- TODO no código: "Configurar proxy reverso para Realtime".
- Prioridade: baixa.
- Etiquetas sugeridas: `backend`, `core`, `realtime`.

---

## 4. AdminPlaceholderPage (quando houver páginas reais)

**Título:** `[admin] Substituir AdminPlaceholderPage por páginas reais`

**Descrição:**
- 3 rotas em `routes/OperationalRoutes.tsx` usam AdminPlaceholderPage (ex.: admin/payments/refunds, admin/payments/pending, admin/reports/staff).
- Quando existirem páginas reais, trocar o placeholder e remover AdminPlaceholderPage dessas rotas.
- Etiquetas sugeridas: `admin`, `frontend`.

---

**Fonte:** Auditoria de refatoração 2026-02. Criar issues conforme prioridade do backlog.
