# AppStaff Runtime Model — Ambiente operacional independente do Core

**Status:** CANONICAL  
**Tipo:** Modelo de runtime — por que AppStaff não depende do Core; diferença Core / Dashboard / AppStaff; abas paralelas por papel.  
**Subordinado a:** [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md), [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md), [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md).

---

## 1. Por que o AppStaff não depende do Core

O AppStaff opera com:

- **locationsStore** (localStorage) — lista de locais ativos; gate Location (seleção ou auto-seleção).
- **createLocalContract** — contrato operacional local (modo demo/pilot) sem backend.
- **joinRemoteOperation** — opcional; quando Core está online, staff pode entrar por código.

O Core é **opcional** para o Staff em demo/pilot: sync, pedidos remotos e audit dependem do Core; o ambiente humano (check-in, tarefas, mini TPV, KDS, checklist) pode funcionar em fallback local. Isso permite testes, treino e operação real mesmo com Core offline.

---

## 2. Diferença entre Core / Dashboard / AppStaff

| Camada | Função | Dependência do Core |
|--------|--------|----------------------|
| **Core** | Backend soberano (pedidos, mesas, módulos, faturação, audit). | N/A (é o backend). |
| **Dashboard** | Centro de comando (owner/manager): relatórios, configuração, faturação, saúde do sistema. | Opcional em demo/pilot; em produção tipicamente online. |
| **AppStaff** | Ambiente operacional humano: garçom, cozinha, limpeza, gerente; tarefas, mini TPV, KDS, check-in. | Opcional em demo/pilot; Location e contrato local suficientes para operar. |

Papéis **nunca** dependem do Core para existir visualmente; o role pode vir de query param (?role=), tab storage ou login.

---

## 3. Modelo de abas paralelas

Padrão enterprise: uma aba por papel, mesmo restaurante, mesma locationsStore.

- **Aba 1** — Dashboard (owner).
- **Aba 2** — `/app/staff?role=manager`.
- **Aba 3** — `/app/staff?role=waiter`.
- **Aba 4** — `/app/staff?role=kitchen`.
- **Aba 5** — `/app/staff?role=cleaning`.

Cada aba mantém:

- Seu próprio **StaffRoleContext** / **StaffContext** (role por query ou tab storage).
- Mesma organização / restaurante (restaurant_id).
- Mesma **locationsStore** (localStorage partilhado); seleção de local por aba (sessionStorage) quando aplicável.

O role é lido de: (1) query param `?role=`, (2) fallback `staff_role` em tab storage (sessionStorage), (3) login (joinRemoteOperation) ou contrato local (debug). Cada aba tem role independente (tab-scoped).

---

## 4. Justificativa enterprise

Sistemas como Oracle Hospitality, Micros, Square Enterprise, Lightspeed usam internamente:

- **Ambientes paralelos por papel** — testes e treino sem misturar sessões.
- **Staff desacoplado do backend** — fallback operacional quando a rede ou o Core falha.
- **Zero onboarding** para abrir uma aba por papel — atalhos no Dashboard (owner) que abrem `/app/staff?role=XXX` em nova aba.

O ChefIApp assume isto de forma consciente, com arquitetura limpa e documentada.

---

## 5. Gates únicos para /app/staff

Para `/app/staff` os únicos gates permitidos são:

1. **restaurant_id** existente (ou seed em dev).
2. **Location** selecionável ou ecrã "Nenhuma localização ativa".

Não são permitidos: dependência de `core.status === 'online'`, redirect para onboarding, nem preflight operacional (ORE). Ver [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md).

---

## 6. Segurança e UX

- **Flag `ALLOW_STAFF_ROLE_QUERY`** (CONFIG): em produção pode ser desativada (`VITE_ALLOW_STAFF_ROLE_QUERY=false`) para ignorar `?role=`; nesse caso o role vem apenas de tab storage ou login. Em DEMO/PILOT/LOCAL fica ativa por defeito.
- **Permissões por role:** `canCloseCash` e `canSeeBilling` são apenas owner/manager ([appStaffPermissions](merchant-portal/src/core/roles/appStaffPermissions.ts)); a UI usa [useAppStaffPermissions](merchant-portal/src/pages/AppStaff/hooks/useAppStaffPermissions.ts) para mostrar/esconder ações. Fecho de caixa e faturação global não são expostos a waiter/kitchen/cleaning.
- **UX:** Cada role vê apenas as ações do seu papel; Owner/Manager dashboards são renderizados só quando `activeRole === 'owner'` ou `'manager'` ([AppStaff.tsx](merchant-portal/src/pages/AppStaff/AppStaff.tsx)).

---

## 7. Referências

- [STAFF_SESSION_LOCATION_CONTRACT.md](./STAFF_SESSION_LOCATION_CONTRACT.md) — sessão Staff exige Location ativo.
- [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md) — modelo Location e rotas Ubicaciones.
- [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md) — Location = contexto operacional (não contrato).
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — índice rota → contrato; /app/staff.
- [FlowGate](merchant-portal/src/core/flow/FlowGate.tsx) — `/app/staff` em `isOperationalAppPath`; acesso em DEMO/PILOT/Docker com restaurant_id mesmo com Core offline.
- [ONDE_VER_NO_NAVEGADOR.md](./ONDE_VER_NO_NAVEGADOR.md) — onde ver Staff e Config no browser.
- [config.ts](merchant-portal/src/config.ts) — `ALLOW_STAFF_ROLE_QUERY`.

**Última atualização:** 2026-02-05
