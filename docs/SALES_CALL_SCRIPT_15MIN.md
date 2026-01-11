# ChefIApp — Script de venda (15 minutos) — PT-PT (restaurante médio)

> Objetivo: call curta, sem slides, guiada por demo real (wizard → publish → pedido teste).

## 0) Setup (antes da call)
- Ter o demo pronto localmente:
  - `bash scripts/sofia-e2e.sh`
  - `bash scripts/sync-sofia-env-to-portal.sh`
  - `cd merchant-portal && npm run dev`
- Abrir o portal e deixar “Atualizar estado” pronto.

## 1) Abertura (0:00–1:00)
**Pergunta de contexto (1 só):**
- "Hoje vocês vendem online direto (site/WhatsApp) ou via marketplace? E o que mais vos dói: comissão, erros em horas de ponta, ou falta de controlo?"

**Frase-âncora:**
- "O ChefIApp dá ao restaurante uma página que aceita pedidos e pagamento direto e entra na operação como pedido real — sem comissão de marketplace e com os dados do restaurante."

## 2) Dor → custo (1:00–3:00)
Escolher 1 trilho (conforme resposta):
- Marketplace: "Que percentagem de comissão estão a pagar? E o cliente fica convosco ou com a plataforma?"
- WhatsApp: "Em horas de ponta, quantos erros aparecem (itens, moradas, pagamentos)? Quanto tempo a equipa perde a confirmar?"
- Site genérico (Wix): "Conseguem ligar pedido→cozinha e pagamento com rastreio (sem copiar/colar para o POS)?"

Fechar com:
- "O problema não é só presença online; é o fluxo pedido→operação — e o custo escondido de erros/tempo em horas de ponta."

## 3) Demo (3:00–10:00)
### 3.1 Wizard (3:00–6:00)
- No portal: clicar **Atualizar estado**.
- Mostrar passos: identidade → menu → pagamentos → design → publish.

### 3.2 Publicar (6:00–7:30)
- Clicar **Publicar página**.
- Abrir `/public/:slug` (página pública real).

### 3.3 Pedido real (7:30–10:00)
- Clicar **Criar pedido teste (1 item)**.
- Mostrar retorno com `order_id`.
- Se Stripe não estiver ligado: mostrar bloqueio real (409) como argumento:
  - "Aqui o produto não esconde o bloqueio: mostra exactamente o que falta para vender directo — configurar pagamentos."

## 4) Diferenciação (10:00–12:00)
Usar uma frase por concorrente (sem atacar demais):
- GloriaFood/UpMenu: "Bom para pedidos, mas a operação fica à parte — não é POS-first."
- Wix: "Bom para site, mas não fecha pedido→cozinha/pagamento de forma operacional."
- Marketplace: "Traz tráfego, mas cobra comissão e o cliente/dados ficam fora da casa."

Fechar com:
- "ChefIApp = operação + web + pagamento do restaurante, com planos/gates para evoluir."

## 5.5) 3 frases prontas (WhatsApp / call) — “mata-GloriaFood”
- "O ChefIApp não é um ‘formulário de pedidos’: o pedido entra na operação como pedido real (POS-first)."
- "Sem marketplace e sem comissão: pagamentos directos do restaurante, com dados do cliente na casa."
- "Se faltar algo (pagamentos/plano), o produto mostra no fluxo e transforma isso em upgrade — sem surpresas."

## 5) Pricing (12:00–14:00)
- BASIC: "Publica e recebe pedidos diretos."
- PRO: "Vende direto com cara de marca."
- EXPERIENCE: "Experiência premium para crescer."

**Regra de ouro:** não discutir número aqui se não for necessário — discutir *resultado*.

## 6) Próximo passo (14:00–15:00)
Escolher 1 CTA:
- "Queremos colocar isso rodando em 1 unidade esta semana." (piloto)
- "Querem ver com o vosso menu real?" (import/menu)
- "Vamos alinhar o plano (BASIC/PRO/EXPERIENCE) conforme objetivo." (upgrade)

## Objeções rápidas (respostas curtas)
- "Já tenho POS." → "Podem começar só com web + pedidos; o valor é fechar pedido→operação sem fricção e reduzir erros em horas de ponta."
- "Preciso de site bonito." → "BASIC/PRO resolvem presença; EXPERIENCE é a camada premium para marca e crescimento."
- "Não quero comissão." → "Aqui é pagamento directo do restaurante; o cliente e os dados ficam convosco."
