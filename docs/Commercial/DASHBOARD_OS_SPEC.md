# Dashboard OS — Especificação do painel único

## Regra de ouro

**Se existe um botão "Abrir X", o design já falhou.**

Num OS não se "abre" módulo — o módulo já está ali. Um painel único, uma rota (`/dashboard`), uma tela. Tudo acontece ali mesmo.

---

## 1. Layout final: DashboardShell

```
┌─────────────────────────────────────────────────────────────┐
│  DashboardShell (rota única: /dashboard)                     │
├──────────────┬──────────────────────────────────────────────┤
│  Sidebar     │  MainPanel                                   │
│  (árvore     │  ┌──────────────────────────────────────────┐│
│   viva)      │  │  ActiveModule                             ││
│              │  │  → Conteúdo VIVO do módulo selecionado   ││
│  • Em uso    │  │  (lista, ações, estado — sem card        ││
│  • Pronto    │  │   intermediário, sem "Abrir X")          ││
│  • Em        │  └──────────────────────────────────────────┘│
│    evolução  │                                              │
│              │  [Estado do sistema + Primeira venda no topo]│
└──────────────┴──────────────────────────────────────────────┘
```

- **Sidebar**: só chama `setActiveModule(id)`. Não navega, não muda rota.
- **MainPanel**: renderiza o conteúdo do módulo ativo. Nada de card com "Abrir X".

---

## 2. Mapa módulo → painel (conteúdo vivo)

| activeModule | Componente a renderizar no painel | Ficheiro atual |
|--------------|------------------------------------|----------------|
| tasks | Lista de tarefas, filtros, ações | TaskDashboardPage |
| tpv | TPV (produtos, carrinho, pedido) | TPVMinimal |
| kds | KDS (pedidos, itens, estados) | KDSMinimal |
| menu | Menu Builder (form + itens) | MenuBuilderMinimal |
| appstaff | App Staff (KDS+TPV mini) | AppStaffMinimal |
| health | Saúde (score, breakdown) | HealthDashboardPage |
| alerts | Alertas (lista, críticos) | AlertsDashboardPage |
| config | Config (identidade, etc.) | ConfigLayout |
| perception | Percepção operacional | ConfigPerceptionPage |
| restaurant-web | Presença online | Link/embed ou mini panel |
| people | Pessoas (perfis) | PeopleDashboardPage |
| mentor | Mentor IA | MentorDashboardPage |
| purchases | Compras (sugestões, pedidos) | PurchasesDashboardPage |
| financial | Financeiro (resumo, transações) | FinancialDashboardPage |
| reservations | Reservas | ReservationsDashboardPage |
| groups | Multi-unidade | GroupsDashboardPage |
| qr-table | Operação / QR mesa | OperacaoMinimal |
| public-kds | KDS público | PublicKDS ou KDSMinimal |

Cada um é renderizado **dentro** do MainPanel, sem `navigate()`, sem botão "Abrir".

---

## 3. O que vira “Panel” (reaproveito)

Não é preciso criar novos ficheiros *Panel. Os **componentes de página** atuais são renderizados **dentro** do dashboard quando `activeModule` corresponde:

- `TaskDashboardPage` → conteúdo vivo de Tarefas
- `TPVMinimal` → conteúdo vivo do TPV
- `KDSMinimal` → conteúdo vivo do KDS
- etc.

Ou seja: o mesmo componente que hoje é uma “página” (rota própria) passa a ser também o conteúdo do painel quando o utilizador está em `/dashboard` e seleciona esse módulo na árvore. As rotas `/tasks`, `/tpv`, etc. podem manter-se para bookmarks/deeplinks; no fluxo normal, tudo acontece no painel único.

---

## 4. O que some (sem dó)

- **Botão "Abrir X"** no painel central — eliminado.
- **Card intermediário** que só descreve o módulo e tem CTA "Abrir" — eliminado; o painel mostra logo o conteúdo vivo.
- **Mentalidade “painel → botão → outra tela”** — substituída por “painel = módulo já ali”.

---

## 5. VPC no shell

O DashboardShell deve absorver o VPC (fundo, tipografia, spacing, radius) para não parecer colcha de retalhos: sidebar e MainPanel com mesma linguagem visual (ex. tema escuro, Inter, espaçamento generoso). Assim o dashboard é estruturalmente VPC, não só cada página isolada.

---

## 6. Resumo

1. **Uma rota**: `/dashboard`.
2. **Uma tela**: Sidebar + MainPanel.
3. **Um estado**: `activeModule`; sidebar só altera estado.
4. **Conteúdo vivo**: MainPanel renderiza o componente do módulo (página atual) inline — sem card, sem "Abrir X".
5. **Rotas antigas** (`/tasks`, `/tpv`, …): opcional manter para deeplinks; fluxo principal é só dashboard + selector.
