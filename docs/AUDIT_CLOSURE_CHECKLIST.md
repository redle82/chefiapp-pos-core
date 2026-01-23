# CHECKLIST DE FECHAMENTO DE AUDITORIA (JAN/2026)

Este documento consolida as tarefas restantes para zerar os apontamentos críticos e de risco médio do `QA_AUDIT_REPORT.md` e `STRATEGIC_COMPARISON_AND_PLAN.md`.

---

## 🔴 1. SEGURANÇA & DADOS (RLS) - "Blindagem"

*Motivo: O Frontend foi corrigido, mas o Banco de Dados ainda aceita comandos se alguém tiver a chave anon.*

- [x] **Criar Migration RLS: `20260222...hardening` (Applied)**
  - **Regra:** Apenas usuários com `role: 'manager'` ou `'owner'` podem fazer `INSERT/UPDATE` em `gm_cash_registers`.
  - **Status Atual:** HARDENED.
- [x] **Validar RLS: `gm_orders` (Multi-tenant)**
  - **Regra:** Garantir que um usuário da "Padaria A" não consiga ler pedidos do "Bar B".
  - **Ação:** Policies re-verified and deletions restricted to Managers.

## 🟠 2. LIMPEZA DE CÓDIGO (Hardening)

*Motivo: Código de teste foi deixado em produção ("Bypass").*

- [x] **Remover Bypass em `_layout.tsx`**
  - **Ação:** Function `AuthGate` (with insecure logic) deleted.
- [x] **Remover Bypass em `stripe-billing`**
  - **Ação:** Header `x-test-bypass` removed. Only Bearer Auth allowed.

## 🟡 3. UX & RESILIÊNCIA

*Motivo: Melhorar experiência em casos de falha.*

- [x] **Tratamento de Erro de Impressora**
  - **Ação:** Implemented visible Alerts in `OrderContext` + Specific Exceptions in `PrinterService`.
- [x] **Visualização de Mesas (Mapa)**
  - **Ação:** Refactored to Scalable Grid (FlatList) with visual indicators.

## Protocolo de Encerramento (Definition of Done)

1. Executar todas as tarefas acima.
2. Rodar o script `offline_load_test.ts` uma última vez.
3. Gerar build final (`eas build --profile production`).
