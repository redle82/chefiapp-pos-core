# Casos de Caos — ChefIApp

**Propósito:** Documento canónico de **casos de caos** (chaos engineering): o que quebrar, como testar resiliência e qual comportamento esperado. Alinhado a [EDGE_CASES.md](../architecture/EDGE_CASES.md), [OFFLINE_STRATEGY.md](../architecture/OFFLINE_STRATEGY.md) e [CORE_FAILURE_MODEL.md](../architecture/CORE_FAILURE_MODEL.md).  
**Público:** QA, engenharia, DevOps.  
**Referência:** [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md) · [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](../architecture/OPERATIONAL_UI_RESILIENCE_CONTRACT.md)

---

## 1. Objetivo

Definir **casos de caos** formais: falhas injectadas (Core inacessível, rede, timeout, crash de componente) e comportamento esperado do sistema (degradação, fallback, mensagem neutra, sem ecrã branco). A execução pode ser manual ou automatizada (Onda 2/3); este doc fixa os casos e critérios.

---

## 2. Princípios

- **Core primeiro:** UI tenta sempre o Core antes de fallback; fallback nunca é promovido a Core.
- **Nunca ecrã branco:** ErrorBoundary em /op/; mensagens neutras (toUserMessage); estado degradado ou fallback.
- **Classes de falha:** Aceitável (retry); Degradação (fallback local, estado claro); Crítica (bloquear, alertar). Ver [CORE_FAILURE_MODEL.md](../architecture/CORE_FAILURE_MODEL.md).

---

## 3. Casos de caos (especificação)

### 3.1 Core inacessível (rede / timeout)

| O que quebrar | Como simular | Comportamento esperado |
|---------------|--------------|------------------------|
| **Core (PostgREST) down** | Parar container Core; ou rede bloqueada para porta 3001. | Menu: fallback localStorage (MENU_FALLBACK_CONTRACT); TPV/KDS: produtos/pedidos fallback ou lista vazia; mensagem neutra ("Sem ligação. Tente novamente."); nunca "Failed to fetch" nem stack. |
| **Core muito lento** | Throttling ou delay no Core (ex.: 10 s). | UI mostra loading; timeout conforme reader; após timeout, fallback ou mensagem neutra; não crash. |
| **Timeout em RPC** | RPC create_order_atomic ou equivalente com timeout. | Retry ou mensagem neutra ("Não foi possível registar o pedido. Tente novamente."); não expor detalhes técnicos. |

**Referência:** [OFFLINE_STRATEGY.md](../architecture/OFFLINE_STRATEGY.md), [MENU_FALLBACK_CONTRACT.md](../architecture/MENU_FALLBACK_CONTRACT.md).

### 3.2 Crash em componente (React)

| O que quebrar | Como simular | Comportamento esperado |
|---------------|--------------|------------------------|
| **Throw em TPVMinimal ou filho** | Throw em render ou em handler (ex.: botão). | ErrorBoundary captura; fallback neutro ("TPV temporariamente indisponível. Tente novamente ou volte ao portal."); link para dashboard; nunca ecrã branco. |
| **Throw em KDSMinimal ou filho** | Idem. | ErrorBoundary captura; fallback neutro ("KDS temporariamente indisponível..."); nunca ecrã branco. |
| **Throw em MenuBuilder** | Idem. | ErrorBoundary (se existir) ou mensagem neutra; nunca stack na UI. |

**Referência:** [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](../architecture/OPERATIONAL_UI_RESILIENCE_CONTRACT.md).

### 3.3 Auth / tenant indisponível

| O que quebrar | Como simular | Comportamento esperado |
|---------------|--------------|------------------------|
| **Supabase Auth down** | Desligar Auth ou rede para Supabase. | Login falha com mensagem neutra; não expor erro técnico. |
| **0 tenants após login** | Utilizador sem restaurante. | Redirect /bootstrap; criar 1º restaurante ou mensagem clara. |
| **Tenant resolution timeout** | Atrasar resposta de memberships. | Loading; após timeout redirect /app/select-tenant ou mensagem neutra. |

### 3.4 Dados inconsistentes ou constraint

| O que quebrar | Como simular | Comportamento esperado |
|---------------|--------------|------------------------|
| **Violação idx_one_open_order_per_table** | Criar dois pedidos OPEN na mesma mesa (concorrência). | Um sucesso; outro falha com erro esperado (constraint); UI não crash; mensagem neutra ou retry. |
| **Restaurant_id inválido** | Request com restaurant_id inexistente. | Core/RLS rejeita; UI mostra erro neutro ou redirect. |

**Referência:** [SIMULATION_RULES.md](./SIMULATION_RULES.md).

### 3.5 Disponibilidade parcial (degradação)

| O que quebrar | Como simular | Comportamento esperado |
|---------------|--------------|------------------------|
| **Só leitura do Core (escrita falha)** | Core em modo read-only ou RPC write bloqueado. | Leituras ok; escrita falha com mensagem neutra; não promover fallback local a Core. |
| **Billing endpoint falha** | /app/billing ou Stripe indisponível. | Mensagem neutra; não bloquear resto do portal. |

---

## 4. Critérios de aprovação (resumo)

- [ ] Core down: menu usa fallback local; TPV/KDS mostram estado degradado ou fallback; zero "Failed to fetch" ou stack na UI.
- [ ] Crash em /op/tpv ou /op/kds: ErrorBoundary mostra fallback neutro; zero ecrã branco.
- [ ] Auth/tenant indisponível: redirect ou mensagem neutra; sem detalhes técnicos.
- [ ] Constraint violada (mesa duplicada): um sucesso, outro falha; UI não crash; mensagem ou retry neutro.
- [ ] Em todos os casos: nenhuma mensagem técnica (Docker, Supabase, RPC, stack) exposta ao utilizador.

---

## 5. Ferramentas e referências

| Recurso | Descrição |
|---------|-----------|
| **STRESS_TEST_FINAL_REPORT.md** | Chaos suite (9 test suites) no harness Docker. |
| **EDGE_CASES.md** | Edge cases e resiliência consolidados. |
| **OFFLINE_STRATEGY.md** | Estratégia offline e fallback. |
| **CORE_FAILURE_MODEL.md** | Classes de falha; quem manda. |
| **OPERATIONAL_UI_RESILIENCE_CONTRACT.md** | ErrorBoundary; mensagens neutras. |

---

## 6. Execução (notas)

- **Manual:** Desligar Core, provocar throw em componente, simular timeout; validar comportamento.
- **Automatizado (futuro):** Chaos engine ou testes E2E que injectam falha (ex.: mock Core down); assertions sobre mensagem neutra e ausência de stack.
- **Ambiente:** Preferir ambiente de teste/staging; não injectar caos em produção sem processo aprovado.

---

*Documento vivo. Novos casos de caos ou alteração de comportamento esperado devem ser alinhados a EDGE_CASES e CORE_FAILURE_MODEL.*
