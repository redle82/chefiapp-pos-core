# Sofia Gastrobar — Fase 2 Passo 4: Superfícies em paralelo

**Objetivo:** Validar o restaurante em operação com múltiplas superfícies abertas ao mesmo tempo, todas no tenant 100, e confirmar que pedidos criados numa superfície aparecem no KDS.

**Referências:** [SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md), [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md).

---

## 1. Estado inicial antes do smoke (pré-condições)

- **Fase 1** ativa: sessão mock do dono, tenant 100, topbar “Sofia Gastrobar” (runbook aplicado).
- **Passo 2** (catálogo): produto SOFIA E2E PRODUCT ou catálogo existente disponível.
- **Passo 3** (5 funcionários): equipe de 5 no Core; Admin e AppStaff listam as 5 pessoas.
- **Core** a correr (PostgREST em 3001); **merchant-portal** a correr (porta 5175 por defeito).
- **Base URL:** `http://localhost:5175` (ou o porto configurado).

---

## 2. Superfícies a abrir (URLs)

| Superfície | URL | Como confirmar tenant 100 |
|------------|-----|----------------------------|
| **Admin** | `http://localhost:5175/admin/config` ou `/admin/config/general` | Topbar mostra “Sofia Gastrobar”; sem “Sessão encerrada”. |
| **TPV** | `http://localhost:5175/op/tpv` | TPV carrega; mapa/listagem de mesas ou venda; identidade do restaurante coerente. |
| **KDS** | `http://localhost:5175/op/kds` | KDS carrega pedidos ativos (OPEN, IN_PREP, READY) do Core; filtro por estação (cozinha/bar) se aplicável. |
| **AppStaff** | `http://localhost:5175/app/staff/home` | Lista de pessoas para check-in; após entrar como uma pessoa, Comandeiro/mesas disponíveis. |
| **Web (opcional)** | `http://localhost:5175/public/sofia-gastrobar` | Menu público do Sofia; pedido com origem WEB. |
| **QR Mesa (opcional)** | `http://localhost:5175/public/...` (rota da mesa, ex. mesa 1) | Menu por mesa; pedido com origem QR_MESA. |

Recomendação: abrir **Admin**, **TPV**, **KDS** e **AppStaff** em abas separadas (ou janelas) do mesmo browser, para partilhar sessão e tenant 100.

---

## 3. Ordem sugerida e verificação por superfície

1. **Admin** — Abrir primeiro; confirmar topbar “Sofia Gastrobar” e que não há “Sessão encerrada”. Se aparecer, aplicar runbook Fase 1 (`.env.local`, reiniciar portal).
2. **TPV** — Abrir `/op/tpv`; confirmar que carrega e que o restaurante é o Sofia (runtime/tenant 100).
3. **KDS** — Abrir `/op/kds`; confirmar que carrega; inicialmente pode estar vazio (sem pedidos). Deixar esta aba visível para o passo seguinte.
4. **AppStaff** — Abrir `/app/staff/home`; escolher uma pessoa (ex.: Alex) e entrar no Comandeiro; confirmar mesas e menu.

Para cada superfície, registrar: **abriu corretamente?** | **está no Sofia / tenant 100?** | **precisou refresh?** | **houve fallback?** (tabela em §7).

---

## 4. Pedido(s) de teste

### 4.1 Pedido a partir do TPV

1. Na aba **TPV** (`/op/tpv`): iniciar uma venda (nova venda ou mesa).
2. Adicionar pelo menos 1 item ao pedido (ex.: um produto do catálogo ou “SOFIA E2E PRODUCT”).
3. Associar a uma mesa se o fluxo do TPV o exigir (ex.: mesa 1).
4. Confirmar/criar o pedido (botão que chama `createOrder` → RPC `create_order_atomic` no Core).
5. **Verificar no KDS:** Na aba **KDS** (`/op/kds`), recarregar se necessário (ou aguardar polling ~5–30 s). O pedido deve aparecer na lista de pedidos ativos; origem esperada: **CAIXA** (ou equivalente para TPV).

### 4.2 Pedido a partir do Comandeiro (AppStaff)

