# Plano: A + B em sequência — Ritual de terminais (B) e Kernel em código (A) + Gate

**Propósito:** Documentar o plano executado: ritual de instalação de terminais como objetos vivos (Fase B), consolidação do Operational Kernel em código (Fase A) e gate explícito no Kernel para terminais (NOT_IMPLEMENTED / canQuery), eliminando 404 e fontes de verdade múltiplas.

**Referências:** [OPERATIONAL_KERNEL_CONTRACT.md](../contracts/OPERATIONAL_KERNEL_CONTRACT.md), [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md), [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](../contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md), [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

---

## Ordem de execução

1. **Fase B** — Ritual de instalação e terminais como objetos vivos (produto; impacto visual sem redesign).
2. **Fase A** — Consolidar Operational Kernel em código (refactor interno; menos logs e um único estado).
3. **Gate no Kernel** — Terminais com `status: NOT_IMPLEMENTED` e `canQuery: false` quando o trilho não está implementado; zero chamadas a gm_terminals/gm_equipment quando canQuery é false.

---

# FASE B — Ritual de terminais e objetos vivos

## Estado inicial

- **InstallPage** em `/app/install`: insere em gm_equipment (restaurant_id, name, kind TPV/KDS, is_active), chama insertInstalledModule, guarda em installedDeviceStorage (device_id, restaurant_id, module_id, device_name). Um dispositivo por browser (localStorage).
- **TerminalEngine** envia heartbeat para gm_terminals (id, restaurant_id, type, name, last_heartbeat_at). TPV/KDS podem chamar sendHeartbeat para marcar "Online".
- **Dashboard:** quando CONFIG.TERMINAL_INSTALLATION_TRACK é false, mostra "TPV — Não instalado" / "KDS — Não instalado" + CTA para `/app/install`.

## B1 — Contrato (ritual + terminal como objeto)

- **docs/contracts/TERMINAL_INSTALLATION_RITUAL.md**: ritual em `/app/install`, "objeto vivo" = terminal com nome + estado (Online/Offline) + opcional last_heartbeat; quando o dashboard mostra "Não instalado" vs lista de terminais com nome e status; fontes gm_equipment, installedDeviceStorage, gm_terminals.
- **CORE_CONTRACT_INDEX.md** actualizado com referência ao contrato de terminais.

## B2 — Listagem de equipamento e “tem terminais”

- **EquipmentReader** (core-boundary/readers/EquipmentReader.ts): listEquipmentByRestaurant(restaurantId), listTerminalsHeartbeatsByRestaurant(restaurantId); degradação graciosa quando tabela não existe (retorna [] sem log).
- **useTerminals** (core/terminal/useTerminals.ts): lista equipamento (gm_equipment) + heartbeats (gm_terminals); deriva hasTerminals = (1) pelo menos um registo em gm_equipment para restaurant_id, ou (2) getInstalledDevice() existe e restaurant_id coincide; isOnline(equipment) = este browser é o dispositivo ou heartbeat recente.

## B3 — Dashboard sidebar: terminais com nome e estado

- Na secção **Operar** do DashboardPortal: quando kernel.terminals.canQuery e hasTerminals e equipment.length > 0, mostrar "TPV [nome]" / "KDS [nome]" com estado Online/Offline e link para /op/tpv ou /op/kds. Quando não há equipamento ou canQuery é false: "TPV — Não instalado" / "KDS — Não instalado" + CTA "Instalar terminal" → `/app/install`.

## B4 (opcional) — Heartbeat nas páginas TPV/KDS

- Em TPVMinimal e KDSMinimal: TerminalEngine.sendHeartbeat({ restaurantId, type: 'TPV'|'KDS', name }) a cada 30s quando o dispositivo estiver instalado (getInstalledDevice), para que gm_terminals tenha last_heartbeat_at e o dashboard possa mostrar "Online".

## Ficheiros (Fase B)

| Acção     | Ficheiro |
|----------|----------|
| Criar    | docs/contracts/TERMINAL_INSTALLATION_RITUAL.md |
| Atualizar| docs/architecture/CORE_CONTRACT_INDEX.md |
| Criar    | core-boundary/readers/EquipmentReader.ts |
| Criar    | core/terminal/useTerminals.ts |
| Alterar  | merchant-portal/src/pages/Dashboard/DashboardPortal.tsx (Operar: lista de terminais com nome + Online/Offline quando canQuery e há equipamento) |
| Alterar  | merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx, KDSMinimal/KDSMinimal.tsx (sendHeartbeat periódico) |

---

# FASE A — Consolidar Operational Kernel em código

## A1 — useOperationalKernel()

- Hook **useOperationalKernel()** devolve **OperationalState** conforme OPERATIONAL_KERNEL_CONTRACT: core, shift, terminals (object com status e canQuery), canOperate, reason.
- Inputs: CoreHealth (singleton), ShiftContext, RestaurantRuntime, terminais (lista do B2 ou gate quando trilho desligado).
- Consumidores: DashboardPortal usa useOperationalKernel() para a primeira dobra (estado único).

## A2 — Singleton CoreHealth

- **coreHealthSingleton.ts**: estado único e um único polling; subscribe/getState/startPolling/stopPolling; refCount para parar quando não há consumidores.
- **useCoreHealth** passa a subscrever o singleton; reduz múltiplas instâncias e logs repetidos "[CoreHealth] Status changed".

## A3 — Lifecycle estável do EventMonitor

- **EventMonitor.start(restaurantId)** idempotente: se já está a correr para o mesmo restaurantId, não relançar; currentRestaurantId guardado; stop() sem log repetido.

## Ficheiros (Fase A)

| Acção   | Ficheiro |
|--------|----------|
| Criar  | core/operational/useOperationalKernel.ts |
| Criar  | core/health/coreHealthSingleton.ts |
| Alterar| core/health/useCoreHealth.ts (subscrever singleton) |
| Alterar| core/tasks/EventMonitor.ts (start idempotente, stop sem log) |
| Alterar| DashboardPortal.tsx (consumir useOperationalKernel para primeira dobra) |

---

# GATE NO KERNEL — Terminais NOT_IMPLEMENTED / canQuery

## Problema

- A UI acredita que existe um “mundo de terminais vivos” (heartbeat, select por restaurante).
- O backend pode ainda não ter gm_terminals/gm_equipment → 404 e spam.
- O Kernel não filtrava: vários hooks chamavam a API mesmo quando o trilho não estava implementado.

## Solução

- **OperationalState.terminals** passa a ser um objeto: `{ status: 'NOT_IMPLEMENTED' | 'INSTALLED' | 'NOT_INSTALLED', canQuery: boolean }`.
- Quando **TERMINAL_INSTALLATION_TRACK** é false: `terminals = { status: 'NOT_IMPLEMENTED', canQuery: false }`. Nenhum hook de terminais chama gm_terminals nem gm_equipment quando canQuery === false.
- **useTerminals**: quando trackEnabled é false, não chama listEquipmentByRestaurant nem listTerminalsHeartbeatsByRestaurant (zero requests).
- **Dashboard**: usa kernel.terminals.canQuery para decidir se mostra lista de terminais ou "Não instalado" + CTA; usa kernel.terminals.status para o bloco de estado ("Instalados" / "Não implementado" / "Não instalados").

## Contrato

- OPERATIONAL_KERNEL_CONTRACT.md: §4 Output — terminals como { status, canQuery }; gate explícito; §5 Mapeamento; §6 Fontes históricas (Firebase/legado não decidem estado operacional).

## Ficheiros (Gate)

| Acção    | Ficheiro |
|----------|----------|
| Alterar  | core/operational/useOperationalKernel.ts (terminals = { status, canQuery }) |
| Alterar  | core/terminal/useTerminals.ts (zero API quando !trackEnabled) |
| Alterar  | DashboardPortal.tsx (kernel.terminals.canQuery, kernel.terminals.status) |
| Alterar  | docs/contracts/OPERATIONAL_KERNEL_CONTRACT.md (gate + fontes históricas) |

---

## Resumo da ordem executada

1. **B1** — Contrato TERMINAL_INSTALLATION_RITUAL + índice.
2. **B2** — Reader/hook lista gm_equipment (+ gm_terminals para heartbeats); derivar “tem terminais”; degradação graciosa quando tabela não existe.
3. **B3** — Dashboard Operar: TPV/KDS com nome e Online/Offline quando canQuery e há equipamento.
4. **B4** (opcional) — Heartbeat em TPV/KDS.
5. **A1** — useOperationalKernel() e consumo no dashboard.
6. **A2** — Singleton CoreHealth.
7. **A3** — EventMonitor lifecycle estável (idempotente).
8. **Gate** — terminals { status: NOT_IMPLEMENTED, canQuery: false } quando trilho desligado; useTerminals não chama API; contrato e dashboard alinhados.

Nenhuma alteração de redesign visual; B traz “corpo” (terminais vivos), A consolida o decisor, o Gate elimina 404 e deixa a UI silenciosa e honesta quando o mundo de terminais ainda não está implementado.

---

Última actualização: Plano A+B + Gate; documentação do plano executado.
