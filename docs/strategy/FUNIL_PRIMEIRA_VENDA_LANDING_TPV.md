# Funil “Landing → Demo → Primeira Venda” — ChefIApp™ OS

> Documento interno. Liga narrativa de landing, fluxo de demo e produto real (TPV/KDS/Tasks) num único funil executável e mensurável.

---

## 1. Objetivo

Garantir que qualquer pessoa que entra pela landing do ChefIApp™ OS consegue, em poucos passos e sem fricção, chegar a:

1. **Fazer login / acesso demo**
2. **Criar o primeiro pedido real no TPV**
3. **Ver esse pedido na cozinha (KDS)**
4. **Ver pelo menos um sinal de risco/tarefa ou métrica mexer**

Este é o **ritual de “primeira venda” dentro do produto**, alinhado com `SIMULACAO_PRIMEIRA_VENDA.md`.

---

## 2. Ponto de partida — Landing v2

### 2.1. CTAs relevantes na landing

- Hero (`HeroV2`):
  - **Primário**: “Começar 14 dias grátis” → rota de autenticação por telefone (`/auth/phone`).
  - **Secundário**: “Ver o sistema a operar” → âncora `#plataforma`.
- Secções de prova:
  - `InsideSystemV2` (“Veja o sistema em funcionamento”) mostra mockups do dashboard, TPV e KDS.
  - `ToolsAvoidV2`, `HardObjectionsV2` e `SystemLimitsV2` alinham expectativa.

### 2.2. Expectativa gerada

Ao clicar em “Começar 14 dias grátis”, o utilizador espera:

- experiência simples (sem cartão, sem contrato);
- conseguir **reproduzir o que viu nas imagens**:
  - abrir um TPV,
  - lançar um pedido,
  - ver na cozinha,
  - sentir controlo, não caos.

O funil abaixo existe para garantir que isso acontece com o produto atual.

---

## 3. Fluxo alvo — visão macro

```text
Landing v2  →  Autenticação / criação de conta  →  Escolher restaurante (tenant)
           →  Ativar modo demo/piloto           →  Abrir TPV real
           →  Criar 1 pedido                    →  Ver no KDS
           →  Ver pelo menos 1 métrica / tarefa mexer
```

Os detalhes de cada etapa podem mudar (ex.: onboarding mais curto, um botão “Entrar em modo demo”), mas o **núcleo** deve permanecer.

---

## 4. Etapas detalhadas do funil

### 4.1. Landing → Autenticação

**Entrada:** clique em “Começar 14 dias grátis” (`HeroV2`, `PricingV2`, `CTABannerV2`).

**Requisitos:**

- Levar sempre para um fluxo de autenticação coerente (`/auth/phone`).
- Permitir:
  - criar nova sessão demo/piloto;
  - ou recuperar sessão existente (restaurante já configurado).

**Recomendações:**

- Se estiveres em modo **demo guiada** (pilotos internos), considerar um query param/flag (ex.: `?trial=true`) que sinalize:
  - criação de tenant de demonstração;
  - uso de restaurante seed (Docker) quando aplicável.

### 4.2. Autenticação → Restaurante / Tenant

Depois de autenticado:

- `TenantContext` + `TenantResolver` devem:
  - resolver o restaurante ativo (tenant selado);
  - em multi-tenant, pedir escolha explícita de restaurante (não escolher aleatório).

**Para o funil de primeira venda:**

- Garantir que há **pelo menos um restaurante** pronto para teste:
  - em dev: seed `SEED_RESTAURANT_ID` (Docker);
  - em produção: restaurante criado no onboarding inicial.

### 4.3. Restaurante → Demo / Piloto

Articular com `SIMULACAO_PRIMEIRA_VENDA.md`:

- Definir, para a experiência de demo:
  - se o restaurante entra em modo `exploracao` (dados de exemplo) ou `operacao-real`;
  - se o TPV vai arrancar com `isTrialMode`/`isTrialData` true;
  - se alguns pedidos/exemplos iniciais são criados automaticamente (como já existe em `TPV.tsx` para `isTrialData`).

**Objetivo aqui:** o operador não deve ter de “inventar” tudo; o produto deve ajudá-lo a ver rapidamente:

- 1–3 mesas,
- 1–3 produtos,
- 1 pedido exemplo.

---

## 5. TPV — “Primeira venda” dentro do produto

### 5.1. Entrada no TPV

**Rota operacional:** rota de TPV real já existe (`TPV.tsx`, guardada por `useOperationalReadiness("TPV")`).

**Roteiro mínimo:**

