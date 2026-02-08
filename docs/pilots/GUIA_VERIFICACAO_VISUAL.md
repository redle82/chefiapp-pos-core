# Guia de verificação visual — TPV instalado, pedido no KDS, tarefas a funcionar

**Objetivo:** Ver com os próprios olhos: (1) TPV a ser instalado, (2) um pedido a aparecer no KDS, (3) o sistema de tarefas a funcionar.

**Pré-condições:** Core (3001) e App (5175) ativos; sessão válida (restaurante criado, ≥1 produto no cardápio).

---

## Links diretos (copiar e colar no browser)

| O quê                       | URL                                 |
| --------------------------- | ----------------------------------- |
| **Página Instalar TPV/KDS** | `http://localhost:5175/app/install` |
| **TPV (Caixa)**             | `http://localhost:5175/op/tpv`      |
| **KDS (Cozinha)**           | `http://localhost:5175/op/kds`      |
| **Minhas Tarefas**          | `http://localhost:5175/tasks`       |
| **Dashboard**               | `http://localhost:5175/dashboard`   |

Se usares outro porto ou domínio, troca `localhost:5175` pelo teu (ex.: `https://app.chefiapp.pt`).

---

## 1. Ver a "instalação" do TPV

- **Onde:** Página **Instalar TPV e KDS**.
- **Como chegar:**

  - **Opção A:** URL direta: `http://localhost:5175/app/install`
  - **Opção B:** Dashboard → tile **Configurar restaurante** (⚙️) → na página Config, menu esquerdo **Instalar TPV / KDS** (📲).
  - **Opção C:** Config → sidebar → **Instalar TPV / KDS** (path `/app/install`).

- **O que deves ver:**

  - Título **"Instalar TPV e KDS"**.
  - Dois blocos: **TPV (Caixa)** e **KDS (Cozinha)**.
  - Em cada um: link (ex. `http://localhost:5175/op/tpv` e `/op/kds`), instruções por browser (Chrome/Edge, Safari iPad/iPhone, Safari macOS) e botão **"Abrir TPV"** / **"Abrir KDS"**.

- **Para "instalar" o TPV (como app/atalho):**
  1. Clicar **"Abrir TPV"** (abre `/op/tpv` noutra aba).
  2. No Chrome/Edge: **Menu ⋮** (três pontos) → **"Instalar app"** ou **"Criar atalho"** → **Abrir como janela**.
  3. No Safari (iPad/iPhone): **Compartilhar** → **Adicionar à Tela de Início**.

Assim vês a página de instalação e o fluxo de "instalar" o TPV.

---

## 2. Ver um pedido a aparecer no KDS

Fluxo mínimo: **abrir turno → criar pedido no TPV → abrir o KDS e ver o pedido na fila**.

1. **Abrir o turno**

   - Ir ao **Dashboard** (`http://localhost:5175/dashboard`).
   - Se aparecer "O turno ainda não está aberto" e botão **"Abrir turno"**, clicar e seguir (ex.: caixa inicial 10 € e **"Clique aqui para começar a vender AGORA"**).
   - Se já vires "Em Turno" e histórico por turno, o turno já está aberto.

2. **Ir ao TPV**

   - URL: `http://localhost:5175/op/tpv`
   - Ou na página **Instalar TPV e KDS** clicar **"Abrir TPV"**.

3. **Criar um pedido**

   - Clicar num **produto** (ex. Café Profundo €2.50) para adicionar ao carrinho.
   - Ver o **carrinho** com o item e o total.
   - Clicar **"Criar Pedido"**.
   - Deve aparecer uma mensagem do tipo **"Pedido #… pago (cash). Total: € …"**.

4. **Ver o pedido no KDS**
   - Abrir **outra aba** (ou outra janela) e colar: `http://localhost:5175/op/kds`
   - Ou: na mesma sessão, navegar para **KDS** (sidebar do Dashboard → **KDS** ou **Cozinha (KDS)**).
   - **O que deves ver:** na fila do KDS, um pedido (ex. com o item que vendeste), em estado **novo** ou **em preparação**. Se a fila estiver vazia, pode ser que o pedido já tenha sido marcado como pronto ou que o KDS mostre só pedidos "ativos"; nesse caso, criar outro pedido no TPV e voltar ao KDS de imediato.

Assim vês **um pedido criado no TPV a aparecer no KDS**.

