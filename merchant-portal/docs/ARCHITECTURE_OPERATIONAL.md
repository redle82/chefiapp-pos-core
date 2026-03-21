# ChefiApp — Arquitectura Operacional

> Estado consolidado dos Sprints 1-6 (Março 2025).
> Este documento descreve a jornada canonica do produto, a arquitectura de guards,
> o motor de progressao e o roadmap operacional.

---

## Fluxo Canonico

```
Landing (/)
  |
  v
Auth (/auth/email)
  |
  v  (novo utilizador)
Setup (/setup/*)
  |  9 seccoes: identity, location, hours, catalog, inventory,
  |  staff, payments, integrations, publish
  |
  v
Install (/install/tpv → /install/pair → /install/check)
  |
  v
TPV (/op/tpv) — com overlay de activacao operacional
  |  5 passos: caixa, impressora, KDS, staff, teste final
  |
  v
Restaurante Operacional
```

### Destinos pos-login

| Estado do utilizador           | Destino                |
|-------------------------------|------------------------|
| Novo, sem restaurante         | `/setup/start`         |
| Setup incompleto              | Ultimo passo pendente  |
| Activo, turno fechado         | `/admin/home`          |
| Activo, turno aberto          | `/op/tpv`              |

---

## Arquitectura de Guards (4 camadas)

### CoreFlow.ts — 7 gates de decisao

```
Gate 1: PUBLIC_VOID       /public/* → sempre permitido
Gate 2: AUTH_BARRIER       nao autenticado → /auth/email
Gate 3: BOOTSTRAP          sem org → /setup/start
Gate 4: OPERATIONAL_BLOCK  SETUP + rota op → /app/activation
Gate 5: ACTIVATION_LAYER   nao activado em /app/activation → ALLOW
Gate 6: NOT_ACTIVATED      fora da layer → /app/activation
Gate 7: DEFAULT            → ALLOW
```

### LifecycleState.ts — 4 estados

```
VISITOR → BOOTSTRAP_REQUIRED → BOOTSTRAP_IN_PROGRESS → READY_TO_OPERATE
```

### FlowGate.tsx — orquestrador

Combina CoreFlow + LifecycleState + tenant resolution + isolamento desktop/browser.

### SetupProgressEngine.ts — 19 estados de progressao

```
lead → authenticated → restaurant_created → identity_completed →
hours_completed → catalog_completed → staff_completed →
payments_completed → activated → tpv_installed → tpv_paired →
shift_opened → kds_connected → staff_app_connected →
test_passed → operational
```

---

## Redirects Legados

| Rota antiga        | Destino actual           |
|-------------------|--------------------------|
| `/welcome`        | `/setup/start`           |
| `/onboarding`     | `/setup`                 |
| `/app/onboarding` | `/setup`                 |
| `/bootstrap`      | `/setup?section=identity`|
| `/auth/phone`     | `/auth/email`            |

---

## Modulos Core (Sprint 6)

### Funnel Analytics (`core/analytics/`)

28 eventos tipados cobrindo o funil completo:

- **Marketing**: `landing_viewed`, `landing_cta_clicked`
- **Auth**: `auth_email_entered`, `auth_otp_sent`, `auth_otp_verified`, `auth_completed`
- **Setup**: `setup_started`, `setup_section_entered`, `setup_section_completed`, `setup_progress_updated`, `setup_review_reached`, `setup_activated`
- **Install**: `install_started`, `install_download_clicked`, `install_pair_started`, `install_pair_completed`, `install_check_passed`
- **TPV**: `tpv_first_open`, `activation_step_completed`, `activation_skipped`, `activation_completed`
- **Commissioning**: `commissioning_started`, `commissioning_test_order_created`, `commissioning_kds_received`, `commissioning_state_change`, `commissioning_passed`, `commissioning_failed`
- **Final**: `restaurant_operational`

Uso:
```typescript
import { useFunnelTracker } from "@/core/analytics";

const { track } = useFunnelTracker();
track({ name: "setup_section_completed", properties: { section: "identity", durationMs: 45000 } });
```

### Commissioning Engine (`core/commissioning/`)

8 testes automatizados (5 obrigatorios, 3 opcionais):

