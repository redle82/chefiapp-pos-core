# AppStaff — Painel vivo por papel (redesign operacional)

**APPSTAFF_HOME_CANON v1.0**

Não existe mais launcher técnico no AppStaff. A home em `/app/staff/home` é um painel vivo por papel (Owner, Manager, Waiter, Kitchen, Cleaning); TPV e KDS são destinos de acção ou conteúdo inline, não modos de um launcher.

Documento canónico: design + wireframes + árvore de componentes + prompt executável para o Cursor. Contrato: substituir o launcher técnico (grid de modos) por uma home por papel; reutilizar Shell, Gates, TPV, KDS.

---

## Histórico

- **v1.0** — Redesign painel por papel; launcher removido; declaração canónica; ManagerHome com hierarquia problema primeiro + densidade.

---

## Regra-mãe e contexto

- **Não existe "launcher de modos".** Existe um app único que muda conforme o papel (owner, manager, waiter, kitchen, cleaning).
- AppStaff vive em `/app/staff/*`; Shell (TopBar + área central + Bottom Nav) e Gates mantêm-se.
- TPV e KDS são os mesmos componentes (StaffTpvPage → MiniPOS; KitchenDisplay); apenas quem chama e quando muda.
- Objetivo: instrumento operacional (sábado à noite), não menu de software. Cada papel vê conteúdo e ações relevantes; navegação direta (mesa → TPV, cozinha → KDS).

---

## Wireframes por papel

Estrutura base (igual para todos):

```
┌──────────────────────────────────┐
│ Restaurante • SÁBADO 21:43       │  ← Top bar viva
│ Papel • Turno ATIVO               │
├──────────────────────────────────┤
│                                  │
│   CONTEÚDO PRINCIPAL DO PAPEL    │  ← muda por cargo
│                                  │
├──────────────────────────────────┤
│  Bottom bar contextual            │  ← links por papel
└──────────────────────────────────┘
```

### OWNER — "Eu observo o sistema"

```
┌──────────────────────────────────────────┐
│ Sofia Gastrobar • Sáb 21:43               │
│ DONO • TURNO ATIVO                        │
├──────────────────────────────────────────┤
│  Receita Hoje        €4.320               │
│  Ticket Médio        €32                  │
│  Mesas Ativas        18                   │
│  Cozinha             ⚠️ Pressão Alta     │
├──────────────────────────────────────────┤
│  📊 Visão Geral   👥 Equipe   📄 Relatórios│
└──────────────────────────────────────────┘
```

Não vê: TPV, KDS como ações principais.

### MANAGER — "Eu coordeno"

```
┌──────────────────────────────────────────┐
│ Sofia Gastrobar • Sáb 21:43               │
│ GERENTE • TURNO ATIVO                     │
├──────────────────────────────────────────┤
│  STATUS OPERACIONAL                       │
│  • Garçons online        4               │
│  • Pedidos atrasados     6 ⚠️            │
│  • Mesa 12               ⚠️              │
│  [ Abrir TPV ]  [ Ver Cozinha ]           │
├──────────────────────────────────────────┤
│ 🏠 Status  👥 Equipe  📋 Tarefas  ⚠️ Alertas│
└──────────────────────────────────────────┘
```

### WAITER — "Eu atendo mesas"

```
┌──────────────────────────────────────────┐
│ Sofia Gastrobar • Sáb 21:43               │
│ GARÇOM • TURNO ATIVO                      │
├──────────────────────────────────────────┤
│  MESAS                                   │
│  [ 1 ] [ 2 ] [ 3 ] [ 4 ]                 │
│  [ 5 ] [ 6 ] [ 7⚠️ ] [ 8 ]               │
│  [ 9 ] [10 ] [11 ] [12 ]                 │
│  Mesa 7 • Pedido em preparo               │
│  Mesa 4 • Pronta p/ servir                │
├──────────────────────────────────────────┤
│ 🏠 Mesas   ➕ Pedido   ⏱️ Status           │
└──────────────────────────────────────────┘
```

Tocar numa mesa = TPV direto (com tableId). Sem "abrir TPV", sem launcher.

### KITCHEN — "Eu cozinho"

```
┌──────────────────────────────────────────┐
│ Sofia Gastrobar • Cozinha                 │
│ KDS • TURNO ATIVO                         │
├──────────────────────────────────────────┤
│  #128 • Mesa 4 • 12 min ⚠️               │
│  #129 • Mesa 7 • 6 min                   │
│  #130 • Takeaway • 3 min                 │
└──────────────────────────────────────────┘
```

App abre direto aqui. Não existe home separada; home = KDS.

