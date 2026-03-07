# MRP-001: Gateway Boundary Inventory

Data: 2026-03-07
Autor: @goldmonkey777

## Escopo

Mapeamento das rotas duplicadas ou sobrepostas entre `server/integration-gateway.ts` e o pacote `integration-gateway/src/index.ts`. Este inventário atende ao D2 do Plano de Execução P0 para Monorepo Fragmentation.

## 1. Rotas com Duplicidade Direta (Conflito de Autoridade)

Estas rotas existem de forma semelhante em ambos os módulos.

| Rota / Endpoint                        | no `server/`                                   | no `integration-gateway/` | Análise                                                                                         | Decisão Alvo                        |
| :------------------------------------- | :--------------------------------------------- | :------------------------ | :---------------------------------------------------------------------------------------------- | :---------------------------------- |
| `GET /health`                          | Sim                                            | Sim                       | Ambos têm um endpoint de health check básico, mas o do `server` tem headers de compatibilidade. | **Consolidar** na autoridade única. |
| `POST /api/v1/sumup/checkout`          | Sim                                            | Sim                       | Criação de checkout SumUp. O `server` tem verificação de token interno rígida.                  | **Consolidar**                      |
| `GET /api/v1/sumup/checkout/:id`       | Sim (GET `/api/v1/payment/sumup/checkout/:id`) | Sim                       | Busca de status de checkout. Caminhos ligeiramente diferentes.                                  | **Consolidar**                      |
| `POST /api/v1/webhook/sumup`           | Sim                                            | Sim                       | Recepção de webhooks da SumUp.                                                                  | **Consolidar**                      |
| `POST /api/v1/payment/pix/checkout`    | Sim                                            | Sim                       | Criação de pagamento PIX.                                                                       | **Consolidar**                      |
| `POST /api/v1/payment/pix/br/checkout` | Sim                                            | Sim                       | Alias do endpoint de PIX.                                                                       | **Consolidar**                      |

## 2. Rotas Exclusivas do `server/integration-gateway.ts`

Estas rotas indicam que o `server` absorveu responsabilidades centrais do ecossistema que vão além de uma "integração gateway" passiva.

- `POST|GET /desktop/launch-acks/*`: Troca de ACK de inicialização com o Electron (`desktop-app`).
- `ALL /mobile/*`: Proxy de ativação e rotas para o `mobile-app`.
- `POST /internal/events`: Recepção de eventos do barramento.
- `POST /internal/product-images`: Proxy de upload pro bucket S3/MinIO.
- `POST /internal/billing/create-checkout-session`: Checkout de Stripe (SaaS).
- `ALL /api/v1/*`: Roteador protegido por `X-API-Key` manipulado via `handleApiV1`.

## 3. Rotas Exclusivas do pacote `integration-gateway/`

Rotas experimentais, de observabilidade ou que ainda não foram migradas.

- `POST /api/v1/webhook/stripe`: Webhooks da Stripe (hoje handled por Supabase Edge Functions na maioria das partes).
- `POST /api/v1/webhook/custom`: Webhooks custom isolados.
- `GET /api/v1/metrics`, `/api/v1/monitoring/*`: Endpoints avançados de observabilidade (Métricas, Latency, Alertas, Dashboards).
- `POST /api/v1/payment/merchants`, `POST /api/v1/payment/link-order`: Ferramentas avançadas do gateway.

## Conclusão Instrumental

A pasta `/server` se tornou o "Backend-For-Frontend" (BFF) primário da aplicação, resolvendo ACKs de desktop, onboarding de mobile, uploads, webhooks de billing e API chaves roteadas.

O módulo `/integration-gateway/` foi concebido como um microserviço dedicado especificamente a fluxos de pagamento (PIX, SumUp, Stripe checkout metrics) operando o Express framework. Hoje, seu código base é um reflexo avançado, mas suas principais rotas foram absorvidas e reimplementadas de forma "raw Node" dentro de `server/integration-gateway.ts` (devido a compatibilidades e limites de edge configs no passado).

A autoridade final deve ser declarada para evitar o custo mental e de CI de manter os dois fluxos.
