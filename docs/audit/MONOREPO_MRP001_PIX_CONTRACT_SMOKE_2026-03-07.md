# MRP-001 PIX Contract Smoke - 2026-03-07

Timestamp base: 2026-03-07 20:55 CET
Scope: validar comportamento de contrato/auth nas rotas PIX canonica e legado no `integration-gateway` standalone.

## Ambiente

- Service: `integration-gateway`
- URL: `http://localhost:4320`
- Runtime status: online durante smoke
- Nota: worker de outbound reportou erro de RPC (`get_pending_deliveries` ausente), sem bloquear os endpoints testados.

## Comandos executados

```bash
curl -i http://localhost:4320/health
curl -i -X POST http://localhost:4320/api/v1/payment/pix/checkout \
  -H 'Content-Type: application/json' \
  -d '{"order_id":"ord-smoke","amount":1}'
curl -i -X POST http://localhost:4320/api/v1/payment/pix/br/checkout \
  -H 'Content-Type: application/json' \
  -d '{"order_id":"ord-smoke","amount":1}'
curl -i -X POST http://localhost:4320/api/v1/payment/pix/checkout \
  -H 'Content-Type: application/json' \
  -H 'x-internal-token: chefiapp-internal-token-dev' \
  -d '{"order_id":"ord-smoke","amount":1}'
curl -i -X POST http://localhost:4320/api/v1/payment/pix/br/checkout \
  -H 'Content-Type: application/json' \
  -H 'x-internal-token: chefiapp-internal-token-dev' \
  -d '{"order_id":"ord-smoke","amount":1}'
```

## Resultados observados

- `GET /health`: `200 OK`
- `POST /api/v1/payment/pix/checkout` sem token: `401 Unauthorized`
- `POST /api/v1/payment/pix/br/checkout` sem token: `401 Unauthorized`
- `POST /api/v1/payment/pix/checkout` com `x-internal-token`: passou pelo auth e retornou `500` downstream (SumUp `400`)
- `POST /api/v1/payment/pix/br/checkout` com `x-internal-token`: passou pelo auth e retornou `500` downstream (SumUp `400`)

## Leitura tecnica

- Contrato de auth ficou consistente entre rota canonica e rota legado.
- Compatibilidade com `x-internal-token` foi preservada no cutover incremental.
- O comportamento `500` com token indica que o bloqueio atual esta na integracao externa (SumUp), nao no gate de auth/roteamento.

## Gate para MRP-001

- Criterio "auth consistente entre caminhos PIX" atendido.
- Proximo passo: aprovar ADR de autoridade e iniciar migracao de ownership de endpoint sem tocar no launch ACK.

## Pos-smoke (hardening de seguranca)

- Identificado risco de log sensivel durante erros de checkout upstream.
- Hardening aplicado para logar apenas mensagem sanitizada (sem objeto bruto de erro) em:
  - `integration-gateway/src/index.ts`
  - `server/integration-gateway.ts`

## Complemento de evidencia - runtime legado em compat mode

Timestamp: 2026-03-07 21:07 CET

- Processo escutando `:4320` identificado como:
  - `node .../ts-node server/integration-gateway.ts`
- `GET /health` respondeu com headers de compatibilidade do MRP-001:
  - `x-chefiapp-compat-mode: legacy-server`
  - `x-chefiapp-runtime-authority: integration-gateway`
  - `x-chefiapp-compat-route: /health`
  - `x-chefiapp-compat-deadline: 2026-03-14T18:00:00+01:00`

Leitura:

- Authority declarada e visivel no runtime legado.
- Janela de transicao com deadline explicito aplicada com sucesso.

## Delta de execucao (cutover controlado)

Atualizacao aplicada em `server/integration-gateway.ts`:

- Novo flag: `INTEGRATION_LEGACY_COMPAT_MODE` (default `1`).
- Com `INTEGRATION_LEGACY_COMPAT_MODE=0`, rotas sobrepostas do legado passam a responder:
  - `POST /api/v1/webhook/sumup` -> `410 compatibility_disabled`
  - `POST /api/v1/payment/pix/checkout` -> `410 compatibility_disabled`
  - `POST /api/v1/payment/pix/br/checkout` -> `410 compatibility_disabled`
- O endpoint de `health` permanece ativo, expondo `compat_mode` coerente com o flag.

## Evidencia objetiva - cutover com compatibilidade desligada (isolation run)

Timestamp: 2026-03-07 21:30 CET

Ambiente de teste isolado:

- Runtime legado iniciado em `:4321` com:
  - `PORT=4321`
  - `INTEGRATION_LEGACY_COMPAT_MODE=0`

Comandos executados (resumo):

- `GET http://localhost:4321/health`
- `POST http://localhost:4321/api/v1/webhook/sumup`
- `POST http://localhost:4321/api/v1/payment/pix/checkout`
- `GET http://localhost:4321/desktop/launch-acks/cutover-nonce-test`
- `POST http://localhost:4321/desktop/launch-acks`

Resultados observados:

- `GET /health` -> `200 OK`
  - `compat_mode=false`
  - header `x-chefiapp-compat-mode: disabled`
- `POST /api/v1/webhook/sumup` -> `410 Gone`
  - `error=compatibility_disabled`
- `POST /api/v1/payment/pix/checkout` -> `410 Gone`
  - `error=compatibility_disabled`
- `GET /desktop/launch-acks/:nonce` -> `200 {"found":false}`
- `POST /desktop/launch-acks` -> `202 {"recorded":true,...}`

Leitura tecnica:

- Cutover de rotas sobrepostas foi validado sem ambiguidade no runtime legado.
- Excecao P0 (`desktop/launch-acks`) permaneceu operacional.

## Gate operacional repetivel (versionado)

Comando oficial para repetir o smoke de cutover:

```bash
npm run smoke:mrp001-cutover
```

Implementacao: `scripts/flows/mrp001-cutover-smoke.sh`

Ultimo report gerado com sucesso (`EXIT:0`):

- `docs/audit/runs/mrp001-cutover-smoke-2026-03-07-225923.md`
