# 🛰️ ANTIGRAVITY FULL UI/UX TRUTH AUDIT PROMPT

**Operator**: AntiGravity
**Target System**: ChefIApp (v1.0.0 – Truth Freeze+)
**Doctrine**: `SYSTEM_TRUTH_CODEX.md`
**Mission Type**: Full UI / UX / Flow Audit

---

## 🎯 PRIMARY OBJECTIVE
Navegar por TODO o sistema, do primeiro contato até a operação avançada, avaliando UI e UX como consequência do estado real do sistema, garantindo que:
- Nenhuma tela mente
- Nenhuma ação antecipa sucesso
- Nenhum usuário fica confuso sobre o que é real, pendente, offline ou demo

---

## 🧭 AUDIT FLOW (MANDATORY ORDER)

### 🅰️ PHASE A — ENTRY & PROMISE (Marketing → Expectation)
**Scope**: Landing Page, Entry points (CTA, Login, Onboarding).
**Validate**:
- O que o sistema promete?
- A promessa é clara ou exagerada?
- Existe “teatro” (loaders, delays, copy) que pode gerar falsa expectativa?
**Verdict**: `🎭 Theater` | `⚠️ Ambiguous Promise` | `❌ UX Lie`

### 🅱️ PHASE B — ONBOARDING & TRUTH ZERO
**Scope**: Onboarding flow, Health check gating, Backend errors (503/DOWN).
**Validate**:
- Onboarding bloqueia corretamente quando Core = DOWN?
- O motivo do bloqueio é explicado de forma humana?
- Existe CTA honesto (Retry / Support / Demo)?
**Verdict**: `✅ Truth Zero Respected` | `❌ Zombie Onboarding Detected`

### 🅲 PHASE C — SETUP & CONFIGURATION (Merchant Portal)
**Scope**: Setup Wizard, Ghost Preview vs Live Preview.
**Validate**:
- O usuário sabe quando está vendo preview vs real?
- O sistema explica dependências (backend, publish, sync)?
- Não há “fake progress” ou animações enganosas?

### 🅳 PHASE D — TPV (OPERATION CORE)
**Scope**: TPV UI, Order lifecycle, Offline/Online transitions, Error & Retry flows.
**Validate**:
- Estados visuais batem exatamente com estados do Core?
- “Queued”, “Syncing”, “Applied”, “Failed” são claros?
- Retry é explícito e sob controle humano?

### 🅴 PHASE E — APPSTAFF (Worker / Manager / Owner)
**Scope**: Worker View, Manager View, Owner View.
**Validate**:
- Está explicitamente rotulado como PREVIEW / DEMO?
- Existe risco de o usuário achar que dados são reais?
- TruthBadge está sendo usado corretamente ou é decorativo?
**Verdict**: `🧪 Honest Prototype` | `❌ Potemkin UI (Unacceptable)`

### 🅵 PHASE F — DASHBOARD & ANALYTICS
**Scope**: KPIs, Charts, Summary cards.
**Validate**:
- Os dados são reais, mockados ou híbridos?
- O sistema deixa isso explícito?
- Estados offline refletem “waiting for sync”?

### 🅶 PHASE G — PUBLIC PAGE / CLIENT VIEW
**Scope**: Página pública, Menu, Live vs Not Published.
**Validate**:
- O que o cliente vê bate com o que o merchant configurou?
- Estados inválidos levam a 404 ou fallback honesto?

---

## 🧠 COGNITIVE AUDIT (MANDATORY)
**Questions**:
1. O usuário sabe onde está?
2. Ele sabe o que acabou de acontecer?
3. Ele sabe o que pode fazer agora?

**Rating**: `🟢 Calm & Clear` | `🟡 Acceptable Friction` | `🔴 Confusing / Stress Inducing`

---

## 📋 FINAL REPORT STRUCTURE
1. **Executive Summary** (UX Truth Score 0–10)
2. **What Works** (Truth Preserved)
3. **What Is Risky** (Ambiguity / Theater)
4. **What Is Missing** (UX Debt)
5. **Critical UX Risks** (P0 / P1)
6. **Recommendations** (Aligned with Codex)
7. **Open Questions**

---

## 🧊 NON-NEGOTIABLE RULE
If the UI cannot prove something happened:
- It must show pending
- It must show status
- It must offer honest actions

**No exceptions.**
