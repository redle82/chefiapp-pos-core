# 🔒 Escopo Congelado - ChefIApp

**Data:** 2026-01-30
**Status:** ✅ **CONGELADO**
**Versão:** 1.0

---

## Objetivo

**Congelar escopo para evitar scope creep e manter foco em "TPV que pensa".**

### Nota: Escopo vs. Readiness

Este documento congela o **escopo de features e entrega**.
Camadas de infraestrutura, segurança, governança e readiness sistêmica (ver [MUSHROOMS_ROADMAP.md](./MUSHROOMS_ROADMAP.md)) **não são consideradas scope creep**, pois não alteram o comportamento visível do produto — apenas reduzem risco futuro e permitem crescer sem morrer.
Um protege o foco; o outro protege o futuro.

### Slide mental: Arquitetura vs. Escopo

|                  | Escopo                                                                                            | Arquitetura                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **O que é**      | O que o utilizador vê e usa agora (features visíveis)                                             | Como o sistema está organizado para não quebrar (Kernel, contratos, terminais)    |
| **Quem governa** | SCOPE_FREEZE (este doc)                                                                           | Contratos Core ([CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md)) |
| **Congela**      | Billing, onboarding, Now Engine, gamificação, impressão — sem ERP, sem OS completo como _produto_ | Quem manda, quem obedece, leis invisíveis (falha, tempo, verdade, silêncio)       |

Não competem; complementam-se. Escopo define o que o carro faz hoje; arquitetura define se aguenta a estrada amanhã.

### ChefIApp OS (Docker World) — Feature freeze ao nível mundo completo

**ChefIApp OS (Docker World) está completo como mundo local verificável.** Não adicionar novos serviços ou contratos estruturais sem justificação de Fase 2. O critério válido a partir daqui é "parar de construir, começar a usar" (ver [ESTAMOS_PRONTOS.md](./ESTAMOS_PRONTOS.md)). Escopo de produto continua congelado conforme este doc; leis e bootstraps são governados por [ERO_CANON.md](../ERO_CANON.md) e [boot/BOOTSTRAP_CANON.md](../boot/BOOTSTRAP_CANON.md). Zonas intocáveis e ritual de mudança (alteração de contratos/core): [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md).

---

## O que NÃO será Feito Agora

### ❌ ERP Completo

- **Justificativa:** Não é core do "TPV que pensa"
- **Status:** Adiado indefinidamente
- **Quando considerar:** Após produto estar vendendo bem

### ❌ Sistema Operacional Completo

- **Justificativa:** Não é core do "TPV que pensa"
- **Status:** Adiado indefinidamente
- **Quando considerar:** Após produto estar vendendo bem
- **Não significa:** Proibir contratos, Kernel ou terminais (já existem e são lei). Significa: não _expor_ tudo como produto/marketing "OS completo" agora — Toast, Lightspeed, ServiceNow tinham arquitetura de OS anos antes de a vender como tal.

### ❌ Analytics Profundos

- **Justificativa:** Não é core do "TPV que pensa"
- **Status:** Adiado para FASE 8 (pós-mercado)
- **Quando considerar:** Após feedback de clientes pedindo analytics

### ❌ Mapa Visual Completo

- **Justificativa:** Grid por zonas resolve 80%, não é bloqueador
- **Status:** Adiado para FASE 7 (após produto vendável)
- **Quando considerar:** Após feedback real de restaurantes

### ❌ Gestão Completa de Equipe

- **Justificativa:** Não é core do "TPV que pensa"
- **Status:** Adiado indefinidamente
- **Quando considerar:** Após produto estar vendendo bem

### ❌ Integrações Avançadas

- **Justificativa:** Integrações básicas são suficientes
- **Status:** Adiado indefinidamente
- **Quando considerar:** Após feedback de clientes pedindo integrações específicas

### ❌ Automatização completa Menu↔Estoque↔Tarefas

- **Justificativa:** Não implementar tudo agora; testar pedidos, tarefas básicas, observar humanos.
- **Status:** Modelo mental e contratos (TASKS_CONTRACT_v1, ERROS_CANON) já suportam; implementação MVP não é automática.
- **Referência:** [TASKS_CONTRACT_v1.md](../contracts/TASKS_CONTRACT_v1.md) §8 Scope agora.

