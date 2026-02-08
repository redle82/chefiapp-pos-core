# Auditoria: Ritual Completo de Corte

**Propósito:** Lista de candidatos a corte (auditoria estrutural) e matriz módulo → contrato (auditoria de contrato). Alimenta [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md) e valida cada remoção.

**Contexto:** [Ritual Corte Cirúrgico Freeze](.cursor/plans/ritual_corte_cirúrgico_freeze_acd25e75.plan.md); contratos soberanos em [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

**Critério de corte:** Se não está citado em contrato **ou** não é consumido pelo Kernel (useOperationalKernel, FlowGate, ORE, ritual de terminais), é candidato a remoção.

---

## 1. Contratos que mandam hoje (a régua)

| Contrato | Âmbito |
|----------|--------|
| OPERATIONAL_KERNEL_CONTRACT | Kernel, CoreHealth, Preflight, EventMonitor, terminals (status/canQuery) |
| OPERATIONAL_NAVIGATION_SOVEREIGNTY | FlowGate, ORE, destino /app/dashboard em OPERATIONAL_OS, /app/install |
| OPERATIONAL_DASHBOARD_V2 | Dashboard OPERATIONAL_OS, sidebar, menu, primeira/segunda dobra |
| TERMINAL_INSTALLATION_RITUAL | /app/install, gm_equipment, installedDeviceStorage, heartbeat |
| CORE_SYSTEM_TREE_CONTRACT | Árvore canónica, endpoint → nó |

Nada fora destes cinco manda.

---

## 2. Matriz módulo → contrato (ou corte)

Módulos centrais e a que contrato respondem. "CORTE" = candidato a remoção se não for reatribuído.

| Módulo / Área | Contrato | Notas |
|---------------|---------|--------|
| FlowGate | OPERATIONAL_NAVIGATION_SOVEREIGNTY | Única autoridade de redirect; resolveDestination, isOperationalAppPath |
| useOperationalReadiness (ORE) | OPERATIONAL_NAVIGATION_SOVEREIGNTY | redirectFor; surfaces TPV, KDS, DASHBOARD, WEB |
| useOperationalKernel | OPERATIONAL_KERNEL_CONTRACT | OperationalState, terminals.status/canQuery |
| CoreHealth singleton / useCoreHealth | OPERATIONAL_KERNEL_CONTRACT | CoreHealth UP/DOWN/UNKNOWN |
| usePreflightOperational / Preflight | OPERATIONAL_KERNEL_CONTRACT | Preflight blockers |
| EventMonitor | OPERATIONAL_KERNEL_CONTRACT | EventMonitor bootstrap |
| useTerminals / EquipmentReader | TERMINAL_INSTALLATION_RITUAL | gate quando track off; heartbeat |
| InstallPage, installedDeviceStorage | TERMINAL_INSTALLATION_RITUAL | /app/install ritual |
| DashboardPortal (OPERATIONAL_OS) | OPERATIONAL_DASHBOARD_V2 | primeira/segunda dobra, sidebar, menu |
| LifecycleState (getCanonicalDestination) | OPERATIONAL_NAVIGATION_SOVEREIGNTY | Usado apenas por FlowGate; destino "/" substituído em OPERATIONAL_OS |
| operationalRestaurant (hasOperationalRestaurant) | OPERATIONAL_NAVIGATION_SOVEREIGNTY | Condição canónica "restaurante válido" |
| CoreFlow (resolveNextRoute, isWebConfigPath) | OPERATIONAL_NAVIGATION_SOVEREIGNTY | /app/install como web config path |
| ManagementAdvisor | Compatibilidade | Não bloqueia; banner "Modo Configuração"; avaliar se permanece |
| RequireOperational | OPERATIONAL_NAVIGATION_SOVEREIGNTY | ORE por superfície |
| DemoGuiadoPage, DemoTourPage (navigate("/") ou "/landing") | CORTE / revisão | Só permitir se rota explícita de saída do demo; não conflituar com soberania |
| Guards/redirects fora de FlowGate que mandem para "/" em contexto app | CORTE | OPERATIONAL_NAVIGATION_SOVEREIGNTY proíbe |
| Flags env/config "trial", "first-sale", "quick-actions" como decisão de UI | CORTE ou contrato | Se duplicam Kernel/ORE, candidatos a blacklist |
| Código referenciado apenas por UX legado (trial, primeira venda, atalhos) | CORTE | Após etiquetar testes descartáveis |

---

## 3. Lista de candidatos a corte (auditoria estrutural)

### 3.1 Guards / navegação

- **DemoTourPage:** `navigate("/")` em botão de saída — garantir que não é usado em contexto OPERATIONAL_OS ou substituir por `/app/dashboard` quando UI_MODE === OPERATIONAL_OS.
- **DemoGuiadoPage:** `navigate("/landing")` — alinhar com soberania (landing vs app/dashboard).
- Qualquer novo redirect para `"/"` fora de `FlowGate.resolveDestination` → **proibido** (blacklist).

### 3.2 Flags históricas (revisão)

- **CONFIG.UI_MODE:** mantido; OPERATIONAL_OS é soberano.
- **CONFIG.TERMINAL_INSTALLATION_TRACK:** mantido; TERMINAL_INSTALLATION_RITUAL.
- **CONFIG.DEBUG_DIRECT_FLOW:** temporário; documentar data de remoção ou mover para blacklist quando desactivado em prod.
- Flags de trial/first-sale/quick-actions em **config ou contexto** que duplicem decisão do Kernel/ORE → listar em blacklist se forem removidas.

### 3.3 Lógica duplicada

- **CoreHealth:** única fonte = CoreHealth singleton / useCoreHealth (OPERATIONAL_KERNEL_CONTRACT). Qualquer outra instância ou estado "core health" fora do Kernel → candidato a corte.
- **Preflight:** única fonte = usePreflightOperational (OPERATIONAL_KERNEL_CONTRACT).
- **Navegação:** única autoridade = FlowGate + ORE; redirect para "/" só via resolveDestination em OPERATIONAL_OS.

### 3.4 Código não referenciado por contratos activos

- Módulos que nenhum dos cinco contratos referencia e que o Kernel/FlowGate/ORE/ritual de terminais não consomem → candidatos após revisão manual (ex.: componentes puramente decorativos ou fluxos descontinuados).

---

## 4. Uso desta auditoria

1. **Antes de apagar:** Verificar matriz (módulo → contrato). Se "CORTE", confirmar que não quebra nenhum contrato soberano.
2. **Após corte:** Actualizar [LEGACY_CODE_BLACKLIST.md](../ops/LEGACY_CODE_BLACKLIST.md) com padrões/módulos proibidos de reintrodução.
3. **Testes:** Código soberano deve ter teste soberano ou de compatibilidade; código descartável pode ser apagado junto com o teste.

---

Última actualização: Auditoria Ritual Corte; lista e matriz iniciais.
