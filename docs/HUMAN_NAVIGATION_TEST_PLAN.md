# PLANO DE TESTE DE NAVEGAÇÃO HUMANA (HITL)

**Objetivo:** Simular operação real do ChefIApp (Jan 2026) para detectar fricções operacionais.
**Ambiente:** Virtual (Análise Estática + Simulação de Fluxo de Dados)

## 1️⃣ CLIENTE (Webpage / Mesa)

- [ ] **Fluxo:** QR Code -> Cardápio -> Carrinho -> Pedido.
- [ ] **Pontos de Atenção:**
  - O que acontece se a internet cair *durante* o envio?
  - O feedback visual ("Pedido Enviado") é imediato ou depende do Server?
  - Se eu pedir 2x sem querer, o sistema bloqueia?

## 2️⃣ GARÇOM (Mobile)

- [ ] **Fluxo:** Notificação -> Aceite -> Entrega.
- [ ] **Pontos de Atenção:**
  - O pedido da Web aparece "magicamente" ou precisa de refresh?
  - O botão de "Entregar" é fácil de bater sem querer?
  - Como ele sabe qual *prato* é para qual *assento* (se existir)?

## 3️⃣ COZINHA (KDS)

- [ ] **Fluxo:** Novo Pedido (Som) -> Preparo -> Pronto.
- [ ] **Pontos de Atenção:**
  - O som toca se o iPad estiver dormindo? (Análise de código nativo/limitations).
  - Se a impressora falhar, o KDS avisa?
  - "Pedido Pronto" some da tela ou fica em "Histórico"?

## 4️⃣ SISTEMA DE TAREFAS (AppStaff 2.0)

- [ ] **Fluxo:** Trigger (Pedido/Tempo) -> Tarefa Gerada -> Conclusão.
- [ ] **Pontos de Atenção:**
  - Se 10 mesas pedirem água, gera 10 tarefas de "Levar Água" ou 1 agrupada?
  - O "Game" atrapalha a operação (muitos popups)?

## 5️⃣ CAIXA / PAGAMENTO

- [ ] **Fluxo:** Selecionar Mesa -> Parcial/Total -> Pagamento -> Recibo.
- [ ] **Pontos de Atenção:**
  - Consigo fechar uma mesa que tem pedidos " Em Preparo"?
  - O sistema avisa se o pagamento falhou no meio (ex: cartão recusado)?

## 6️⃣ ERROS FORÇADOS

- [ ] **Cenários:**
  - Fechar app no meio do pedido.
  - Trocar de Wi-Fi para 4G no meio.
  - Cozinheiro marca "Pronto" sem querer.

---

**Saída Esperada:**

- Artifact: `HUMAN_NAVIGATION_REPORT.md` contendo Erros, Fricções e Notas.
