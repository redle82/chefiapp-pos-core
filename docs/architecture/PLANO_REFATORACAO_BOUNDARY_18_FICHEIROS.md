# Plano de refatoração progressiva — 18 ficheiros (check 2 do auditor)

**Status:** Guia de refatoração (não contrato)  
**Propósito:** Reduzir a dívida técnica flagada pelo auditor-soberania.sh (check 2: escrita/acesso ao Core fora do boundary) sem tocar no Core (Docker/PostgREST).  
**Referência:** [AUDITOR_MUDANCAS_SOBERANIA.md](./AUDITOR_MUDANCAS_SOBERANIA.md), [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) (secção 12: Fronteira Core/Runtime/UI).

**Regra de ouro:** Escrita e leitura em `gm_restaurants`, `orders`, `payments` só via **RuntimeReader**, **RuntimeWriter** ou **DbWriteGate**. Exceção documentada: **BootstrapPage** (1º restaurante).

---

## Lista dos 18 ficheiros (por domínio)

| Domínio | Ficheiros |
|---------|-----------|
| **Tenant** | `core/tenant/TenantContext.tsx`, `core/tenant/TenantResolver.ts`, `core/tenant/withTenant.ts` |
| **Billing** | `core/billing/coreBillingApi.ts` |
| **Fiscal** | `core/fiscal/FiscalService.ts` |
| **Auth / Plan** | `core/auth/PlanContext.tsx` |
| **Menu** | `core/menu/DynamicMenu/DynamicMenuService.ts` |
| **Kernel / Setup** | `core/kernel/GenesisRealityCheck.ts`, `core/kernel/SystemsRegistry.ts`, `core/wizardProgress.ts` |
| **Sync / Monitoring** | `core/sync/useNetworkStatus.ts`, `core/monitoring/healthCheck.ts` |
| **Services** | `core/services/WebOrderingService.ts` |
| **Adapter** | `core/adapter/empire-pulse.ts` |
| **Scripts / ferramentas** | `core/scripts/verify_recipe_deduction.ts` |
| **Onboarding (UI)** | `pages/Onboarding/sections/LocationSection.tsx`, `pages/Onboarding/sections/IdentitySection.tsx` |

---

## Fases (sem tocar no Core)

### Fase 1 — Consolidar a boundary (pré-requisito)

**Objetivo:** Garantir que RuntimeReader, RuntimeWriter e DbWriteGate expõem todas as operações necessárias para os 18 ficheiros.

- Revisar **RuntimeReader** / **RuntimeWriter** (e DbWriteGate) para:
  - Leitura de `gm_restaurants` (por id, por user, etc.) já coberta?
  - Leitura de `orders` / `payments` onde aplicável?
  - Escrita em `gm_restaurants` (update de campos permitidos) já coberta?
- Documentar na boundary a API pública (o que cada módulo pode pedir).
- **Não alterar** ainda os 18 ficheiros; só preparar a boundary.

**Entregável:** Lista de funções/hooks da boundary que cada ficheiro passará a usar (ou nota "já usa boundary" onde for o caso).

---

### Fase 2 — Tenant (3 ficheiros)

**Ficheiros:** `TenantContext.tsx`, `TenantResolver.ts`, `withTenant.ts`

- **TenantContext.tsx** e **TenantResolver.ts:** Hoje leem `gm_restaurants` (e possivelmente members) via Supabase direto. Substituir por:
  - Chamadas a **RuntimeReader** (ou API de tenant já existente que use a boundary) para obter restaurantes do utilizador e dados mínimos.
- **withTenant.ts:** Exemplo/documentação que usa `orders`; garantir que qualquer acesso a Core seja via boundary (RuntimeReader ou serviço que use boundary).
- Ordem sugerida: TenantResolver → TenantContext → withTenant (Resolver é mais baixo nível; Context consome; withTenant é HOC/wrapper).

**Risco:** Tenant é sensível (gates, select-tenant). Testes existentes (TenantResolver.test.ts, SelectTenantPage) devem continuar a passar.

---

### Fase 3 — Billing, Fiscal, Auth/Plan (3 ficheiros)

**Ficheiros:** `coreBillingApi.ts`, `FiscalService.ts`, `PlanContext.tsx`

- **coreBillingApi.ts:** Ler/atualizar dados de restaurante para billing apenas via RuntimeWriter ou DbWriteGate (conforme contrato de billing). Não chamar `supabase.from('gm_restaurants')` direto.
- **FiscalService.ts:** Idem; acesso a dados de restaurante via boundary.
- **PlanContext.tsx:** Ler plano/restaurante via RuntimeReader ou hook que use boundary.

