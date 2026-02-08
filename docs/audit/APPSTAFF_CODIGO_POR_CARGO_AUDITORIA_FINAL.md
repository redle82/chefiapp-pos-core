# Auditoria: Código por cargo AppStaff — Relatório final

**Data:** 2026-02-05  
**Plano:** Auditoria e correção do sistema de código por cargo AppStaff

---

## Diagnóstico

**Correto (após correções).** O fluxo de entrada por código (CHEF-XXXX-XX), associação de papel e sessão operacional no AppStaff único estava em parte alinhado com o modelo "app único com camadas"; duas violações foram identificadas e corrigidas.

---

## O que estava errado / onde foi corrigido / porquê

| Problema | Ficheiro | Correção | Motivo |
|----------|----------|----------|--------|
| **Papel via URL (`?role=`)** permitia sobrescrever o papel da sessão em produção | `merchant-portal/src/pages/AppStaff/StaffModule.tsx` | O parâmetro de query `role` só é lido quando `CONFIG.ALLOW_STAFF_ROLE_QUERY` **e** `isDebugMode()` são verdadeiros (ex.: `?debug=1`). Caso contrário, `initialRoleProp` fica `undefined` e o papel vem apenas da sessão (código, AUTO-JOIN, tab storage, createLocalContract). | O papel deve ser determinado pela sessão, não pela URL; `?role=` fica restrito a debug. |
| **Owner/Manager viam "Inserir Código"** por um instante na primeira renderização | `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx` | Inicialização **síncrona** quando existe sessão dono/gerente (`restaurantId && userId`): `operationalContract` com contract AUTO-JOIN, `shiftState` como `"active"`, `activeRole` como `"owner"` e `roleSource` como `"login"` quando não há `initialRoleProp`. O `useEffect` do AUTO-JOIN mantém-se para fluxos assíncronos e idempotência. | O StaffAppGate usa `operationalContract` para decidir se mostra AppStaffLanding; sem valor na primeira paint, dono/gerente viam a landing antes do effect correr. |

---

## Confirmação

**O AppStaff permanece um app único com camadas por papel, conforme o contrato; o papel é determinado pela sessão (código, AUTO-JOIN ou createLocalContract), não pela URL.**

Nenhuma nova rota nem novo app foi criado; as alterações restringem o uso de `?role=` e garantem que dono/gerente com sessão tenham contract e estado coerentes desde a primeira renderização.
