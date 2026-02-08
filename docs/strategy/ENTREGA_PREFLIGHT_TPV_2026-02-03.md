# Entrega — Preflight operacional e correção TPV (Core offline / Abrir Turno)

**Data:** 2026-02-03
**Objetivo:** Guiar o humano com clareza quando o Core está offline; corrigir "Abrir Turno" (sem redirect); preflight enterprise no Dashboard.

---

## 1. Lista de ficheiros alterados

| Ficheiro                                                        | Alteração                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `merchant-portal/src/core/readiness/preflightOperational.ts`    | **Novo.** Módulo Preflight: `computePreflight()`, tipos `PreflightBlockerCode`, `PreflightOperationalResult`, mensagens CORE_OFFLINE, NO_PUBLISHED_MENU, SHIFT_REQUIRED, CASH_REQUIRED, NO_IDENTITY.                                                                                                                                                                                                                                                                                                                      |
| `merchant-portal/src/core/readiness/usePreflightOperational.ts` | **Novo.** Hook `usePreflightOperational()` que usa `useCoreHealth`, `useRestaurantRuntime`, `useShift` e devolve resultado de `computePreflight()`.                                                                                                                                                                                                                                                                                                                                                                       |
| `merchant-portal/src/core/readiness/index.ts`                   | Export de `computePreflight`, tipos de preflight, `usePreflightOperational`.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `merchant-portal/src/pages/Dashboard/DashboardPortal.tsx`       | Cartão **Operação**: status (Pronto/Bloqueado), lista de blockers, botão "Abrir TPV" (só habilitado sem CORE_OFFLINE e com menu publicado), links Menu Builder / Configurar identidade / **Ver instruções (Core offline)**.                                                                                                                                                                                                                                                                                               |
| `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx`           | (1) **Abrir Turno:** não redireciona para /dashboard; se Core offline → toast "Core offline — não é possível abrir turno agora." e fica no TPV; se Core online → chama RPC `open_cash_register_atomic`, refresh shift, toast sucesso/erro. (2) **Produtos vazios:** Core offline → "Core offline. Sem catálogo carregado. Inicie o Core para operar." + link "Ver instruções" (/app/runbook-core); Core UP e sem produtos → "Nenhum produto disponível" + link Menu Builder. (3) ToastContainer + useToast para feedback. |
| `merchant-portal/src/pages/RunbookCorePage.tsx`                 | **Novo.** Página /app/runbook-core com instruções para subir e verificar o Core local (resumo do runbook).                                                                                                                                                                                                                                                                                                                                                                                                                |
| `merchant-portal/src/App.tsx`                                   | Rota `/app/runbook-core` → `RunbookCorePage`; import de `RunbookCorePage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `docs/ops/RUNBOOK_CORE_LOCAL.md`                                | **Novo.** Runbook: como subir docker-core, verificar saúde (PostgREST), confirmar restaurante e menu publicado, reset de volume.                                                                                                                                                                                                                                                                                                                                                                                          |

---

## 2. Comportamento antes / depois

### Antes

- **Core offline:** TPV mostrava "Nenhum produto disponível" sem distinguir falha de rede de catálogo vazio; parecia que "tudo estava quebrado".
- **Abrir Turno:** O botão redirecionava para `/dashboard` em vez de abrir o turno; dava sensação de crash/loop.
- **Dashboard:** Não havia um único lugar com status operacional (pronto/bloqueado) e lista de blockers acionáveis.
- **Sem runbook:** Não havia doc interno ligado ao estado "Core offline".

### Depois

- **Core offline:** TPV mostra estado explícito "Core offline. Sem catálogo carregado. Inicie o Core para operar." e botão "Ver instruções" → /app/runbook-core. Dashboard mostra blockers e CTA "Ver instruções (Core offline)".
- **Abrir Turno:** Se Core offline → toast de aviso, utilizador permanece no TPV. Se Core online → RPC `open_cash_register_atomic`, refresh do turno, toast de sucesso ou erro; não há redirect automático para dashboard.
- **Dashboard:** Cartão "Operação" com status Pronto/Bloqueado, lista de blockers e botões: Abrir TPV (só quando não há CORE_OFFLINE e menu publicado), Menu Builder, Configurar identidade, Ver instruções quando Core offline.
- **Runbook:** `docs/ops/RUNBOOK_CORE_LOCAL.md` + página /app/runbook-core com resumo; ligado no Dashboard e no TPV (estado CORE_OFFLINE).

---

## 3. Validação

### Testes

- `npm test -- --run` no merchant-portal: **21 ficheiros passaram, 103 testes passaram** (6 skipped).
- `bash scripts/check-financial-supabase.sh`: **PASSED** (sem uso Supabase no domínio financeiro).

### Evidência manual sugerida

1. **Core OFFLINE:**

   - Parar o Core (`docker compose -f docker-compose.core.yml down`).
   - Abrir `/dashboard`: cartão Operação deve mostrar "Bloqueado", blocker "Core está offline...", botão "Ver instruções (Core offline)". "Abrir TPV" desativado.
   - Abrir `/op/tpv`: mensagem "Core offline. Sem catálogo carregado..." e link "Ver instruções". Clicar "Abrir Turno" → toast "Core offline — não é possível abrir turno agora."; permanece no TPV.

2. **Core ONLINE:**
   - Subir o Core (`docker compose -f docker-compose.core.yml up -d`).
   - Dashboard: com restaurante publicado e caixa aberto, Operação deve mostrar "Pronto" e "Abrir TPV" ativo.
   - TPV: produtos carregam; criar pedido ao adicionar item; "Abrir Turno" (se caixa fechado) chama RPC e mostra toast; sem redirect para dashboard.

---

## 4. Regras respeitadas

- Nenhuma alteração às regras de negócio; apenas UX de preflight e correção de navegação/erro.
- Nenhum atalho que falsifique operação real.
- Supabase não reintroduzido no domínio financeiro (check-financial-supabase passou).
- Testes existentes mantidos a passar.
