# Auditoria pós-remoção — "Adeus DEV Mode"

**Data:** 2025-02-01
**Objetivo:** Nenhuma bifurcação lógica por ambiente; ORE como único gate; copy sem menção a DEV.

---

## Checklist Fase C

- **Nenhuma bifurcação lógica por ambiente**
  Bypasses e mocks passam a depender de pedido explícito: `?debug=1` ou `sessionStorage.chefiapp_debug=1`. Helper central: `src/core/debugMode.ts` → `isDebugMode()`.

- **ORE continua sendo o único gate**
  GenesisRealityCheck, LiveRealityCheck, OperationGate, GuardTool, useCoreHealth, BootstrapKernel: bypass só com `isDebugMode()`. Comportamento em produção não muda por “estar em dev”.

- **Bootstrap informativo / operacional**
  BootstrapKernel usa `isDebugMode()` para `skipHealthChecks` (evitar bloqueio em testes locais). Sem `?debug=1`, health checks correm normalmente.

- **Logs úteis (níveis, não DEV)**
  Uso de `import.meta.env.DEV` mantido apenas onde afeta **nível de log** (ex.: Logger, config.ts, RuntimeReader console.warn). Não altera decisões de negócio.

---

## Ficheiros alterados (resumo)

| Área                                                             | Alteração                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `core/debugMode.ts`                                              | Novo: `isDebugMode()` (URL `?debug=1` ou `chefiapp_debug=1`)                          |
| AppDomainWrapper                                                 | 3 bypasses: `import.meta.env.DEV` → `isDebugMode()`                                   |
| RequireActivation                                                | `skip_activation` só com `isDebugMode()`                                              |
| RoleContext                                                      | Toggle role (localStorage) só com `isDebugMode()`                                     |
| TenantContext                                                    | Mock tenant + copy "Restaurante (dados indisponíveis)"                                |
| GenesisRealityCheck, LiveRealityCheck                            | Bypass → `isDebugMode()`                                                              |
| OperationGate, GuardTool                                         | Bypass → `isDebugMode()`                                                              |
| useCoreHealth                                                    | Bypass health → `isDebugMode()` + flag                                                |
| BootstrapKernel                                                  | skipChecks → `isDebugMode()`                                                          |
| useSupabaseAuth                                                  | Mock session (demo/pilot) só com `isDebugMode()`                                      |
| RestaurantRuntimeContext                                         | `__CHEF_SET_PILOT` só com `isDebugMode()`                                             |
| KernelContext                                                    | debugMode do Kernel → `isDebugMode()`                                                 |
| SystemGuardianContext                                            | Overlay debug → `isDebugMode()`                                                       |
| useMenuItems                                                     | Mock items vazios → `isDebugMode()`                                                   |
| DeviceMatrix, withTenant                                         | Override/throw → `isDebugMode()`                                                      |
| StaffContext                                                     | ALLOW_MOCKS → `allowMocks()` = `isDebugMode()` \|\| MODE=test                         |
| Unauthorized                                                     | Debug tenantId → `isDebugMode()`                                                      |
| WizardPage                                                       | Acesso + secções Config/Debug → `isDebugMode()`                                       |
| EnvBadge                                                         | Label "DEV" → "Local"                                                                 |
| ManagerDashboard                                                 | "INTEGRATION DEV TOOLS" → "Ferramentas de integração (debug)"                         |
| AuthPage, BillingConfigPanel, IntegrationsSection, OperationPage | Copy: "em desenvolvimento" / "ambiente de teste" → "não ativa" / "ainda não definida" |

---

## Onde `import.meta.env.DEV` permanece (apenas log/infra)

- **config.ts** — CORS proxy localhost, `IS_DEV`, log de config (nível de log).
- **main_debug.tsx** — Limpeza de Service Worker em build de desenvolvimento (infra).
- **RuntimeReader.ts** — `console.warn` extra em erros (nível de log).
- **RestaurantRuntimeContext.tsx** — `console.warn` quando Core indisponível (nível de log).
- **useSupabaseAuth.ts** — Log de eventos de auth (nível de log).
- **supabaseClient.ts** — Label env "dev"/"prod", log (observabilidade).
- **devStableMode.ts** — Documentação e guard "never outside DEV builds" (segurança de build).
- **Logger.ts**, **performanceMonitor.ts**, **PixelService.ts**, **IntegrationEventBus.ts**, **gm-bridge** — Verbosidade/log apenas.

Nenhum destes altera **comportamento funcional** (quem pode fazer o quê, o que é mostrado como estado do mundo).

---

## Resultado

- Sistema deixa de depender do conceito "DEV" para decisões; apenas `?debug=1` (ou flag explícita) ativa bypasses e ferramentas de teste.
- UI não menciona "DEV"; copy usa "não configurado", "dados indisponíveis", "funcionalidade não ativa".
- Build do merchant-portal concluído com sucesso após alterações.