---

## O que SERÁ Feito Agora

### ✅ Billing Integrado (FASE 1)

- **Justificativa:** Bloqueador de mercado
- **Status:** OBRIGATÓRIO

### ✅ Onboarding com Primeira Venda (FASE 2)

- **Justificativa:** Bloqueador de mercado
- **Status:** OBRIGATÓRIO

### ✅ Now Engine como Núcleo (FASE 3)

- **Justificativa:** Diferencial único
- **Status:** OBRIGATÓRIO

### ✅ Gamificação Mínima (FASE 4)

- **Justificativa:** Decisão tomada, motiva equipe
- **Status:** OBRIGATÓRIO

### ✅ Polimento dos Apps (FASE 5)

- **Justificativa:** Percepção de produto "acabado"
- **Status:** OBRIGATÓRIO

### ✅ Impressão Funcional (FASE 6)

- **Justificativa:** Operação real sem suporte constante
- **Status:** OBRIGATÓRIO

---

## Regra de Ouro

**Se uma feature não reforça "TPV que pensa", ela NÃO será implementada agora.**

### Filtro de Decisão

**Pergunta:** "Isso reforça 'TPV que pensa'?"

- ✅ Se SIM → Pode ser considerado
- ❌ Se NÃO → Adiar ou não fazer

---

## Exceções

### Exceção 1: Billing

- **Por quê:** Bloqueador de mercado (necessário para vender)
- **Status:** OBRIGATÓRIO mesmo que não seja core do "TPV que pensa"

### Exceção 2: Onboarding

- **Por quê:** Bloqueador de mercado (necessário para converter usuários)
- **Status:** OBRIGATÓRIO mesmo que não seja core do "TPV que pensa"

### Exceção 3: Impressão

- **Por quê:** Necessário para operação real
- **Status:** OBRIGATÓRIO mesmo que não seja core do "TPV que pensa"

---

## Quando Revisar Este Escopo

### Revisão Obrigatória

- Após FASE 1-6 completas (produto vendável)
- Após feedback de 10+ clientes reais
- Após 3 meses de vendas

### Revisão Opcional

- Se houver demanda clara de mercado
- Se houver recursos para investir
- Se houver alinhamento estratégico

---

## Status

✅ **Escopo congelado em 2026-01-30**

**Próximos passos:**

1. Executar FASE 1-6 sem adicionar features fora do escopo
2. Revisar escopo após produto estar vendendo
3. Garantir que todas as decisões passem pelo filtro

---

## Próximo passo concreto (por FASE)

| FASE               | O que fazer agora                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Billing**     | Rota `/app/billing`, PaymentGuard e BillingPage existem (BILLING_FLOW). Validar Stripe Checkout/Portal em ambiente real; confirmar env vars.                                                                                                                                                                       |
| **2. Onboarding**  | Fluxo: cinematic (`/start/cinematic/1`→6) ou `/onboarding` → menu (gm_products) → TPV → primeira venda = primeiro pedido com `payment_status='paid'` (gm_orders). Hook `useOnboardingStatus` (hasMenu, hasFirstSale); `OnboardingReminder`. Validar: completar cinematic até Scene6Summary e fazer 1 venda no TPV. |
| **3. Now Engine**  | Núcleo = Kernel + pedidos (ORDER) + caixa (cash_register). Contratos: CORE_TPV_BEHAVIOUR_CONTRACT, CORE_KDS_CONTRACT. Validar: TPV cria pedido e fecha com pagamento; caixa abre/fecha (OrderContextReal usa RPC directo; CashRegisterEngine aceita executeSafe).                                                  |
| **4. Gamificação** | Camada mínima: GamificationPanel acessível em `/garcom` (tab «Pontos») — feito. Persistência de feedback no Core quando necessário.                                                                                                                                                                                |
| **5. Polimento**   | Revisar VPC/OUC em todos os pontos de contacto; sem novas features.                                                                                                                                                                                                                                                |
| **6. Impressão**   | CORE_PRINT_CONTRACT existe; implementar driver/fila quando houver cliente real.                                                                                                                                                                                                                                    |