---

## 3. Ver o sistema de tarefas a funcionar

- **Onde:** Página **Minhas Tarefas**.
- **Como chegar:**

  - URL direta: `http://localhost:5175/tasks`
  - Ou: Dashboard → tile **Tarefas** (✅).

- **O que deves ver:**
  - Título **"Minhas Tarefas"** e texto do tipo **"Tarefas pendentes e sugestões"**.
  - Com **turno aberto**: pode aparecer texto do tipo "Abra um turno (TPV ou App Staff) para ver e marcar o checklist do turno" ou lista de tarefas.
  - Se existirem **tarefas** (geradas por eventos: turno aberto, pedido novo, etc.), vês itens na lista; podes **concluir uma** (botão/ação "Concluir" ou equivalente).
  - Se não houver tarefas: **"Nenhuma tarefa pendente"**. Isso já é o sistema a funcionar: a página carrega, lê tarefas do Core (`gm_tasks`), e mostra lista vazia ou checklist do turno conforme o Core.

Para **aumentar a hipótese de ver tarefas:**

- Ter o **turno aberto**.
- Ter criado pelo menos **um pedido** no TPV (alguns fluxos geram tarefas a partir de pedidos).
- Ir a **/tasks** e, se existir, usar **"Atualizar"** ou recarregar a página.

Assim vês a **página de tarefas a funcionar** (lista vazia ou com tarefas e conclusão).

---

## Se não viste (verificação passo a passo)

- **Não viste a "instalação" do TPV**

  1. Abre **exatamente** esta URL (copiar e colar): `http://localhost:5175/app/install`
  2. Deves ver o título **Instalar TPV e KDS** e dois blocos (TPV e KDS). Se vires outra página (ex.: login), faz login primeiro e volta a abrir essa URL.
  3. "Ver o TPV a ser instalado" = (a) ver esta página de instalação + (b) clicar **Abrir TPV** (abre o TPV noutra aba) + (c) no browser dessa aba: Menu ⋮ → **Instalar app** / **Criar atalho**. O passo (c) é opcional; (a) e (b) já mostram o fluxo de instalação.

- **Não viste um pedido no KDS**

  1. **Turno tem de estar aberto.** Vai a `http://localhost:5175/dashboard`. Se aparecer "O turno ainda não está aberto", clica **Abrir turno** e completa (caixa inicial, etc.).
  2. Abre o TPV: `http://localhost:5175/op/tpv`. Adiciona um produto ao carrinho e clica **Criar Pedido**. Confirma que aparece mensagem de sucesso (ex. "Pedido #… pago").
  3. Abre o KDS **noutra aba**: `http://localhost:5175/op/kds`. O pedido deve aparecer na fila (novo ou em preparação). Se a fila estiver vazia, o pedido pode já ter sido marcado como pronto; cria outro pedido no TPV e refresca o KDS.

- **Não viste o sistema de tarefas a funcionar**
  1. Abre: `http://localhost:5175/tasks`
  2. Se vires **"Minhas Tarefas"** e **"Tarefas pendentes e sugestões"** (mesmo que a lista esteja vazia ou com "Nenhuma tarefa pendente"), o sistema **está** a funcionar: a página lê tarefas do Core e mostra o resultado.
  3. Para ver **itens** na lista: tem de haver turno aberto e, idealmente, pelo menos um pedido criado; algumas tarefas são geradas por eventos (abertura de turno, pedido novo). Recarrega a página ou usa **Atualizar** se existir.

---

## Resumo rápido (ordem sugerida)

| #   | O que ver      | Onde                                       | Ação                                                                                             |
| --- | -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 1   | Instalação TPV | `/app/install`                             | Abrir página; clicar "Abrir TPV"; opcional: Menu browser → Instalar app.                         |
| 2   | Pedido no KDS  | `/op/tpv` → criar pedido; depois `/op/kds` | Abrir turno → TPV → adicionar produto → Criar Pedido → abrir KDS na mesma sessão.                |
| 3   | Tarefas        | `/tasks`                                   | Com turno aberto (e idealmente 1 pedido); abrir /tasks e ver lista ou "Nenhuma tarefa pendente". |

---

**Referência:** [VERIFICACAO_SISTEMA_E2E_REGISTO.md](./VERIFICACAO_SISTEMA_E2E_REGISTO.md) (tabela de módulos e onde o pedido aparece).