1. TPV carrega com:
   - `restaurantId` resolvido (tenant/runtime/tab storage);
   - Core online (`bootstrap.coreStatus === "online"`) ou modo trial.
2. `TPVLockScreen`:
   - operador escolhe role (manager/waiter),
   - `start_turn` bem-sucedido.
3. Caixa:
   - se necessário, abrir caixa (modal `OpenCashRegisterModal`).

### 5.2. Criar o primeiro pedido

Existem dois caminhos principais:

1. **Via mapa de mesas (`TableMapPanel`)**
   - selecionar mesa → `handleCreateOrderViaMap` cria pedido vazio ligado à mesa (se caixa aberta e menu publicado);
   - adicionar itens via `QuickMenuPanel` → `handleAddItem` + `createOrder`/`addItemToOrder`.

2. **Via rascunho (sem mesa)**
   - adicionar itens no menu sem pedido ativo → `draftItems`;
   - confirmar rascunho → `handleConfirmDraft` cria pedido com `createOrder`.

Para o funil de primeira venda:

- preferir **mapa de mesas + items reais do cardápio** (reforça sensação de operação real).

### 5.3. Ponto de fecho da “primeira venda”

**Definição operacional:** a “primeira venda” está concluída quando:

1. um pedido foi criado (Core confirmou `gm_orders` + `gm_order_items`);
2. pelo menos um item foi preparado/servido;
3. o pagamento foi concluído (em modo trial ou real).

No fluxo atual:

- `performOrderAction("pay")` + `PaymentEngine` + emissão fiscal simulada/real são a prova dentro do sistema.

---

## 6. KDS e Task Engine — prova de sistema ligado

### 6.1. KDS vê o pedido

Depois de criar o pedido:

- `KDSMinimal` deve listar o pedido:
  - `readActiveOrders(restaurantId)` lê o mesmo `restaurant_id`;
  - `readOrderItems` mostra itens por estação (BAR/KITCHEN).

Para o funil, o operador deve conseguir:

- ver o pedido no KDS;
- marcar pelo menos um item como `IN_PREP`/`READY`.

### 6.2. Tarefas/risco

Idealmente, durante/pouco depois da primeira venda:

- gerar pelo menos **uma tarefa automática** (ex.: atraso simulado, stock crítico de teste) em `gm_tasks`;
- mostrar essa tarefa em:
  - `TaskPanel` no KDS,
  - ou `TaskSystemMinimal`.

Isto fecha a narrativa de “monitor de risco” na prática.

---

## 7. Instrumentação e medição do funil

Usar `OBSERVABILITY_MINIMA.md` + `ObservabilityPage.tsx` como base.

### 7.1. Eventos a observar

Para cada sessão que vem da landing, interessa saber:

1. **Landing → Auth**
   - contador de sessões que clicam em “Começar 14 dias grátis”.

2. **Auth → Restaurante/Tenant**
   - quantas sessões chegam a ter `tenantId` resolvido.

3. **Restaurante → TPV**
   - quantas entram na rota TPV após login (vista operacional aberta).

4. **TPV → Pedido criado**
   - número de `createOrder` bem-sucedidos (por sessão/dia).

5. **Pedido → KDS**
   - número de pedidos que aparecem em `readActiveOrders` para o mesmo restaurante.

6. **Pedido → Pagamento**
   - quantas ações `performOrderAction("pay")` são concluídas (mesmo em modo trial).

7. **Tarefas/risco disparados**
   - quantas tasks automáticas são criadas durante/instantes após a primeira venda.

### 7.2. Onde visualizar hoje

- `ObservabilityPage` (admin):
  - pedidos criados hoje;
  - erros;
  - latência de operações.
- Logs/tabelas no Core:
  - `gm_orders`, `gm_order_items`, `gm_tasks`, `gm_terminals`.

**Recomendação futura:** criar um card específico “Funil Primeira Venda” com:

- % de sessões que chegam ao TPV,
- % que criam um pedido,
- % que pagam o pedido,
- tempo médio até primeira venda na sessão.

---

## 8. Conexão com SIMULACAO_PRIMEIRA_VENDA.md

`SIMULACAO_PRIMEIRA_VENDA.md` define:

- frase de pitch;
- roteiro 5–7 minutos de conversa;
- objecções e respostas.

Este documento adiciona:

- **o lado produto/sistema** da mesma história:
  - por onde o lead entra (landing),
  - o que ele faz dentro do OS (TPV/KDS/Tasks),
  - como medir se chegou ao momento “vi o sistema a funcionar”.

Juntos, os dois documentos permitem:

- ensaiar a conversa,
- ensaiar a demo,
- medir se a demo está a ser realmente completada dentro do produto.

