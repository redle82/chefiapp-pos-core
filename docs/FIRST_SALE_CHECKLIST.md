# 🚀 Protocolo: Primeira Venda Real (First Sale Checklist)

**Objetivo:** Transacionar dinheiro real (Fiat) via Public Page e processá-lo no TPV.
**Estado Atual:** v1.0.1 (Reality Seal).
**Tempo Estimado:** 30 minutos.

---

## 🛑 1. Pré-Requisitos (Legal & Bancário)
- [ ] **Conta Stripe Ativa**: KYC preenchido e conta verificada.
- [ ] **Chaves de Produção**: Acesso ao Dashboard do Stripe (Developer > API Keys).
- [ ] **Produto Real**: Pelo menos 1 item no menu com preço > 0.50€.

---

## 🔐 2. Configuração de Segredos (The Key Ceremony)

No servidor de produção (ou `.env.production.local`):

```bash
# Gateway (Substituir 'sk_test_...' por 'sk_live_...')
MERCHANT_STRIPE_KEY=sk_live_...

# Webhooks (Necessário para confirmar pagamento assincronamente)
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend (Public Page)
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

> ⚠️ **Atenção**: Uma vez salvas, o sistema está "ARMADO". Qualquer `POST /orders` tentará capturar fundos reais.

---

## 🎯 3. Definição do Piloto

Escolha o restaurante que receberá a venda.
- **Slug**: `sofia-gastrobar` (exemplo).
- **ID**: `9876b452-04fd-4868-9999-53792428f032`.

**Verificação Pré-Voo**:
1. Acesse `https://chefiapp.com/public/sofia-gastrobar`.
2. Verifique se o menu carrega.
3. Adicione "Café" (1.00€) ao carrinho.

---

## 🧪 4. O Teste de "Um Euro" (The One Euro Test)

Siga este roteiro estrito para a primeira transação:

1.  **Cliente (Você)**:
    -   Preencha checkout com cartão de crédito REAL.
    -   Clique "Pagar".
2.  **Stripe (Banco)**:
    -   Verifique no App do Banco se houve cobrança.
3.  **TPV (Operação)**:
    -   Observe o alerta sonoro: *"Atenção! Novo pedido web."*
    -   Verifique a tarja vermelha em `AppStaff`.
4.  **Core (Verdade)**:
    -   Confirme que não houve erro 500.

---

## 🚨 5. Kill Switch (Procedimento de Aborto)

Se algo der errado (ex: cobrança duplicada, loop de tarefas):

1.  **Desarmar Gateway**:
    -   Remova `MERCHANT_STRIPE_KEY` do ambiente.
    -   Restart do serviço.
    -   O sistema reverterá automaticamente para `Mock Gateway` (seguro).

2.  **Refund**:
    -   Faça o estorno via Dashbord do Stripe imediatamente.

---

*“A primeira venda é a única que importa. O resto é escala.”*
