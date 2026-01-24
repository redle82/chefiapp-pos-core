# 🚀 Soft Launch Plan: Operation "First Blood" (48 Hours)

**Objetivo:** Realizar a primeira venda pública com risco controlado.
**Versão:** v1.0.1 (System Ready).
**Data Alvo:** T+48h.

---

## 📅 Dia 0: Preparação de Terreno (The Setup)
**Foco:** Infraestrutura e Verdade Financeira.

1.  **Stripe Production (1h)**
    -   [ ] Inserir chaves de produção (`sk_live_...`) no servidor.
    -   [ ] Configurar Webhook Endpoint no Dashboard Stripe.
    -   [ ] Realizar uma transação de teste (1.00€) usando o próprio cartão do fundador.
    -   [ ] **Go/No-Go**: Se o dinheiro cair na conta Stripe, prossiga.

2.  **Cardápio Mínimo Viável (30m)**
    -   [ ] Definir 3-5 itens "Campeões" (ex: Café, Prato do Dia, Bebida).
    -   [ ] Garantir fotos reais e descrições curtas.
    -   [ ] Ocultar itens complexos ou sem foto.

3.  **AppStaff Drill (30m)**
    -   [ ] Treinar 1 pessoa da equipe (ou você mesmo) para ficar com o AppStaff aberto.
    -   [ ] Testar o volume do alerta sonoro no tablet/celular.
    -   [ ] Regra de Ouro: "Se tocar, olha a tela."

---

## 📅 Dia 1: O Teste Interno (The Euro Test)
**Foco:** Validação em Silêncio.

1.  **Simulação de Cliente (manhã)**
    -   Peça a um amigo confiável (que não seja dev) para fazer um pedido no `chefiapp.com/public/seu-restaurante`.
    -   **Não ajude**. Observe onde ele trava.
    -   Se ele pagar e o TPV tocar → **SUCESSO**.

2.  **Operação TPV (tarde)**
    -   Use o TPV para imprimir/gerir esse pedido.
    -   Verifique se o fluxo "Cozinha -> Entrega" fluiu sem erro 500.

3.  **Kill Switch Check**
    -   Tenha o script de refund ou acesso ao Dashboard Stripe à mão.

---

## 📅 Dia 2: Soft Launch (Friends & Family)
**Foco:** Primeira Venda Pública Controlada.

1.  **Divulgação Limitada (12h)**
    -   Envie o link para um grupo de WhatsApp fechado (5-10 pessoas).
    -   Ofereça um incentivo (ex: "Testem o novo sistema").

2.  **Monitoring Station**
    -   Mantenha o `AppStaff` aberto.
    -   Mantenha o Dashboard Stripe aberto.
    -   Mantenha os Logs do Servidor abertos (se possível).

3.  **Feedback Loop**
    -   Anote cada falha, cada "não entendi", cada bug visual.
    -   **Não corrija código agora**. Apenas opere.

---

## 🏁 Critérios de Vitória

O Soft Launch é considerado um SUCESSO se:
1.  **3 Pedidos Reais** forem pagos e processados.
2.  Nenhum erro crítico (500) interromper o fluxo.
3.  O dinheiro chegar na conta Stripe.

*"Better a diamond with a flaw than a pebble without."*