**Entregável:** Cada ficheiro deixa de importar Supabase para estas tabelas; usa apenas boundary ou hooks que encapsulam boundary.

---

### Fase 4 — Menu, Kernel, Wizard, Sync, Monitoring (6 ficheiros)

**Ficheiros:** `DynamicMenuService.ts`, `GenesisRealityCheck.ts`, `SystemsRegistry.ts`, `wizardProgress.ts`, `useNetworkStatus.ts`, `healthCheck.ts`

- **DynamicMenuService.ts:** Acesso a `gm_restaurants` (e afins) via RuntimeReader ou serviço de menu que use boundary.
- **GenesisRealityCheck.ts**, **SystemsRegistry.ts**, **wizardProgress.ts:** Leituras de restaurante/setup via RuntimeReader; escritas de setup via RuntimeWriter (já existe upsertSetupStatus, etc.).
- **useNetworkStatus.ts**, **healthCheck.ts:** Leituras ligeiras (ex.: existência de restaurante) via RuntimeReader ou health API que use boundary.

**Nota:** Kernel e wizard são críticos para bootstrap/onboarding; validar com testes existentes e fluxo de criação de restaurante.

---

### Fase 5 — WebOrderingService, Adapter, Scripts (3 ficheiros)

**Ficheiros:** `WebOrderingService.ts`, `empire-pulse.ts`, `verify_recipe_deduction.ts`

- **WebOrderingService.ts:** Já deve usar Core para pedidos; garantir que qualquer acesso a `gm_restaurants` (ex.: dados do restaurante para o pedido) seja via RuntimeReader ou boundary.
- **empire-pulse.ts:** Adapter externo; se lê `orders` ou dados Core, fazer via boundary ou API interna que use boundary.
- **verify_recipe_deduction.ts:** Script de ferramenta; pode ser tratado como exceção documentada (tooling) ou migrado para usar cliente boundary se for usado em runtime.

**Decisão:** Scripts e adapters podem ficar como "exceção documentada" na v1 do auditor (lista de paths a ignorar no check 2) em vez de refatorar já; prioridade são Tenant, Billing, Fiscal, Auth, Menu, Kernel, Sync, Monitoring e Onboarding.

---

### Fase 6 — Onboarding UI (2 ficheiros)

**Ficheiros:** `LocationSection.tsx`, `IdentitySection.tsx`

- Ambos em **pages/Onboarding/sections/**; hoje usam `supabase.from('gm_restaurants')` para ler/escrever dados do restaurante no wizard.
- Substituir por:
  - **Leitura:** hooks ou RuntimeReader (dados do restaurante já carregados no Runtime? ou pedir à boundary).
  - **Escrita:** RuntimeWriter ou DbWriteGate (update de restaurante) — nunca Supabase direto na UI.
- Garantir que o fluxo de onboarding (criação/edição de restaurante após bootstrap) continua a funcionar; testes manuais ou E2E do fluxo de criação de restaurante.

---

## Ordem recomendada de execução

1. **Fase 1** (boundary) — pré-requisito.  
2. **Fase 2** (Tenant) — alto impacto; gates e select-tenant dependem.  
3. **Fase 6** (Onboarding UI) — visível e alinhado com regra "UI nunca escreve direto".  
4. **Fase 3** (Billing, Fiscal, Auth/Plan).  
5. **Fase 4** (Menu, Kernel, Wizard, Sync, Monitoring).  
6. **Fase 5** (WebOrderingService, Adapter, Scripts) — ou documentar como exceções e adiar.

---

## Critérios de conclusão por ficheiro

- [ ] Ficheiro não contém `supabase.from('gm_restaurants')`, `.from('orders')`, `.from('payments')` (exceto se for exceção documentada).
- [ ] Leituras/escritas dessas tabelas passam por RuntimeReader, RuntimeWriter ou DbWriteGate (ou hook/serviço que os use).
- [ ] Testes existentes passam; fluxos críticos (bootstrap, select-tenant, onboarding, billing, publish) validados.

---

## O que este plano não faz

- **Não altera** o Core (Docker, PostgREST, schema, migrations).
- **Não altera** o contrato do auditor (exceções continuam a ser RuntimeWriter, DbWriteGate, BootstrapPage; scripts/adapters podem ser adicionados como exceção se a equipa decidir).
- **Não define** prazos; é um guia para refatoração progressiva, ao ritmo da equipa.

---

## Referências

- [AUDITOR_MUDANCAS_SOBERANIA.md](./AUDITOR_MUDANCAS_SOBERANIA.md) — contrato do auditor; check 2.
- [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) — secção 12 (Fronteira Core/Runtime/UI), secção 11 (Soberania de dados).
- `./scripts/auditor-soberania.sh` — executar após alterações para verificar que não há novas violações.
