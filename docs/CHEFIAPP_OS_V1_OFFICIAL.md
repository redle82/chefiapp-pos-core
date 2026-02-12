# ChefIApp OS v1 — Declaração oficial

**Data:** 2026-02-11  
**Status:** Congelado (freeze)  
**Objetivo:** Declarar oficialmente o que é o produto v1 e fixar fronteiras até conclusão da Fase 1 (1000-ready).

---

## Definição em uma frase

ChefIApp OS v1 é um **sistema operacional operacional para restaurantes** com dois níveis claros: **Configuração** (onde o restaurante se define) e **Runtime** (onde o restaurante vive e executa). A separação entre ambos é lei de produto.

---

## Dois cérebros

### 1. Cérebro operacional (runtime)

**Onde o restaurante vive.** Rotas e áreas:

- Início (`/admin/home`)
- Clientes
- Cierres temporales
- **Gestor de reservas** (`/admin/reservations`) — lista do dia, status, check-in, cancelamento, criação manual
- Pagos
- Catálogo
- Reportes
- TPV, KDS, Staff App

Tudo o que é **execução** — pedidos, reservas do dia, pagamentos, tarefas, turno — vive aqui.

### 2. Cérebro estratégico (config)

**Onde o restaurante se define.** Tudo sob `/admin/config/*`:

- General (identidade, localização, recibo)
- Productos, Suscripción, Ubicaciones
- Reservas (regras: disponibilidade, turnos, política de cancelamento, mensajes)
- Integrações, Delivery, Empleados, Software TPV, Impresoras
- etc.

Tudo o que é **estrutura, regras e definição** vive aqui. Config governa; runtime obedece.

---

## Escopo v1 (resumo)

- **POS (TPV)** com pedidos, mesas, pagamentos, caixa
- **Reservas** operacional (gestor do dia) + config (regras)
- **KDS** e **Staff App** integrados
- **Config** completa (produtos, dispositivos, ubicaciones, integrações)
- **Multi-tenant** por `restaurant_id`; RLS desenhado/auditado
- **Device Gate** existente (validação contra `gm_equipment`); bloqueio remoto via `is_active`
- **Event bus** e contratos documentados

Detalhe: [SCOPE_FREEZE.md](strategy/SCOPE_FREEZE.md), [ESCOPO_PRODUTO_VENDAVEL.md](ESCOPO_PRODUTO_VENDAVEL.md).

---

## Fronteira a partir desta data

- **Novas features visíveis** param até conclusão da Fase 1 (1000-ready).
- **Alterações permitidas:** infraestrutura, Device Gate obrigatório, Query Discipline, observabilidade, índices, auditorias, contratos.

Ou seja: não se acrescenta produto novo ao utilizador; prepara-se o sistema para escalar sem quebrar.

---

## Referências

| Documento | Uso |
| --------- | --- |
| [strategy/SCOPE_FREEZE.md](strategy/SCOPE_FREEZE.md) | Escopo congelado; o que não será feito agora |
| [STATUS_V1_VENDAVEL.md](STATUS_V1_VENDAVEL.md) | O que está pronto / não pronto em v1 |
| [ESCOPO_PRODUTO_VENDAVEL.md](ESCOPO_PRODUTO_VENDAVEL.md) | O que entra e não entra em v1 |
| [contracts/CONFIG_RUNTIME_CONTRACT.md](contracts/CONFIG_RUNTIME_CONTRACT.md) | Contrato Config vs Runtime; Device Gate; "Se desligar aqui → morre lá" |
| [INDICE_DOCUMENTOS_V1.md](INDICE_DOCUMENTOS_V1.md) | Índice de todos os documentos v1 |

---

**Conclusão:** Este documento é a declaração oficial do baseline v1. Qualquer decisão de produto ("o que é v1?") deve apontar para aqui. A Fase 1 (Device Gate obrigatório + Query Discipline) executa-se sobre este baseline, sem alterar o que v1 entrega ao utilizador.
