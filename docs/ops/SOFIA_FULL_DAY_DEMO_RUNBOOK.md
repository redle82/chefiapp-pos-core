# SOFIA FULL DAY DEMO — Runbook operacional

**Objetivo:** Executar uma demonstração completa de um dia normal do Sofia Gastrobar no Docker/Core, com todas as superfícies principais abertas em simultâneo: pedidos multi-origem, tarefas, pagamento e verificação de relatórios. Serve tanto para **demo** como para **validação manual completa** do ambiente.

**Pré-requisito:** Ambiente Sofia operacional ativo ([SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md)). Checklist operacional ([SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) §6) pode ser executado antes para garantir que o ambiente está verde.

**Plano de execução prática (estado verificado, URLs, sessão/tenant, sequência A–H):** [SOFIA_PLANO_EXECUCAO_PRATICA.md](./SOFIA_PLANO_EXECUCAO_PRATICA.md).

**Referências:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md), [SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md](./SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md), [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md).

---

## 1. Pré-requisitos do ambiente

| Requisito | Como verificar |
|-----------|-----------------|
| **Docker Core** | PostgREST em 3001: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/rest/v1/` → 200. |
| **merchant-portal** | Dev server em 5175: `http://localhost:5175` responde. |
| **Config Sofia** | `.env.local` com `VITE_ALLOW_MOCK_AUTH=true`, `VITE_DEBUG_DIRECT_FLOW=true`, `VITE_CORE_URL=http://localhost:3001`. Para AppStaff no emulador Android: ver §8. |
| **Sessão ativa** | Abrir `http://localhost:5175/admin` → topbar mostra **"Sofia Gastrobar"**, sem "Sessão encerrada". |
| **Catálogo** | Produtos visíveis no Admin (Catálogo/Produtos) e nas superfícies de venda (TPV, AppStaff, Web, QR). |
| **Equipe** | 5 pessoas no restaurante 100 (Admin → Config → Pessoas ou equivalente); AppStaff lista pessoas para check-in. |
| **Mesas** | Mesas 1–10 existem para o restaurante 100 (seed); usar ex.: mesa 1 (TPV), mesa 2 (Comandeiro), mesa 3 (QR Mesa). |

Se algum ponto falhar, seguir [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md) e aplicar migrações/config indicadas.

---

## 2. Superfícies que devem estar abertas

Todas no **mesmo restaurante (tenant 100)** e, quando exigir sessão, na **mesma sessão do dono (mock pilot)**. Base URL: `http://localhost:5175` (ou o porto em uso).

| # | Superfície | URL | Quem usa na demo | Nota |
|---|------------|-----|------------------|------|
| 1 | **Admin** | `/admin` ou `/admin/reports/overview` | Dono / apresentador | Topbar "Sofia Gastrobar"; relatórios, config, pessoas. |
| 2 | **TPV central** | `/op/tpv` | Operador caixa / dono | Venda por mesa; pedidos com origem CAIXA. |
| 3 | **KDS (ecrã único, abas Cozinha/Bar)** | `/op/kds` | Cozinha / bar | Abas "Todas", "Cozinha" (KITCHEN), "Bar" (BAR). *Entrega:* hoje não há vista separada "Entrega"; pode usar aba "Todas" ou documentar como próxima fase. |
| 4 | **KDS só Cozinha** (opcional, segundo ecrã) | `/op/kds?station=KITCHEN` | Cozinha | Filtro fixo cozinha (TPV KDS permite `?station=`). |
| 5 | **KDS só Bar** (opcional, segundo ecrã) | `/op/kds?station=BAR` | Bar | Filtro fixo bar. |
| 6 | **AppStaff web** | `/app/staff/home` | Dono, gerente, funcionários | Launcher; escolher pessoa → Comandeiro (mesas, pedidos). Origens: APPSTAFF (salão), APPSTAFF_OWNER (dono), APPSTAFF_MANAGER (gerente). |
| 7 | **AppStaff Android** (simulador) | WebView: `http://10.0.2.2:5175/app/staff/home` (emulador) | Funcionário / demo mobile | Ver §8. Requer `VITE_CORE_URL=http://10.0.2.2:3001` no host para o WebView falar com o Core. |
| 8 | **Web pública** | `/public/sofia-gastrobar` | Cliente (simulado) | Menu público; pedidos com origem WEB. |
| 9 | **QR Mesa** | `/public/sofia-gastrobar/mesa/1` (ex.: mesa 1) | Cliente na mesa (simulado) | Pedido com origem QR_MESA; mesa 1–10 válidas. |

