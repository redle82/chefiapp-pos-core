# Auditoria: Cobertura contrato ↔ código (contenção 48h)

**Data:** 2026-01-31
**Âmbito:** Quatro contratos de contenção 48h — mapeamento onde está implementado, onde pode vazar, o que falta de enforcement e que testes protegem.

**Contratos em causa:**

- [PILOT_MODE_RUNTIME_CONTRACT.md](../architecture/PILOT_MODE_RUNTIME_CONTRACT.md)
- [MENU_FALLBACK_CONTRACT.md](../architecture/MENU_FALLBACK_CONTRACT.md)
- [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](../architecture/OPERATIONAL_UI_RESILIENCE_CONTRACT.md)
- [ORDER_ORIGIN_CLASSIFICATION.md](../architecture/ORDER_ORIGIN_CLASSIFICATION.md)

**Índice de contratos:** [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md) §0d4 (Contenção 48h / Piloto).

---

## Resumo executivo

| Contrato | Implementado | Vazamentos | Enforcement em falta | Testes |
|----------|--------------|------------|----------------------|--------|
| PILOT_MODE_RUNTIME | Sim (menu; pilot local) | TPV piloto ainda escreve pedidos no Core via OrderWriter | Gate em OrderWriter para origin pilot; ou relaxar contrato (ORDER_ORIGIN) | Nenhum |
| MENU_FALLBACK | Sim (Core primeiro, fallback só em erro) | Risco: botão "Sincronizar pilot → Core" sem contrato | Nenhum teste que force falha de rede / valide fallback | Nenhum |
| OPERATIONAL_UI_RESILIENCE | Sim (ErrorBoundary /op/tpv, /op/kds; toUserMessage) | /op/staff sem ErrorBoundary explícito (RoleGate envolve) | Checklist/lint: nova rota /op/ exige ErrorBoundary | Nenhum que force ErrorBoundary |
| ORDER_ORIGIN_CLASSIFICATION | Parcial (TPV/Waiter passam origin; OrderWriter envia) | Core persiste pedidos pilot; relatórios/filtros por origem não existem | Gate opcional; filtros em relatórios; contrato é parcial | Nenhum |

---

## 1. PILOT_MODE_RUNTIME_CONTRACT

### Onde está implementado

- [merchant-portal/src/core-boundary/menuPilotFallback.ts](../../merchant-portal/src/core-boundary/menuPilotFallback.ts): `KEY_PREFIX chefiapp_menu_pilot_`, `getPilotProducts`, `addPilotProduct`, `isNetworkError`. Estado piloto de menu vive em localStorage; nenhum código promove pilot → Core.
- [ProductReader.readProductsByRestaurant](../../merchant-portal/src/core-boundary/readers/ProductReader.ts) e [MenuWriter.createMenuItem](../../merchant-portal/src/core-boundary/writers/MenuWriter.ts) usam fallback **só** em `isNetworkError(err)` (Core primeiro).
- Regras "piloto não sincroniza automaticamente", "piloto pode persistir em localStorage" e "fallback nunca promovido a Core" respeitadas no fluxo de menu.

### Onde pode vazar

- [merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx](../../merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx) em modo pilot chama [OrderWriter.createOrder](../../merchant-portal/src/core-boundary/writers/OrderWriter.ts) com `orderOrigin = "pilot"`. OrderWriter **sempre** chama RPC `create_order_atomic` e persiste no Core. O contrato diz "piloto não escreve pedidos no Core" — hoje o pedido pilot é escrito no Core (com origin pilot).

### O que falta de enforcement

- Gate em OrderWriter: não chamar Core quando `origin === 'pilot'` (ou persistir só local), **ou** relaxar contrato e deixar Core aceitar/filtrar por origin (ORDER_ORIGIN_CLASSIFICATION).
- Nenhum teste automatizado que verifique "piloto não escreve no Core".

### Testes que protegem

- Nenhum específico para pilot vs Core writes. E2E sovereign-navigation e publish-to-operational não assertam modo pilot nem escrita no Core.

---

## 2. MENU_FALLBACK_CONTRACT

### Onde está implementado

- [ProductReader.readProductsByRestaurant](../../merchant-portal/src/core-boundary/readers/ProductReader.ts): try Core → catch com `isNetworkError` → `getPilotProducts`. Ordem "Core primeiro, fallback só em erro" respeitada.
- [MenuWriter.createMenuItem](../../merchant-portal/src/core-boundary/writers/MenuWriter.ts): try Core → catch com `isNetworkError` → `addPilotProduct`. Nenhum código promove dados pilot a Core.

### Onde pode vazar

- Se alguém adicionar botão "Sincronizar pilot → Core" sem contrato/flow explícito. Código atual não promove.

### O que falta de enforcement

- Nenhum teste que force falha de rede e valide fallback; nenhum teste que garanta "nunca promove".

### Testes que protegem

- Nenhum unit/e2e para ProductReader/MenuWriter fallback.

---

## 3. OPERATIONAL_UI_RESILIENCE_CONTRACT

### Onde está implementado

- [merchant-portal/src/App.tsx](../../merchant-portal/src/App.tsx): `ErrorBoundary` envolve `/op/tpv` e `/op/kds` com fallback neutro ("TPV/KDS temporariamente indisponível... Ir para o Portal").
- [merchant-portal/src/ui/errors.ts](../../merchant-portal/src/ui/errors.ts): `toUserMessage` — mensagens sem stack/Docker/Supabase. Usado em MenuBuilderCore, TPVMinimal, KDSMinimal nos catch.

### Onde pode vazar

- `/op/cash` redireciona para `/op/tpv` (herda proteção). `/op/staff` (AppStaffMobileOnlyPage) não está envolvido por ErrorBoundary na mesma árvore que /op/tpv e /op/kds; RoleGate envolve tudo — verificar se existe ErrorBoundary superior ou se nova rota /op/ deve ser explicitamente envolvida.

### O que falta de enforcement

- Garantir que qualquer nova rota /op/ tenha ErrorBoundary; lint ou checklist.

### Testes que protegem

- E2E sovereign-navigation e publish-to-operational abrem /op/tpv e /op/kds mas não testam comportamento em crash (ex.: throw no componente). Nenhum teste que force ErrorBoundary.

---

## 4. ORDER_ORIGIN_CLASSIFICATION

### Onde está implementado

- [TPVMinimal](../../merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx): `orderOrigin = productMode === "pilot" ? "pilot" : "CAIXA"` passado a createOrder.
- [Waiter/TablePanel](../../merchant-portal/src/pages/Waiter/TablePanel.tsx): `origin: orderOrigin` com valores CAIXA, APPSTAFF_*, etc.
- [OrderWriter](../../merchant-portal/src/core-boundary/writers/OrderWriter.ts) aceita `origin` e envia em `p_sync_metadata`. Contrato é parcial; semântica "pilot | real" documentada.

### Onde pode vazar

- Core pode ou não persistir/filtrar por origin; hoje pedidos pilot são persistidos no Core. Relatórios/filtros por origem não implementados.

### O que falta de enforcement

- Gate opcional (não escrever pilot no Core); filtros em relatórios; estado parcial conforme contrato.

### Testes que protegem

- Nenhum.
