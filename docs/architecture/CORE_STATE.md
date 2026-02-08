# Estado do Núcleo — ChefIApp

**Propósito:** Resposta única a "onde estamos?" com precisão de engenharia. Sem discurso.

**Atualização:** Quando alterar contratos, enforcement ou decisões de núcleo.

---

## 1. Núcleo operacional

| Área | Contrato | Enforcement |
|------|----------|-------------|
| UI Operacional (Shell) | CORE_OPERATIONAL_UI_CONTRACT | OperationalShell, PanelRoot |
| AppStaff (execução humana) | CORE_APPSTAFF_CONTRACT + 6 subcontratos | AppStaffMinimal, TaskPanel, check-in, métricas |
| KDS (produção) | CORE_KDS_CONTRACT | KDSMinimal, MiniKDSMinimal |
| TPV (caixa) | CORE_TPV_BEHAVIOUR_CONTRACT | TPVMinimal, MiniTPVMinimal |
| Billing | BILLING_FLOW | BillingPage, PaymentGuard |
| Domínio / DB | DATABASE_AUTHORITY, MENU_CONTRACT | Migrações, readers |
| Kernel / Tenancy | TENANCY_KERNEL_CONTRACT, KERNEL_EXECUTION_MODEL | KernelProvider, execute |

Nenhuma peça crítica de operação está sem lei.

---

## 2. Leis invisíveis (7 metacontratos)

| Lei | Documento | Enforcement em código |
|-----|-----------|------------------------|
| Falha | CORE_FAILURE_MODEL | Sim: FailureClassifier, executeSafe, SyncEngine, ProductContext, Scene4/5 lastError, OrderProcessingService, CashRegister, MenuBootstrapService; OrderContextReal (open/close caixa via RPC) classifica e expõe failureClass; TPV usa failureClass nas mensagens de abrir/fechar caixa |
| Verdade | CORE_TRUTH_HIERARCHY | Não |
| Tempo | CORE_TIME_GOVERNANCE_CONTRACT | Não |
| Consciência | CORE_SYSTEM_AWARENESS_MODEL | Não |
| Autoridade | CORE_OVERRIDE_AND_AUTHORITY_CONTRACT | Não |
| Evolução | CORE_EVOLUTION_AND_COMPATIBILITY_CONTRACT | Não |
| Silêncio / Ruído | CORE_SILENCE_AND_NOISE_POLICY | Não |
| Governança operacional viva | CORE_OPERATIONAL_GOVERNANCE_CONTRACT | Não (contrato fechado; quem vê o quê, quando incidente, quando cala; implementação a evoluir) |

Índice: CORE_INVISIBLE_LAWS_INDEX.md. Enforcement dos restantes quando a dor aparecer.

---

## 3. Parciais (não bloqueiam venda/uso)

| Área | Situação |
|------|----------|
| Notificações | Alertas contextuais contratados (CORE_OPERATIONAL_COMMUNICATION); push/offline/ruído não contratados |
| Web pública | Fora do OUC por decisão; produto/marketing/QR |

---

## 4. Callers e executeSafe

Serviços que aceitam `executeSafe` opcional e propagam `failureClass`: OrderProcessingService, CashRegisterEngine, MenuBootstrapService.

Na UI actual: nenhum caller passa `executeSafe` a estes serviços. O TPV (OrderContextReal) abre/fecha caixa via RPC/dockerCore directo, não via CashRegisterEngine. Quando houver UI que chame acceptRequest, openCashRegister/closeCashRegister ou injectPreset, passar `useKernel().executeSafe` para obter failureClass.

---

## 5. Próximo passo (quando quiser)

- **CORE_FAILURE_MODEL em código:** Concluído. Opcional: passar executeSafe nos callers quando existir UI que use os serviços acima (hoje o TPV abre/fecha caixa via RPC directo).
- **Outras leis:** Enforcement quando dor concreta (múltiplos restaurantes/equipas/anos).
- **Scope:** [SCOPE_FREEZE.md](../strategy/SCOPE_FREEZE.md) — billing, onboarding, Now Engine, gamificação mínima (FASE 4 painel acessível ✅).
- **Próximo saudável:** Validar FASE 1 (Billing), FASE 2 (Onboarding), FASE 3 (Now Engine) em ambiente real; depois colocar em restaurante real. **Lista acionável:** [NEXT_ACTIONS.md](../strategy/NEXT_ACTIONS.md). Quando a dor aparecer, o próximo contrato ou enforcement escreve-se sozinho.

---

## Referências

- **Mapa do território (9 camadas):** [CORE_OS_LAYERS.md](./CORE_OS_LAYERS.md) — Kernel, Contratos, Runtime, Terminais, Governança, Observabilidade, Autonomia, Evolução, Ecossistema; comparação ChefIApp vs Toast/Lightspeed/ServiceNow/Palantir.
- Contratos: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)
- Cobertura por área: [CORE_CONTRACT_COVERAGE.md](./CORE_CONTRACT_COVERAGE.md)
- Onde está no código: [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md)
- Decisões: [CORE_DECISION_LOG.md](./CORE_DECISION_LOG.md)