**Ordem sugerida para abrir:** Admin (confirmar sessão) → TPV → KDS → AppStaff web → Web pública (aba anónima ou outro browser) → QR Mesa (aba) → opcional: AppStaff Android no emulador.

---

## 3. Papéis: dono, gerente, funcionários, cliente

| Papel | O que abre | O que faz na demo |
|-------|------------|-------------------|
| **Dono** | Admin, TPV (ou delegar), AppStaff como "Sofia" (owner) | Confirma topbar "Sofia Gastrobar"; pode criar pedido no Comandeiro (origem DONO); consulta relatórios no Admin; pode fechar venda no TPV. |
| **Gerente** | AppStaff como gerente | Entra no AppStaff com perfil gerente; cria pedido (origem GERENTE); pode criar/concluir tarefas; observa fluxo no KDS. |
| **Funcionário (garçom/cozinha)** | AppStaff (web ou Android) como Alex, Maria, Bruno ou Carla | Check-in no AppStaff; Comandeiro: criar pedidos por mesa (origem SALÃO); concluir tarefas (ex.: "Limpar mesa", "Mise en place"). |
| **Operador caixa** | TPV `/op/tpv` | Nova venda; associa a mesa; adiciona itens; confirma pedido (origem CAIXA). |
| **Cozinha / Bar** | KDS `/op/kds` (abas Cozinha / Bar) | Vê pedidos chegarem; marca itens em preparação / prontos (se a UI o permitir). |
| **Cliente** | Web pública ou QR Mesa | Navega menu; adiciona ao carrinho; envia pedido (origem WEB ou QR_MESA). |

Na demo, uma única pessoa pode simular vários papéis abrindo várias abas/janelas e, no AppStaff, entrando e saindo com pessoas diferentes.

---

## 4. Sequência da demo (ordem operacional)

### Fase A — Preparação (≈5 min)

1. **Subir ambiente** (se ainda não estiver): Core (3001), merchant-portal (5175), `.env.local` Sofia.
2. **Abrir Admin** → `http://localhost:5175/admin` → confirmar topbar **"Sofia Gastrobar"** e sessão ativa.
3. **Abrir todas as superfícies** em abas/janelas (ver §2). Manter **KDS** visível num ecrã (ou segunda janela) para ver pedidos a aparecer.
4. **AppStaff web:** ir a `/app/staff/home` → escolher uma pessoa (ex.: Alex) e entrar no Comandeiro para confirmar mesas e menu.

### Fase B — Pedidos multi-origem (≈10 min)

Criar **pelo menos** estes pedidos (ordem livre):

| # | Origem | Onde criar | Mesa (se aplicável) | Ver no KDS |
|---|--------|------------|----------------------|------------|
| 1 | **CAIXA (TPV)** | TPV `/op/tpv`: nova venda → mesa 1 → adicionar itens → confirmar | Mesa 1 | Badge **CAIXA**; itens por estação (Cozinha/Bar). |
| 2 | **SALÃO (Comandeiro)** | AppStaff: Comandeiro → mesa 2 → adicionar itens → enviar | Mesa 2 | Badge **SALÃO** (ou APPSTAFF). |
| 3 | **WEB** | Web pública `/public/sofia-gastrobar`: escolher produtos → enviar pedido | — | Badge **WEB**. |
| 4 | **QR MESA** | QR Mesa `/public/sofia-gastrobar/mesa/3`: escolher produtos → Enviar pedido | Mesa 3 | Badge **QR MESA**. |
| 5 | **DONO / GERENTE** (opcional) | AppStaff: entrar como Sofia (owner) ou gerente → Comandeiro → mesa 4 → pedido | Mesa 4 | Badge **DONO** ou **GERENTE**. |

Após cada pedido: **confirmar no KDS** (`/op/kds`) que o pedido aparece, com a **origem correta** no badge e, se aplicável, itens na aba **Cozinha** ou **Bar** consoante o `station` do produto.

