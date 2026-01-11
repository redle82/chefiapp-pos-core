# SEPARAÇÃO DE RESPONSABILIDADES FINANCEIRAS
## ChefIApp POS — Financial Responsibility & Payment Separation

**Versão:** 1.0  
**Data:** 23 de Dezembro de 2025  
**Classificação:** Documento Legal

---

## 1. DECLARAÇÃO DE PROPÓSITO

Este documento estabelece formalmente a separação de responsabilidades financeiras entre:

1. **ChefIApp Lda** ("Nós", "A Plataforma")
2. **Estabelecimentos Clientes** ("Merchants", "Restaurantes", "Hotéis")
3. **Clientes Finais** ("Consumidores")

---

## 2. MODELO DE NEGÓCIO

### 2.1 O que ChefIApp É

ChefIApp é uma **plataforma SaaS de software** que fornece:
- Sistema de ponto de venda (POS)
- Gestão de mesas e pedidos
- Integração com gateways de pagamento
- Emissão de documentos fiscais

### 2.2 O que ChefIApp NÃO É

ChefIApp **NÃO é**:
- ❌ Processador de pagamentos (PSP)
- ❌ Instituição financeira
- ❌ Agente fiduciário
- ❌ Custodiante de fundos de terceiros

---

## 3. FLUXOS FINANCEIROS

### 3.1 Fluxo de Assinatura (ChefIApp → Merchant)

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE ASSINATURA                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Merchant]  ────€29-149/mês────>  [ChefIApp]             │
│                                         │                   │
│                                         ▼                   │
│                                   [Stripe ChefIApp]         │
│                                                             │
│   Responsável: ChefIApp                                     │
│   Conta Stripe: ChefIApp Lda                               │
│   Faturação: ChefIApp emite fatura ao Merchant             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Eventos cobertos:**
- Subscrição mensal do plano
- Add-ons (reservas, analytics, multi-venue)
- Terminais adicionais

### 3.2 Fluxo de Pagamento (Cliente Final → Merchant)

```
┌─────────────────────────────────────────────────────────────┐
│                   FLUXO DE PAGAMENTO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [Cliente Final]  ────€────>  [Merchant]                  │
│                                     │                       │
│                                     ▼                       │
│                              [Stripe/SumUp]                 │
│                              DO MERCHANT                    │
│                                                             │
│   Responsável: Merchant                                     │
│   Conta Stripe: Merchant (conta própria)                   │
│   Faturação: Merchant emite fatura ao Cliente              │
│                                                             │
│   ⚠️  ChefIApp NÃO toca neste dinheiro                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Eventos cobrados pelo GATEWAY (não por ChefIApp):**
- Pagamentos de mesa
- Pagamentos web
- Pagamentos em terminal físico

---

## 4. TABELA DE RESPONSABILIDADES

| Responsabilidade | ChefIApp | Merchant | Gateway |
|------------------|----------|----------|---------|
| **Cobrança de assinatura** | ✅ | | |
| **Fatura de assinatura** | ✅ | | |
| **Suporte ao software** | ✅ | | |
| **Cobrança ao cliente final** | | ✅ | |
| **Fatura ao cliente final** | | ✅ | |
| **Chargebacks** | | ✅ | |
| **Disputas de pagamento** | | ✅ | ✅ |
| **Taxas de transação (MDR)** | | | ✅ |
| **PCI Compliance (dados cartão)** | | | ✅ |
| **KYC do merchant** | | | ✅ |

---

## 5. DECLARAÇÃO FORMAL

### 5.1 Separação de Fundos

> ChefIApp declara formalmente que **NUNCA** receberá, processará, ou custodiar fundos destinados a pagamentos de clientes finais aos estabelecimentos.

### 5.2 Responsabilidade de Chargebacks

> Todos os chargebacks, disputas, e reversões de pagamentos de clientes finais são de **responsabilidade exclusiva do Merchant**, conforme contrato com o respetivo gateway de pagamentos (Stripe, SumUp, ou outro).

### 5.3 Independência de Contas

> Cada Merchant mantém uma conta **própria e independente** junto ao gateway de pagamentos escolhido. ChefIApp não tem acesso a estas contas além do estritamente necessário para integração técnica via API.

---

## 6. ARQUITETURA TÉCNICA

### 6.1 Chaves de API

```
AMBIENTE ChefIApp:
├── STRIPE_SECRET_KEY      → Conta ChefIApp (assinaturas)
├── STRIPE_WEBHOOK_SECRET  → Webhooks de billing
└── Endpoint: /webhooks/billing

AMBIENTE Merchant:
├── MERCHANT_STRIPE_KEY    → Conta do Merchant
├── MERCHANT_WEBHOOK_KEY   → Webhooks de pagamentos
└── Endpoint: /webhooks/payments/:merchantId
```

### 6.2 Isolamento de Eventos

| Evento | Processado Por | Destino |
|--------|----------------|---------|
| `customer.subscription.created` | StripeBillingService | billing_events |
| `invoice.paid` | StripeBillingService | billing_events |
| `payment_intent.succeeded` | StripeGatewayAdapter | core_events |
| `charge.refunded` | StripeGatewayAdapter | core_events |

### 6.3 Metadata

Todos os eventos de billing incluem:
```json
{
  "merchant_id": "uuid",
  "business_type": "RESTAURANT|HOTEL|BAR|...",
  "plan": "starter|professional|enterprise",
  "source": "chefiapp_billing"
}
```

---

## 7. CONFORMIDADE LEGAL

### 7.1 Legislação Aplicável

- **RGPD (2016/679)** — Proteção de dados
- **PSD2 (2015/2366)** — Serviços de pagamento (NÃO aplicável a ChefIApp)
- **Lei 58/2020** — Facturação eletrónica (Portugal)
- **Código SAF-T** — Auditoria fiscal portuguesa

### 7.2 Isenção de PSD2

ChefIApp **não está sujeito** a regulamentação PSD2 porque:
1. Não processa pagamentos
2. Não custodiar fundos
3. Não emite moeda eletrónica
4. Atua exclusivamente como software intermediário

---

## 8. CONTACTOS

**Questões Legais:**  
legal@chefiapp.com

**Questões Técnicas:**  
tech@chefiapp.com

**Suporte ao Merchant:**  
support@chefiapp.com

---

## 9. VERSÕES

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0 | 23/12/2025 | Documento inicial |

---

## 10. ASSINATURAS

**ChefIApp Lda**

Nome: ___________________________

Cargo: ___________________________

Assinatura: ___________________________

Data: ___________________________

---

*Este documento constitui declaração formal de responsabilidades financeiras e pode ser apresentado a parceiros, advogados, auditores, e entidades reguladoras.*
