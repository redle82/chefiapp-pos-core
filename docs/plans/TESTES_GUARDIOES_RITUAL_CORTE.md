# Testes como Guardiões de Vida (Ritual Corte)

**Propósito:** Etiquetar testes em três níveis (soberano / compatibilidade / descartável) e definir política. Regra de ouro: "Código sem teste morre. Teste sem contrato morre."

**Contexto:** [Ritual Corte Cirúrgico Freeze](.cursor/plans/ritual_corte_cirúrgico_freeze_acd25e75.plan.md); contratos em [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

---

## 1. Níveis de testes

### 1.1 Testes soberanos (obrigatórios)

Protegem contratos soberanos. CI deve exigir que passem. Nunca apagar sem contrato equivalente.

| Contrato | Âmbito dos testes |
|----------|-------------------|
| OPERATIONAL_KERNEL_CONTRACT | Estado operacional, CoreHealth, terminals (gate + canQuery) |
| OPERATIONAL_NAVIGATION_SOVEREIGNTY | FlowGate: redirect em OPERATIONAL_OS nunca para "/"; destino /app/dashboard; /app/install não redireciona para landing |
| TERMINAL_INSTALLATION_RITUAL | Gate NOT_IMPLEMENTED quando track off; heartbeat quando track on |

**Etiquetados como soberanos:**

| Ficheiro | Nível | Notas |
|----------|-------|--------|
| `tests/e2e/sovereign-navigation.spec.ts` | SOBERANO | Navegação FlowGate, landing → auth, /app/* |
| `tests/e2e/sovereign-tpv.spec.ts` | SOBERANO | TPV em contexto soberano; verificar alinhamento a ORE |
| `src/core/flow/CoreFlow.test.ts` | SOBERANO | resolveNextRoute, isWebConfigPath, /app/install |
| `src/core/readiness/operationalRestaurant` (se existir teste) | SOBERANO | hasOperationalRestaurant, INVALID_OR_SEED |

**A acrescentar / reforçar:** Unit para FlowGate (resolveDestination em OPERATIONAL_OS); Kernel (terminals.status/canQuery); ORE redirectFor para superfícies.

---

### 1.2 Testes de compatibilidade

Garantem que fluxos operacionais e pilot/demo não quebram. Devem passar antes do corte.

| Ficheiro | Nível | Notas |
|----------|-------|--------|
| `tests/e2e/immutable_shift_check.spec.ts` | COMPATIBILIDADE | Turno; FlowGate/TPV debug; pode depender de Core/auth |
| `tests/e2e/teste-humano-supremo-v25.spec.ts` | COMPATIBILIDADE | Área operacional sem redirect para landing |
| `tests/e2e/publish-to-operational.spec.ts` | COMPATIBILIDADE | Publicar → operacional |
| `tests/e2e/fluxo-total.spec.ts` | COMPATIBILIDADE | Fluxo end-to-end |
| `tests/e2e/create-first-restaurant.spec.ts` | COMPATIBILIDADE | Bootstrap / primeiro restaurante |
| `src/components/operational/RequireOperationalBilling.test.tsx` | COMPATIBILIDADE | RequireOperational + billing |
| `src/core/flow/OperationGate.test.tsx` | COMPATIBILIDADE | OperationGate redirects |

**Cobertura desejada:** Dashboard OPERATIONAL_OS renderiza; /app/install nunca redireciona para "/" em cenário operacional; Seed/Pilot/Demo não quebram fluxo.

---

### 1.3 Testes descartáveis

Ligados a UX antiga, trial, quick actions, first-sale banners. **Regra:** Se falharem após o corte, não consertar — apagar o teste junto com o código.

| Ficheiro | Nível | Notas |
|----------|-------|--------|
| `tests/e2e/fase-a-global-tecnico.spec.ts` | DESCARTÁVEL | Avaliar: se só técnico, pode ser compatibilidade |
| `tests/e2e/fase-b-teste-humano.spec.ts` | DESCARTÁVEL | Avaliar: se cobre fluxo humano genérico, compatibilidade |
| `tests/e2e/supreme_chaos_saturday.spec.ts` | DESCARTÁVEL | Caos; avaliar se protege algo soberano |
| `tests/e2e/pedido-para-tarefas.spec.ts` | COMPATIBILIDADE ou DESCARTÁVEL | Consoante contrato de tarefas |
| Testes unitários de componentes puramente de trial/first-sale/atalhos | DESCARTÁVEL | Apagar junto com o código |

---

## 2. Política

1. **Nada é congelado sem teste:** Código soberano deve ter pelo menos um teste soberano ou de compatibilidade.
2. **Nada sobrevive se não passa teste:** Se um teste soberano falhar, corrigir código ou contrato; não desactivar o teste sem decisão explícita.
3. **Teste sem contrato morre:** Se um teste não está associado a um dos cinco contratos soberanos nem a compatibilidade documentada, é candidato a descartável.
4. **Descartáveis:** Se falharem após corte, não consertar; apagar o teste junto com o código que removemos.
5. **CI:** Exigir que testes soberanos (e, se configurado, compatibilidade) passem. Descartáveis podem ser opcionais ou excluídos do gate.

---

## 3. Checklist antes do corte

- [ ] Todos os testes soberanos listados existem e passam.
- [ ] Testes de compatibilidade relevantes ao corte passam.
- [ ] Descartáveis etiquetados; decisão de manter ou apagar após corte documentada.
- [ ] CI configurado para bloquear em falha de testes soberanos (e, se aplicável, compatibilidade).

---

Última actualização: Testes Guardiões Ritual Corte; etiquetagem e política.