### Fase C — KDS: Cozinha, Bar (e entrega)

- **KDS** é um único ecrã com **abas**: Todas | Cozinha | Bar.
- **Cozinha:** selecionar aba "Cozinha" → só itens com `station = KITCHEN`.
- **Bar:** selecionar aba "Bar" → só itens com `station = BAR`.
- **Entrega:** não existe hoje vista separada "Entrega"; na demo usar aba "Todas" ou considerar "entrega" como próxima fase. Opcional: abrir segundo ecrã com `/op/kds?station=KITCHEN` (só cozinha) e outro com `/op/kds?station=BAR` (só bar).

### Fase D — Tarefas da equipe (≈5 min)

1. **AppStaff** (web ou Android): ir à secção **Tarefas** (Launcher → Tarefas).
2. **Criar 1 tarefa** manual (ex.: "Mise en place bar", "Limpar mesa 2").
3. **Concluir** a mesma tarefa (check / Resolver).
4. **Confirmar:** tarefa deixa de aparecer na lista de abertas (ou aparece como concluída, consoante UI); em `gm_tasks` fica RESOLVED (opcional verificação via API/Admin).
5. Opcional: gerar tarefa automática "Limpar Mesa" (quando um pedido for pago/fechado) e concluir.

### Fase E — Pagamento (≈5 min)

**Estado atual do sistema:** O fluxo de pagamento pode ser:

- **TPV:** Fechar venda na mesa (marcar como pago). Se existir botão "Fechar"/"Pagar" por pedido ou por mesa, usar esse fluxo.
- **AppStaff (Comandeiro):** Para pedidos em mesa, pode existir ação "Cobrar"/"Pagar" que abre modal e chama `performOrderAction(orderId, "pay", payload)` (método cash/cartão, gorjeta). Usar esse fluxo para pelo menos um pedido de mesa.
- **Stripe:** Se não houver integração Stripe ativa no ambiente Docker/Core, **"pagamento feito"** na demo significa: **marcar o pedido como pago** via TPV ou via AppStaff (ação Pagar com método "dinheiro" ou "cartão" simulado). O Core regista o pagamento; não é necessário cobrança real.

**Na demo:** (1) No TPV, fechar pelo menos uma venda (mesa 1) como paga. (2) No AppStaff, para outro pedido (ex.: mesa 2), abrir "Cobrar"/"Pagar" e confirmar pagamento (ex.: dinheiro). (3) Verificar no KDS ou no Admin que o estado do pedido/ordem reflete "pago" ou "fechado".

### Fase F — Relatórios no Admin (≈5 min)

1. **Admin** → **Relatórios** (`/admin/reports/overview`).
2. Abrir **Sales by period** (Vendas por período) → escolher período que inclua o dia da demo → confirmar que há dados coerentes com os pedidos feitos (restaurante 100).
3. Abrir **Operational activity** (Atividade operacional) → confirmar que reflete atividade do restaurante 100.
4. Opcional: **Daily closing**, **Staff**, etc., consoante disponibilidade.

**Critério de sucesso:** Os relatórios mostram dados do **restaurante 100** (não vazios nem de outro tenant); valores/períodos coerentes com a demo.

### Fase G — Fechar a demo

1. Resumir: pedidos por origem (CAIXA, SALÃO, WEB, QR MESA, opcional DONO/GERENTE) visíveis no KDS; tarefas criadas e concluídas; pelo menos um pagamento simulado; relatórios com dados do 100.
2. Opcional: preencher uma linha no **Registo de execução** do checklist Sofia (doc Fase 3 §6) com data e resultado "OK (demo full day)".

---

## 5. Pedidos mínimos da demo — resumo

| Origem | Onde | Mesa (ex.) | Badge esperado no KDS |
|--------|------|------------|------------------------|
| TPV | `/op/tpv` | 1 | CAIXA |
| Comandeiro (AppStaff) | `/app/staff/home` → Comandeiro | 2 | SALÃO |
| Web pública | `/public/sofia-gastrobar` | — | WEB |
| QR Mesa | `/public/sofia-gastrobar/mesa/3` | 3 | QR MESA |
| Dono/Gerente (opcional) | AppStaff como owner/gerente | 4 | DONO / GERENTE |

