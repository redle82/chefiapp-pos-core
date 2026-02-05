## FASE 1 — Implementação Técnica do Fluxo de Pedido Operacional

**Objetivo:** Aproximar o código do contrato `docs/contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md` para a Fase 1, sem redesign, sem schema change prematuro e sem novas features. Foco em TPV → Core → KDS, imutabilidade mínima e auditabilidade básica.

Marcar cada item como concluído à medida que fores avançando.

---

## 1. TPV

### 1.1 `TPV.tsx` — rascunho em memória até confirmação

- [ ] Garantir que, enquanto o pedido não é confirmado, toda a edição (itens, quantidades, notas) vive em estado de UI/contexto, não em writes definitivos no Core.
- [ ] Só chamar `createOrder` / `create_order_atomic` quando o operador aciona explicitamente “Confirmar pedido”.
- [ ] Após confirmação:
  - [ ] Desativar botões de edição de itens/quantidades/nota para esse pedido.
  - [ ] Tornar claro no estado interno que o pedido está “locked” (confirmado).

### 1.2 `OrderContextReal.tsx` — bloquear edição após `createOrder`

- [ ] Introduzir flag de “pedido confirmado” no contexto para cada `order_id`.
- [ ] Em `addItemToOrder`:
  - [ ] Recusar/ignorar chamadas se o pedido estiver confirmado.
- [ ] Em `removeItemFromOrder`:
  - [ ] Recusar/ignorar chamadas se o pedido estiver confirmado.
- [ ] Em qualquer função que altere itens/total:
  - [ ] Verificar a flag e impedir alterações pós-confirmação.

### 1.3 `OrderContextReal.tsx` — documentar `OPEN ≈ CONFIRMED`

- [ ] Adicionar comentário claro na criação de pedido explicando que, **nesta fase**, o estado Core `OPEN` é tratado como equivalente a “CONFIRMED” no contrato.
- [ ] Incluir link para `docs/contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md` nesse comentário.

---

## 2. Core

### 2.1 `docker-core/schema/core_schema.sql` — comentar transições permitidas

- [ ] Rever enum/check de `gm_orders.status` (`OPEN`, `IN_PREP`, `READY`, `CLOSED`, `CANCELLED`).
- [ ] Adicionar comentários SQL com o mapeamento conceptual:
  - [ ] `OPEN` ≈ pedido confirmado pronto para cozinha.
  - [ ] `IN_PREP` ≈ EM_PREPARO.
  - [ ] `READY` ≈ PRONTO.
- [ ] Comentar (sem mudar lógica) as transições permitidas:
  - [ ] `OPEN` → `IN_PREP` → `READY` → `CLOSED`.

### 2.2 `OrderWriter.ts` — marcar add/remove item pós-create como legado

- [ ] Identificar funções que adicionam/removem/alteram itens após criação (`addOrderItem`, `removeOrderItem`, `updateOrderItemQty` ou equivalentes).
- [ ] Marcar essas funções como **@legacy** (ou anotação equivalente), com comentário:
  - [ ] “Violam imutabilidade pós-confirmação do contrato; mantidas apenas para compatibilidade temporária.”
- [ ] Garantir que o novo fluxo TPV (rascunho → confirmação) **não** depende mais delas.

### 2.3 `CoreOrdersApi.ts` — ponto único de log de mudanças de estado

- [ ] Centralizar logs estruturados em:
  - [ ] `createOrderAtomic`: log de “ORDER_CONFIRMED-like” (`order_id`, `restaurant_id`, total, timestamp).
  - [ ] `updateOrderStatus`: log de “ORDER_KDS_STATE_CHANGED-like” (`order_id`, de→para, origem = KDS/TPV).
- [ ] Garantir que nenhum outro sítio altera `gm_orders.status` sem passar por estas funções.

---

## 3. KDS

### 3.1 `KDSMinimal.tsx` — só KDS altera estados de cozinha

- [ ] Confirmar que todas as ações de estado (em preparo, pronto) usam `updateOrderStatus` / `OrderWriter`.
- [ ] Verificar/ajustar que o TPV **já não** chama diretamente estas transições (remover/encapsular `performOrderAction("prepare"|"ready")` que usa PostgREST direto).
- [ ] Garantir que o estado inicial exibido no KDS é coerente com o estado Core (`OPEN` tratado como “NOVO” na UI, mesmo que o nome bruto não mude ainda).

### 3.2 `OrderReader.ts` — validar `readActiveOrders` conforme contrato

- [ ] Rever `readActiveOrders` para confirmar quais `status` entram (ex.: `OPEN`, `IN_PREP`, `READY`).
- [ ] Ajustar, se necessário, para:
  - [ ] Excluir `CLOSED`/`CANCELLED` da lista de ativos.
  - [ ] Garantir que o KDS não vê pedidos que já não são operacionais.

---

## 4. Testes

### 4.1 Core — transições válidas/inválidas

- [ ] Criar testes (no Core) que cubram:
  - [ ] Transições permitidas: `OPEN` → `IN_PREP` → `READY` → `CLOSED`.
  - [ ] Transições proibidas: `READY` → `OPEN`, `CLOSED` → qualquer outro, etc.
- [ ] Testar que `create_order_atomic` gera um pedido consistente:
  - [ ] status inicial esperado.
  - [ ] itens e totais coerentes.

### 4.2 Front — 1 fluxo TPV → KDS

- [ ] Criar um teste (Vitest / e2e mínimo) que:
  - [ ] Abre o TPV, cria e confirma 1 pedido.
  - [ ] Verifica que o pedido aparece no KDS.
  - [ ] Muda estado para “em preparo” e “pronto”.
  - [ ] Verifica que o estado no Core/KDS é coerente e não há erro de DB.

---

## 5. Validação Fase 1

### 5.1 TESTE CANÓNICO (manual)

- [ ] Executar o TESTE CANÓNICO da Fase 1 (20 pedidos seguidos) definido a partir de `docs/contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md`:
  - [ ] TPV: rascunho → confirmação sem erro.
  - [ ] Core: imutabilidade pós-confirmação e dados consistentes.
  - [ ] KDS: estados `NOVO` / `EM_PREPARO` / `PRONTO` mapeados corretamente.
  - [ ] Zero `relation does not exist`, zero erros de DB, zero pedidos duplicados ou “fantasma”.

### 5.2 Registo do resultado

- [ ] Registar no diário (`docs/ops/USO_REAL_PROLONGADO_PILOTO.md` ou doc equivalente):
  - [ ] Resultado em 1 linha:
    - `FASE 1 PASSOU.`
    - ou `FASE 1 FALHOU — quebrou aqui:` + screenshot/log.
  - [ ] Notas mínimas sobre qualquer fricção encontrada.

