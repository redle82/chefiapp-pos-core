# Rota — Compras (Web de Configuração)

**Path exato:** `/purchases`  
**Tipo:** WEB CONFIG  
**Estado atual:** UI PARCIAL (página existe; backend/RPCs parciais).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** Gestão de compras e fornecedores: listar e criar pedidos de compra, associar fornecedores, acompanhar entregas e stock resultante. O dono usa esta ecrã para repor matérias-primas e manter inventário alinhado com a operação.
- **Para quem é:** Dono apenas — web de configuração. Não é ecrã de operação de sala/cozinha.
- **Em que momento do ciclo de vida:** Usada em TRIAL e ACTIVE; em SETUP pode estar acessível mas com estado vazio (sem fornecedores nem pedidos). Em SUSPENDED acesso à leitura pode ser permitido; escritas bloqueadas conforme política global.

---

## 2. Rota & Acesso

- **Path:** `/purchases`
- **Tipo:** WEB CONFIG (nunca bloqueada por billing nem por dados; guard igual às outras rotas web).
- **Guard aplicado:** CoreFlow — rotas web sempre ALLOW para utilizador autenticado com `hasOrg`. Não se aplica guard operacional (TPV/KDS).
- **Comportamento por SystemState:**
  - **SETUP:** ALLOW; mostrar estado vazio ou mensagem “Configure o seu restaurante (identidade e localização) para começar a usar compras”.
  - **TRIAL:** ALLOW; funcionalidade completa; dados reais do trial.
  - **ACTIVE:** ALLOW; funcionalidade completa.
  - **SUSPENDED:** ALLOW leitura; escritas (criar/editar pedidos de compra) conforme política de conta suspensa.

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant (contexto), Inventory/Stock (para sugerir reposição), fornecedores e pedidos de compra quando existirem no Core ou no backend local.
- **Entidades escritas:** Pedidos de compra, linhas de compra; eventualmente fornecedores (nome, contacto).
- **Eventos gerados (exemplos):** `PURCHASE_ORDER_CREATED`, `PURCHASE_ORDER_RECEIVED`, `STOCK_UPDATED` (quando a entrega atualiza stock). Não usar eventos “demo” ou “simulação”.

---

## 4. Backend & Dados

- **Tabelas envolvidas (nome lógico):** `purchase_orders`, `purchase_order_lines`, `suppliers` (ou equivalente no modelo local/Docker/Supabase). Se não existirem ainda, documentar como “pendente”.
- **RPCs esperadas:** Ex.: `list_purchase_orders`, `create_purchase_order`, `list_suppliers`, `get_inventory_low_stock` (sugestões de compra). Comportamento em backend local: usar mesmo esquema; se RPC não existir, retornar lista vazia e UI em estado vazio.
- **Estado vazio honesto:** “Ainda não há pedidos de compra.” / “Adicione fornecedores para criar o primeiro pedido.” Sem mensagem de “demo” ou “modo simulação”.

---

## 5. UI / UX Esperada

- **Estados:** (1) **Vazio** — sem fornecedores ou sem pedidos; CTAs: “Adicionar fornecedor”, “Criar primeiro pedido de compra”. (2) **Em uso** — lista de pedidos, filtros por estado/data; ações: criar, ver detalhe, marcar como recebido. (3) **Erro** — mensagem humana: “Não foi possível carregar as compras. Tente novamente.”
- **Mensagens:** Sem “demo”, sem “dados fictícios”; trial = dados reais do restaurante.
- **CTAs claras:** “Criar pedido de compra”, “Adicionar fornecedor”, “Ver stock baixo”.

---

## 6. Integração com Outras Rotas

- **De onde o utilizador vem:** Dashboard (módulo Compras), Config ou menu lateral.
- **Para onde pode ir:** Dashboard, Config, Financeiro (quando compras afetam fluxo de caixa), relatórios de stock/inventário se existirem.
- **Dependências:** Não depende de TPV/KDS ativos. Pode depender de “Identidade” e “Localização” configuradas para contexto do restaurante. Cardápio/inventário ajudam sugestões de compra mas não bloqueiam acesso à rota.

---

## 7. Regras de Negócio

- **Permitido:** Listar e criar pedidos de compra; listar e criar fornecedores; marcar pedidos como recebidos; ver estado vazio sem bloqueio.
- **Bloqueado:** Não bloquear a rota por billing; não exigir “plano pago” para abrir Compras em trial.
- **Regra de ouro:** Nunca apresentar esta rota como “demo” ou “simulação”; dados são sempre do restaurante (trial ou ativo).

---

## 8. Estado Atual

- **Estado:** UI PARCIAL — página `PurchasesDashboardPage` existe; backend/RPCs podem estar incompletos ou em Docker/Supabase local.
- **Próximo passo técnico:** (1) Garantir que `/purchases` está em `isWebConfigPath` se usar prefixo alternativo; (2) Implementar ou mapear RPCs/tabelas de compras no backend local; (3) Estado vazio com mensagens humanas e CTAs acima.