Todos devem aparecer no KDS com a origem correta e, consoante produto, na aba Cozinha ou Bar.

---

## 6. Como confirmar: origem, estação, KDS, relatórios

| O que confirmar | Onde | Esperado |
|-----------------|------|----------|
| **Origem do pedido** | KDS: badge no card do pedido | CAIXA, SALÃO, WEB, QR MESA, DONO, GERENTE (conforme [APPSTAFF_ORDER_ORIGINS_CONVENTION](../../architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md)). |
| **Estação (cozinha/bar)** | KDS: abas Cozinha / Bar | Itens com `station = KITCHEN` só na aba Cozinha; `station = BAR` só na aba Bar. |
| **Reflexo no KDS** | `/op/kds` | Todos os pedidos criados (OPEN/IN_PREP) aparecem; polling ~5–30 s — aguardar ou refrescar uma vez. |
| **Reflexo em tarefas** | AppStaff → Tarefas | Tarefa criada aparece na lista; após concluir, sai das abertas (ou marcada concluída). |
| **Reflexo em relatórios** | Admin → Relatórios | Sales by period e Operational activity mostram dados do restaurante 100 para o período da demo. |

---

## 7. AppStaff no simulador Android

- **Objetivo:** Mostrar o mesmo AppStaff (Comandeiro, tarefas) no telemóvel simulado, ligado ao mesmo Core e tenant 100.
- **Como abrir:** (1) Emulador Android a correr (AVD). (2) merchant-portal no host com `VITE_CORE_URL=http://10.0.2.2:3001` (e `VITE_ALLOW_MOCK_AUTH=true`, `VITE_DEBUG_DIRECT_FLOW=true`). (3) `pnpm run expo:android` (ou `cd mobile-app && npx expo run:android`). O app abre e a WebView carrega `http://10.0.2.2:5175/app/staff/home`.
- **O que validar:** Launcher carrega; lista de pessoas; entrar como um funcionário; Comandeiro com mesas e menu; criar um pedido (opcional); tarefas listadas. Tudo no tenant 100.
- **Nota:** Com `VITE_CORE_URL=http://10.0.2.2:3001`, o browser no host (localhost:5175) também usa esse URL; se o Core estiver só em localhost, o browser no host pode falhar a chamadas ao Core. Para demo só web, usar `VITE_CORE_URL=http://localhost:3001` e deixar Android para um bloco dedicado ou segundo ambiente.

Detalhe: [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md).

---

## 8. QR Mesa — URL, mesa, simular cliente

| Campo | Valor |
|-------|--------|
| **URL** | `http://localhost:5175/public/sofia-gastrobar/mesa/<número>` |
| **Mesas válidas** | 1 a 10 (seed do restaurante 100). Ex.: mesa 1 → `/public/sofia-gastrobar/mesa/1`. |
| **Simular cliente** | Abrir a URL no browser (pode ser em aba anónima ou outro dispositivo na mesma rede). Navegar no menu, adicionar ao carrinho, "Enviar pedido". O pedido é criado com origem **QR_MESA** e `table_number` no sync_metadata. |
| **Após envio** | Redirecionamento para página de confirmação/estado do pedido; no KDS o pedido aparece com badge "QR MESA". |

---

## 9. Pagamento — o que significa nesta demo

- **Sem Stripe ativo (ambiente Docker/Core típico):** "Pagamento feito" = **marcar o pedido como pago** na aplicação (TPV ou AppStaff), com método "dinheiro" ou "cartão" (simulado). O Core regista o estado de pagamento; não há cobrança real.
- **Com Stripe (se configurado):** Seguir o fluxo real de pagamento da aplicação; fora do âmbito mínimo deste runbook.
- **Na demo:** Basta fechar pelo menos um pedido como pago (TPV ou AppStaff) e confirmar que o estado atualiza (pedido pago/fechado; eventual tarefa "Limpar Mesa" gerada, se implementado).

---

## 10. Critério de sucesso da demo

A **SOFIA FULL DAY DEMO** considera-se bem-sucedida quando:

