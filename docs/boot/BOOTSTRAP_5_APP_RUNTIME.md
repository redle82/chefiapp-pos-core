# Bootstrap 5 — App Runtime Boot

Pôr os módulos a rodar em cima do mundo: TPV, KDS, Cliente conectam ao Core (PostgREST); Realtime habilitado; integrations via ingest; task system activo. Saída: **o restaurante funciona no dia-a-dia**.

---

## Purpose

Garantir que as aplicações (merchant portal com TPV/KDS, cliente web/QR, integrações, task system) estão ligadas ao Core e que o Realtime está habilitado para actualizações em tempo real. Este é o bootstrap “operacional” — o restaurante funciona no dia-a-dia.

---

## Inputs

- **Boot 0** — PostgREST e Realtime a correr; nginx a expor API e WebSocket.
- **Boot 1** — Schema e RPCs; pedidos e itens podem ser criados/actualizados.
- **Boot 2** — Identidade (Keycloak + tenancy) para auth do portal.
- **Boot 3** — Billing válido para acesso ao runtime.
- **Boot 4** — Restaurante operacional (store, mesas, menu mínimo).

---

## Outputs

- Merchant portal a correr (npm run dev ou build servido); aponta para Core (PostgREST em localhost:3001 ou equivalente).
- TPV e KDS acessíveis; criam e actualizam pedidos via Core; Realtime recebe eventos (se subscrito).
- Cliente (web/QR) acessível e a mostrar estado de pedidos quando implementado.
- Integrations ingest (UberEats, Gloria, etc.) a mapear pedidos externos para o Core quando configuradas.
- Task system activo: quando não há pedidos, tarefas REGULATORY podem ser geradas (conforme RPCs e contratos).
- Observabilidade e logs (embutidos no Boot 0 ou dedicados).
- **Saída semântica:** “o restaurante funciona no dia-a-dia”.

---

## Invariants

- TPV e KDS nunca escrevem preço ou imposto à mão; obedecem ao Menu e ao Core Finance.
- KDS não filtra silenciosamente pedidos por status desconhecido; mostra badge de alerta (ORDER_STATUS_CONTRACT_v1).
- Pedido só sai do KDS quando status terminal (SERVED, CANCELLED, FAILED, ARCHIVED, CLOSED).

---

## Commands

- **Subir o mundo (inclui Boot 0–1)** — `make world-up` ou `./scripts/chef-world-up.sh`.
- **Merchant portal** — Na raiz: `npm run dev` (ou cd merchant-portal && npm run dev). Garantir .env com VITE_SUPABASE_URL ou VITE_API_BASE apontando para o Core (ex.: http://localhost:3001).
- **Simulador de pedidos** — `docker compose -f docker-core/docker-compose.core.yml run --rm -e COUNT=20 simulator-orders` (stress/teste).
- **Caos (restart API)** — `make world-chaos` ou `./scripts/chef-world-chaos.sh postgrest`; validar que KDS/TPV reconectam (CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE).

Referências: [docs/strategy/CLI_CHEFIAPP_OS.md](../strategy/CLI_CHEFIAPP_OS.md), [docs/strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](../strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md), [simulators/orders/README.md](../../simulators/orders/README.md).

---

## Smoke tests

1. **TPV carrega** — Abrir merchant portal, ir ao TPV; a tela carrega sem erro 5xx ou tela em branco.
2. **KDS recebe pedido** — Criar pedido no TPV (mesa + item); enviar à cozinha; o pedido aparece no KDS.
3. **Transição de status** — No KDS, “Iniciar preparo” (IN_PREP); marcar item pronto (READY); pedido permanece visível até transição para SERVED/CLOSED.
4. **Realtime (opcional)** — Se o KDS subscrever canal de pedidos, alteração de status noutro cliente reflecte sem refresh manual.
5. **Checklist operacional** — Seguir [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](../strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md); todos os passos TPV e KDS em Pass. Se falhar, o mundo está quebrado (ERO_CANON).