1. Na aba **AppStaff**: já estar “dentro” como uma pessoa (ex.: Alex, garçom).
2. Ir ao Comandeiro (mesa): escolher uma mesa (ex.: mesa 2).
3. Adicionar pelo menos 1 item ao pedido e confirmar envio (cria pedido no Core com origem APPSTAFF ou GARCOM/waiter).
4. **Verificar no KDS:** Na aba **KDS**, o novo pedido deve aparecer; origem esperada: **SALÃO** (ou APPSTAFF/GARCOM conforme contrato de origens).

### 4.3 Pedido Web ou QR Mesa (opcional)

- **Web:** Abrir `/public/sofia-gastrobar`, escolher produtos e enviar pedido (origem WEB).
- **QR Mesa:** Abrir a URL da mesa, escolher produtos e enviar (origem QR_MESA).
- Em ambos os casos, confirmar no KDS que o pedido aparece com a origem correta.

---

## 5. Resultado no KDS — o que verificar

Para cada pedido criado:

| Verificação | Esperado |
|-------------|----------|
| **Pedido apareceu?** | Sim; lista de pedidos ativos (OPEN/IN_PREP/READY) inclui o novo pedido. |
| **Origem visível?** | Badge ou texto da origem (CAIXA, SALÃO, WEB, QR MESA, etc.) conforme [APPSTAFF_ORDER_ORIGINS_CONVENTION](../../architecture/APPSTAFF_ORDER_ORIGINS_CONVENTION.md). |
| **Estação correta?** | Itens filtrados por estação (KITCHEN/BAR) se o KDS tiver filtro por estação; itens do produto com station correto. |
| **Refresh necessário?** | KDS usa polling (ex.: 5–30 s); pode ser necessário aguardar ou recarregar uma vez. |

---

## 6. O que funciona / o que falhou

- **Fluxo esperado:** Todas as superfícies usam o mesmo `restaurant_id` (100) via runtime/tenant; TPV e Comandeiro escrevem em `gm_orders` / `gm_order_items` via `create_order_atomic`; o KDS lê `gm_orders` com `readActiveOrders(restaurantId)`. Portanto, desde que o tenant seja 100 e o Core esteja acessível, pedidos criados no TPV ou no Comandeiro devem aparecer no KDS após o próximo fetch.
- **Se algo falhar:** Verificar (1) topbar e sessão (tenant 100); (2) Core acessível (3001); (3) erros na consola do browser ao criar pedido; (4) RPC `create_order_atomic` exposta no PostgREST (migrações aplicadas).

---

## 7. Tabela de resultado do smoke (preencher após executar)

### Superfícies

| Superfície | Abriu? | Tenant 100 / Sofia? | Precisou refresh? | Fallback? | Notas |
|------------|--------|----------------------|-------------------|-----------|--------|
| Admin | | | | | |
| TPV | | | | | |
| KDS | | | | | |
| AppStaff / Comandeiro | | | | | |
| Web (opcional) | | | | | |
| QR Mesa (opcional) | | | | | |

### Pedidos no KDS

| Origem do pedido | Pedido apareceu no KDS? | Origem visível? | Estação correta? | Notas |
|------------------|--------------------------|-----------------|------------------|--------|
| TPV (CAIXA) | | | | |
| Comandeiro (SALÃO/APP) | | | | |
| Web / QR (opcional) | | | | |

---

## 8. Estado final do passo 4

Após executar o smoke e preencher a tabela §7:

- **Concluído:** Admin, TPV, KDS e AppStaff abertos no tenant 100; pelo menos um pedido de teste (TPV ou Comandeiro) criado e visível no KDS com origem identificável.
- **Parcial:** Superfícies abertas mas pedido não apareceu no KDS — descrever bloqueio (ex.: RPC em falta, erro ao criar pedido).
- **Bloqueado:** Impossível abrir alguma superfície no tenant 100 — descrever causa (ex.: sessão não ativa, Core em baixo).

Registo canónico do resultado: [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) §9 (Superfícies em paralelo / KDS) e tabela acima neste runbook.