| Teste                | Obrigatorio | Descricao                                    |
|---------------------|-------------|----------------------------------------------|
| `tpv_order_create`  | Sim         | Cria pedido de teste no TPV                  |
| `kds_receive`       | Sim         | Verifica recepcao no ecra da cozinha         |
| `order_state_change`| Sim         | Valida transicao de estados                  |
| `order_handoff`     | Sim         | Confirma expedicao                           |
| `order_complete`    | Sim         | Verifica fecho do pedido                     |
| `printer_check`     | Nao         | Testa impressora                             |
| `staff_app_check`   | Nao         | Verifica staff app conectada                 |
| `web_channel_check` | Nao         | Verifica pagina publica                      |

Uso:
```typescript
import { useCommissioning } from "@/core/commissioning";

const { registerRunner, runAll, result, isPassing } = useCommissioning();

registerRunner("tpv_order_create", async () => {
  const order = await createTestOrder();
  return { passed: !!order.id };
});

await runAll();
```

---

## Estrutura de Ficheiros Chave

```
merchant-portal/src/
  core/
    flow/
      CoreFlow.ts              # 7 gates de decisao
      FlowGate.tsx             # Orquestrador principal
      canonicalFlow.ts         # Contrato de fluxo
    lifecycle/
      LifecycleState.ts        # 4 estados do restaurante
    setup/
      SetupProgressEngine.ts   # Motor de progressao (19 estados)
      setupStates.ts           # Tipos de estado
    boot/
      resolveBootDestination.ts # Resolucao de destino pos-boot
    analytics/
      funnelEvents.ts          # 28 eventos tipados
      FunnelTracker.ts         # Servico de tracking
      useFunnelTracker.ts      # Hook React
    commissioning/
      CommissioningEngine.ts   # Motor de comissionamento
      commissioningTypes.ts    # Tipos
      useCommissioning.ts      # Hook React
  routes/
    modules/
      SetupRoutes.tsx          # /setup/* (9 seccoes)
      InstallRoutes.tsx        # /install/* (3 passos)
      PublicBootstrapRoutes.tsx # Redirects legados
    MarketingRoutes.tsx        # Landing + auth
    OperationalRoutes.tsx      # /op/* + /admin/*
  pages/
    Onboarding/
      OnboardingLayout.tsx     # SetupShell com sidebar + progress
    Install/
      InstallTPVPage.tsx       # Download TPV
      DevicePairPage.tsx       # Pareamento
      DeviceCheckPage.tsx      # Verificacao de hardware
```

---

## Roadmap Sprint 7+

### Sprint 7 — Integracao Real

1. **Ligar FunnelTracker a Sentry/PostHog**
   - `FunnelTracker.subscribe()` ja esta pronto
   - Criar adapter para Sentry breadcrumbs
   - Criar adapter para PostHog events

2. **Ligar CommissioningEngine a sinais reais**
   - Registar runners que usam Supabase/API real
   - Pedido real no TPV
   - Evento real no KDS via realtime subscription
   - Mudanca de estado real via webhook

3. **Dashboard de activacao**
   - Taxa de conversao por fase
   - Tempo medio por etapa
   - Restaurantes que travaram e onde
   - Restaurantes operacionais vs em setup

### Hygiene Tecnica (paralelo)

- [#45](https://github.com/redle82/chefiapp-pos-core/issues/45) AlertRulesEngine duplicate declaration
- [#46](https://github.com/redle82/chefiapp-pos-core/issues/46) TableManagement.test.ts mock routes
- [#47](https://github.com/redle82/chefiapp-pos-core/issues/47) billingEnforcement + integration-gateway

---

## Metricas (Sprint 1-6)

| Metrica              | Valor     |
|---------------------|-----------|
| Ficheiros novos     | 23        |
| Ficheiros modificados| 16       |
| Linhas adicionadas  | ~3.000    |
| Testes verdes       | 1347/1367 |
| TypeScript errors   | 0         |
| Rotas mortas        | 0         |
| Redirect loops      | 0         |

---

## Principios Sagrados

1. **O fluxo canonico nao se bifurca.** Landing → Auth → Setup → Install → TPV → Operational.
2. **Guards protegem o fluxo, nao substituem o fluxo.**
3. **Progresso e derivado de dados reais, nunca de "visitou a pagina".**
4. **O TPV e o cockpit. O admin e o back-office. Nunca confundir.**
5. **Cada ecrã sabe qual e o proximo passo valido.**

---

*Ultima actualizacao: 2026-03-21*
*Versao: 1.0.0 (Sprints 1-6)*
