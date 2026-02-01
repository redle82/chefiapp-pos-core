# Auditoria: CORE_APPSTAFF_CONTRACT no AppStaff mobile

**Data:** 2026-01-30  
**Objetivo:** Implementar o CORE_APPSTAFF_CONTRACT no AppStaff (Expo, iOS/Android).

---

## 1. Ficheiros criados

| Ficheiro | Propósito |
|----------|-----------|
| `context/AppStaffOperationalContext.tsx` | Contexto operacional obrigatório: staffId, role (staff\|gerente\|dono), activeShift, activeStation, systemMode. Hook `useAppStaffContext`. |
| `core-readers/readTasks.ts` | Reader de tarefas do Core (mock). |
| `core-readers/readOrders.ts` | Reader de pedidos do Core (mock). |
| `core-readers/index.ts` | Barrel dos readers. |
| `core-events/taskCompleted.ts` | Evento "tarefa concluída" (mock). |
| `core-events/orderAccepted.ts` | Evento "pedido aceite" (mock). |
| `core-events/index.ts` | Barrel dos eventos. |
| `lib/pendingSync.ts` | Eventos "pending sync" (AsyncStorage) para offline mínimo. |
| `README.md` | Como rodar iOS/Android; estrutura; contrato; offline. |
| `docs/APPSTAFF_CONTRACT_AUDIT.md` | Este documento. |

---

## 2. Contextos adicionados

| Contexto | Onde está | Uso |
|----------|-----------|-----|
| **AppStaffOperationalContext** | `app/_layout.tsx` (dentro de AppStaffProvider) | staffId, role, activeShift, activeStation, systemMode; inicializado no boot; persistência de activeStation/systemMode em AsyncStorage. |
| **useAppStaffContext** | Qualquer componente dentro de AppStaffOperationalProvider | Acesso ao estado operacional do contrato. |

---

## 3. Pontos do contrato cobertos

| Ponto contrato | Implementação |
|----------------|----------------|
| **Contexto operacional obrigatório** | AppStaffOperationalContext com staffId, role, activeShift, activeStation, systemMode. Boot init + useAppStaffContext. |
| **Navegação permitida (mobile)** | Estrutura existente: Home (index), Tarefas (staff), Mini KDS (kitchen), Mini TPV (orders/tables), Check-in/out (staff/Turno), Perfil (two/Conta). README documenta; sem config global, gestão financeira completa, gestão cardápio, métricas estratégicas dono no escopo do terminal. |
| **Governação pelo Core** | core-readers/ (readTasks, readOrders) e core-events/ (taskCompleted, orderAccepted). AppStaff não calcula regras, não decide prioridade, não altera preços; apenas lê estado e envia eventos. |
| **Integração Expo (iOS/Android)** | Scripts `npm run ios` e `npm run android`; README com instruções para abrir simulador/emulador. |
| **Offline mínimo** | Tarefas já carregadas mantidas em memória (AppStaffContext). pendingSync (AsyncStorage) para eventos pendentes; check-in/check-out local permitido. |

---

## 4. Pontos ainda mockados (explicitamente)

| Área | Estado | Nota |
|------|--------|------|
| **core-readers/readTasks** | Mock | Retorna array vazio; substituir por chamada ao Core/API. |
| **core-readers/readOrders** | Mock | Retorna array vazio; substituir por chamada ao Core/API. |
| **core-events/taskCompleted** | Mock | Apenas log; substituir por envio ao Core. |
| **core-events/orderAccepted** | Mock | Apenas log; substituir por envio ao Core. |
| **Sync de pending events** | Não implementado | Estrutura em pendingSync.ts; flush quando online a evoluir. |

---

## 5. Confirmações finais

- [x] AppStaff abre no iOS Simulator (`npm run ios`).
- [x] AppStaff abre no Android Emulator (`npm run android`).
- [x] AppStaff não tenta renderizar web (Expo; web desactivável).
- [x] AppStaff não importa código do merchant-portal (nenhum import de merchant-portal no mobile-app).

---

**Referência:** `docs/architecture/CORE_APPSTAFF_CONTRACT.md` no repositório raiz.