### CLEANING — "Eu executo tarefas"

```
┌──────────────────────────────────────────┐
│ Sofia Gastrobar                           │
│ LIMPEZA                                  │
├──────────────────────────────────────────┤
│  TAREFAS                                 │
│  ☐ Mesa 3                                │
│  ☐ WC                                    │
│  ☐ Área externa                          │
│  Status geral: OK                        │
└──────────────────────────────────────────┘
```

Sem TPV, sem KDS.

---

## Árvore de componentes React

Reaproveita Shell, Gates e rotas existentes.

```
AppStaffWrapper
└── StaffModule
    └── StaffAppGate
        └── StaffAppShellLayout
            └── RoleHomeRouter (AppStaffRoleHome)
                ├── OwnerHome
                │   ├── OwnerKpis
                │   └── OwnerAlerts
                ├── ManagerHome
                │   ├── OperationalStatus
                │   ├── ManagerActions
                │   └── ManagerBottomNav
                ├── WaiterHome
                │   ├── TablesGrid
                │   ├── TableStatusStrip
                │   └── WaiterBottomNav
                ├── KitchenHome
                │   └── KitchenDisplay (KDS existente)
                └── CleaningHome
                    └── CleaningTasks
```

- TPV continua a ser StaffTpvPage (MiniPOS).
- KDS continua a ser KitchenDisplay.
- Só muda quem chama e quando (home por role).

Ficheiros: `merchant-portal/src/pages/AppStaff/AppStaffRoleHome.tsx`, `merchant-portal/src/pages/AppStaff/homes/*.tsx`.

---

## Prompt canónico para o Cursor (executável)

Copiar para o Cursor para executar o redesign sem refator estrutural.

### MISSÃO

Redesenhar o AppStaff para funcionar como aplicativo operacional real, baseado em papel do utilizador, sem refatorar a arquitetura.

### CONTEXTO FIXO (não alterar)

- AppStaff roda em `/app/staff/*`
- Gates, Shell e Canon visual já existem
- AppStaffHome atual é um launcher técnico → deve ser substituído
- TPV e KDS já existem e devem ser reutilizados
- Um único app, múltiplos papéis

### TAREFA 1 — Substituir AppStaffHome

Criar `AppStaffRoleHome.tsx` que:

- Lê `activeRole` de `useStaff()`
- Renderiza home específica por papel: `owner` → OwnerHome, `manager` → ManagerHome, `waiter` → WaiterHome, `kitchen` → KitchenHome, `cleaning` → CleaningHome, `worker` → WaiterHome

Substituir em StaffLauncherPage: renderizar AppStaffRoleHome em vez de AppStaffHome.

### TAREFA 2 — Homes por papel

Criar em `merchant-portal/src/pages/AppStaff/homes/`:

- OwnerHome, ManagerHome, WaiterHome, KitchenHome, CleaningHome

Cada um: usa dados reais existentes (tables, tasks, shift, specDrifts); não mostra modos irrelevantes; não mostra launcher; layout denso e operacional.

### TAREFA 3 — Integração TPV / KDS

- Garçom: tocar numa mesa → navegar para `/app/staff/mode/tpv` com tableId (query ou state); StaffTpvPage/MiniPOS devem ler tableId e preselecionar mesa.
- Cozinha: home = KDS (renderizar KitchenDisplay no lugar da home para role kitchen).
- Gerente: botões "Abrir TPV" e "Ver Cozinha" → navegar para mode/tpv e mode/kds; "Gerir Equipe" → mode/team. Bottom bar: Status, Equipe, Tarefas, Alertas.

### TAREFA 4 — Teste final

Demonstrar no browser: entrar como Garçom → mesas → mesa → TPV; trocar para Cozinha → KDS direto; Gerente → status e botões; Dono → KPIs sem TPV/KDS; Limpeza → tarefas. PWA: abrir pelo ícone e repetir.

### PROIBIDO

- Criar novo launcher de modos
- Refazer Shell
- Alterar Canon visual
- Criar novos contratos
- Introduzir features não pedidas

### SUCESSO É

- App abre já em contexto
- Cada papel sente "este app é para mim"
- Não há sensação de "site"
- Não há botões gigantes inúteis
- Sistema funciona sob pressão

---

## Referências

- Roteiro de teste: [APPSTAFF_TESTE_FINAL_ROTEIRO.md](../implementation/APPSTAFF_TESTE_FINAL_ROTEIRO.md)
- Finalização canónica: [APPSTAFF_FINALIZACAO_CANONICO.md](../implementation/APPSTAFF_FINALIZACAO_CANONICO.md)
- Shell/Canon: docs/architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md