1. **Ambiente:** Sessão "Sofia Gastrobar" ativa; Core e portal acessíveis.
2. **Superfícies:** Admin, TPV, KDS, AppStaff web, Web pública e QR Mesa abertos e operacionais no tenant 100; opcional: AppStaff Android no emulador.
3. **Pedidos:** Pelo menos 1 pedido TPV (CAIXA), 1 Comandeiro (SALÃO), 1 Web (WEB), 1 QR Mesa (QR MESA); todos visíveis no KDS com o badge de origem correto.
4. **KDS:** Abas Cozinha e Bar refletem itens por estação; pedidos aparecem em tempo útil (polling).
5. **Tarefas:** Pelo menos 1 tarefa criada e concluída no AppStaff; reflexo em `gm_tasks` ou na lista de tarefas.
6. **Pagamento:** Pelo menos 1 pedido marcado como pago (TPV ou AppStaff); estado coerente no sistema.
7. **Relatórios:** Sales by period e Operational activity (Admin) mostram dados do restaurante 100 coerentes com a demo.

Se algum ponto falhar, registar no Troubleshooting (§11) e considerar demo **parcial** (indicar o que ficou por demonstrar).

---

## 11. Troubleshooting mínimo

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| "Sessão encerrada" / "Restaurante" na topbar | Mock auth ou tenant não ativo | `.env.local`: `VITE_ALLOW_MOCK_AUTH=true`, `VITE_DEBUG_DIRECT_FLOW=true`; reiniciar portal; recarregar. |
| Pedido não aparece no KDS | Tenant diferente, Core em baixo, ou polling ainda não atualizou | Confirmar que TPV/AppStaff/Web/QR estão no tenant 100; verificar Core 3001; aguardar 5–30 s ou refrescar KDS. |
| Origem errada no KDS | Bug ou convenção de mapeamento | Ver [APPSTAFF_ORDER_ORIGINS_CONVENTION](../../architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md); reportar se inconsistente. |
| AppStaff Android não carrega / não fala com Core | WebView usa localhost:3001 (emulador) | No host, usar `VITE_CORE_URL=http://10.0.2.2:3001` e reiniciar portal; emulador acessa host por 10.0.2.2. |
| QR Mesa / Web: "Restaurante não encontrado" | Slug errado ou Core sem dados | URL exata: `/public/sofia-gastrobar` e `/public/sofia-gastrobar/mesa/1`; Core com restaurante 100 e slug `sofia-gastrobar`. |
| Relatórios vazios ou de outro restaurante | Filtro de período ou tenant | Confirmar que está na sessão do restaurante 100; escolher período que inclua o dia/hora da demo. |
| Tarefa não aparece / não conclui | Core ou RPC | Verificar `gm_tasks` e RPCs `create_task`, `complete_task`; [SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md](./SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md). |

### Alternar entre browser (host) e emulador Android

| Contexto | O que mudar em `merchant-portal/.env.local` | Depois |
|----------|---------------------------------------------|--------|
| **Só browser no host** | `VITE_CORE_URL=http://localhost:3001` | Reiniciar portal; abrir `http://localhost:5175`. |
| **AppStaff no emulador Android** | `VITE_CORE_URL=http://10.0.2.2:3001` | Reiniciar portal; no emulador a WebView carrega `http://10.0.2.2:5175/app/staff/home` e o bundle usa 10.0.2.2:3001 para o Core. |

Detalhe: [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md) (Opção A / Opção B).

---

## 12. Próximas fases (fora deste runbook)

- **Multi-restaurante:** Demo atual é um único restaurante (100). Suporte a vários restaurantes e troca de contexto fica para fase própria.
- **Vista KDS "Entrega":** Hoje KDS tem Cozinha e Bar; vista/filtro "Entrega" pode ser adicionada em fase futura.
- **Stripe / pagamento comercial:** Integração real de cobrança e reconciliação fica para configuração de produção/billing.
- **Desfragmentação / refactor:** Melhorias de código ou UX não fazem parte do âmbito deste runbook.

---

## 13. Referências cruzadas

- **Ativar ambiente Sofia:** [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md)
- **Checklist operacional (validação curta):** [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) §6
- **Rotina do checklist:** [SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md)
- **Superfícies em paralelo (smoke):** [SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md](./SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md)
- **AppStaff Android:** [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md)
- **Validação oficial do Sofia:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md)

---

*Runbook SOFIA FULL DAY DEMO. Última atualização: 2026-03.*
