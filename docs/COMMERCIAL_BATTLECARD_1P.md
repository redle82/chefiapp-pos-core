# ChefIApp — Battlecard (1-pager)

## Categoria (frase curta)
**ChefIApp = Página + Pedidos + Pagamento direto + POS/Operação** (sem marketplace / sem comissão).

## Promessa (1 frase)
**Em minutos, o restaurante publica uma página, aceita pedidos/pagamentos e tudo cai na operação (kitchen/ops)** — com dados do restaurante.

## Prova (demo em 30s)
1) Wizard → Publish
2) Abrir `/public/:slug`
3) “Criar pedido teste (1 item)” no portal
4) Pedido criado (ou bloqueio real + copy de upgrade)

## 3 argumentos para “matar GloriaFood”
1) **Operação real (POS-first):** não é só “formulário de pedido”; vira evento/ordem operacional.
2) **Pagamento do restaurante:** Stripe do merchant (não marketplace) + auditoria/limites.
3) **Cresce por planos (gates):** BASIC/PRO/EXPERIENCE sem reescrever produto.

## Comparativo rápido
| Produto | O que resolve | Onde perde (no teu pitch) |
|---|---|---|
| GloriaFood | Pedidos online simples | Não é POS; personalização limitada; evolução para multi-unidade/operacional é fraca |
| UpMenu / MenuDrive | Site+ordering white-label | Foco em ordering; operação e extensibilidade limitadas; tende a virar “plugin” |
| Wix / Squarespace | Site bonito/SEO | Não fecha pedido→cozinha; sem operação; checkout/fluxo restaurante é adaptado |
| Marketplaces (Uber/Deliveroo/Glovo) | Tráfego | Comissão + perda de dados/relacionamento; dependência |
| Square / Toast / Lightspeed | Suite POS + online | Excelente POS; web/experiência pode ser pesado/caro/complexo; menos foco no onboarding ultra-rápido |
| **ChefIApp** | **Operação + web + pagamento** | **— (posicionamento: “Restaurant OS com página e checkout nativos”)** |

## Objeções comuns e resposta curta
- “Eu já tenho site (Wix).” → Ótimo. **ChefIApp não compete com site; compete com operação + pedido + pagamento integrado.**
- “Eu uso marketplace.” → ChefIApp é para **vender direto sem comissão** e **reter dados do cliente**.
- “É difícil configurar.” → Hoje é **clone → run → demo** e wizard “zero-typing” para venda.

## Pitch de 30 segundos (script)
"O ChefIApp é o sistema operacional do restaurante com uma página nativa: em minutos você publica, recebe pedidos e pagamentos diretos, e isso entra na operação como pedido real. Sem marketplace, sem comissão, e com dados do restaurante. Se seu plano bloquear alguma feature, o produto mostra e orienta o upgrade — tudo dentro do fluxo."
