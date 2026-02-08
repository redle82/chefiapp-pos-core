# Checklist KDS — Fluxo e validação humana

Passo a passo para QA humano ou validação em restaurante real.
Derivado do [ORDER_STATUS_CONTRACT_v1](../contracts/ORDER_STATUS_CONTRACT_v1.md).

---

## Pré-requisitos

- [ ] Docker Core no ar (`docker compose -f docker-core/docker-compose.core.yml up -d`)
- [ ] Merchant portal a correr (ex.: `npm run dev` no merchant-portal)
- [ ] Restaurante seed (`00000000-0000-0000-0000-000000000100`) — já criado pelo Core
- [ ] TPV e KDS na mesma origem (localhost + Docker = mesmo restaurant_id seed)

---

## Fluxo mínimo (passo a passo)

1. [ ] **TPV cria pedido** → status deve ser **OPEN** → **KDS mostra** o pedido na lista.
2. [ ] **Atualizar pedido para PREPARING** (via TPV ou RPC) → **KDS mantém** o pedido visível.
3. [ ] **Atualizar pedido para IN_PREP** (ex.: botão "Iniciar preparo" no KDS) → **KDS mantém** o pedido visível.
4. [ ] **Atualizar pedido para READY** (ex.: marcar itens como prontos) → **KDS mantém** o pedido visível.
5. [ ] **Atualizar pedido para SERVED** (ou **CLOSED** no Core actual) → **KDS remove** o pedido da lista (não aparece em "activos").

**Pergunta-chave:** O sistema mente para o operador ou não? Se o pedido está activo e não aparece, ou está terminal e continua a aparecer, falhou.

---

## Casos de stress

- [ ] **Status inválido/desconhecido** (ex.: valor fora do enum no Core) → pedido **aparece no KDS** com **badge ⚠️ "Status desconhecido"**; não some silenciosamente.
- [ ] **Status em lowercase** (ex.: `open` em vez de `OPEN`) → **normaliza** e mostra correctamente (KDS trata como OPEN se normalizado for OPEN).
- [ ] **Duplo clique em "Iniciar preparo" / READY** → comportamento **idempotente** (não quebra, não duplica acção).
- [ ] **API/Core reinicia** → após refresh ou novo polling, **pedidos activos voltam** a aparecer; KDS não fica vazio "para sempre" se os dados existem no Core.

---

## Regra de ouro (KDS)

Pedido **só sai** do KDS quando o status passa a **terminal** (SERVED, CANCELLED, FAILED, ARCHIVED ou CLOSED).
READY continua visível até haver transição para terminal.

---

## Referências

- Contrato: [ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md)
- OrderReader: `merchant-portal/src/core-boundary/readers/OrderReader.ts`
- KDS UI: `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`