**Estado do núcleo (contratos/enforcement):** [CORE_STATE.md](../architecture/CORE_STATE.md). **Checklists:** FASE 1–3 [VALIDATION_CHECKLIST_FASE_1_3.md](./VALIDATION_CHECKLIST_FASE_1_3.md); FASE 5 [VALIDATION_CHECKLIST_FASE_5_POLISH.md](./VALIDATION_CHECKLIST_FASE_5_POLISH.md); FASE 6 [IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md](./IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md).

### FASE 2 — Fluxo até primeira venda (referência)

| Etapa          | Onde                                                      | Critério                           |
| -------------- | --------------------------------------------------------- | ---------------------------------- |
| Menu criado    | gm_products (restaurant_id, available=true)               | hasMenu = count > 0                |
| Primeira venda | gm_orders (restaurant_id, payment_status='paid')          | hasFirstSale = count > 0           |
| Cinematic      | /start/cinematic/1..6, Scene6Summary, engine.submitScene6 | Produtos via addProduct (Scene4/5) |
| Verificação    | useOnboardingStatus (polling 30s), OnboardingReminder     | restaurantId = TabIsolated         |

### FASE 3 — Now Engine (referência)

| Elemento | Onde                                                            | Contrato                                        |
| -------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Kernel   | KernelProvider, executeSafe, TenantKernel                       | KERNEL_EXECUTION_MODEL, TENANCY_KERNEL_CONTRACT |
| Pedidos  | TPVMinimal, OrderContextReal, kernel.execute ou RPC             | CORE_TPV_BEHAVIOUR_CONTRACT                     |
| Caixa    | CashRegisterEngine (open/close), OrderContextReal (RPC directo) | CORE_TPV_BEHAVIOUR_CONTRACT                     |
| KDS      | KDSMinimal, estado/prioridade/SLA                               | CORE_KDS_CONTRACT                               |

Validar: fluxo completo de 1 pedido no TPV (criar → pagar) e caixa aberto/fechado.

### FASE 4 — Gamificação (referência)

| Item          | Estado                                                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Decisão       | Camada mínima: pontos ou feedback no AppStaff ou TPV (conforme decisão de produto).                                                                                                                                                                                      |
| Contrato      | Nenhum ainda; não bloqueia operação.                                                                                                                                                                                                                                     |
| **Já existe** | `GamificationService` (awardPoints, achievements, user_scores); `GamificationPanel` em AppStaff (usa gamificationService, UserScore, LeaderboardEntry); `TaskFeedback` (feedback em tarefas; ainda não persiste no Core — CORE TODO); `LoyaltyService` (pontos cliente). |
| **Validar**   | ✅ GamificationPanel acessível em AppStaffMinimal (`/garcom`), tab «Pontos». Ligar pontos ao turno ou persistir no Core quando houver decisão de produto.                                                                                                                |

### FASE 5 — Polimento (referência)

| Item               | Onde                                                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VPC/OUC            | [CORE_OPERATIONAL_UI_CONTRACT](../architecture/CORE_OPERATIONAL_UI_CONTRACT.md), [CONTRACT_ENFORCEMENT](../architecture/CONTRACT_ENFORCEMENT.md) secção 1. |
| Pontos de contacto | OperationalShell, PanelRoot, DashboardPortal, BillingPage, AppStaffMinimal, KDSMinimal, TPVMinimal, ConfigLayout.                                          |
| Regra              | Revisar consistência visual/comportamental; sem novas features.                                                                                            |
| **Checklist**      | [VALIDATION_CHECKLIST_FASE_5_POLISH.md](./VALIDATION_CHECKLIST_FASE_5_POLISH.md).                                                                          |

### FASE 6 — Impressão (referência)

[CORE_PRINT_CONTRACT](../architecture/CORE_PRINT_CONTRACT.md). Implementar driver/fila quando houver cliente real ou ambiente com impressora. **Checklist de implementação:** [IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md](./IMPLEMENTATION_CHECKLIST_FASE_6_PRINT.md).

---

### Leitura adicional

- [ROADMAP_POS_FREEZE.md](./ROADMAP_POS_FREEZE.md) — O que está pronto para freeze, os 3 gaps conhecidos e as 2 fases pós-freeze (Identidade Operacional; Instalação Real de Terminais); trilhos opcionais para o próximo movimento.

---

**Fim do Documento de Escopo Congelado**
