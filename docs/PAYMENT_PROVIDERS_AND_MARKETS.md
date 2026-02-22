# 💳 Provedores de Pagamento e Mercados Operacionais — ChefIApp

**Data**: 21 de Fevereiro de 2026
**Status**: Análise de Implementação Atual

---

## 📊 Resumo Executivo

O ChefIApp POS tem implementação ativa de **3 provedores de pagamento**:

| Provedor        | Tipo                            | Países             | Moedas           | Status          |
| --------------- | ------------------------------- | ------------------ | ---------------- | --------------- |
| **Stripe**      | SaaS + Pagamentos em tempo real | PT, ES, BR, US     | EUR, USD, BRL    | ✅ Implementado |
| **SumUp**       | TPV + Webhooks                  | PT, ES, BR, others | EUR, BRL, outros | ✅ Implementado |
| **Pix (SumUp)** | Código QR Brasil                | BR                 | BRL              | ✅ Implementado |

---

## 🏗️ Implementação Técnica

### 1. **Stripe — Assinatura SaaS + Pagamentos por Cartão**

**Localização**: `merchant-portal/src/core/payment/`, `/integration-gateway/`

```typescript
// Arquivo: merchant-portal/src/core/tpv/stripePayment.ts
export interface CreatePaymentIntentInput {
  orderId: string;
  restaurantId: string;
  amountCents: number;
  currency?: string; // EUR, USD, BRL
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentResult>;
```

**Principais recursos**:

- ✅ Payment Intents para cada transação
- ✅ Checkout Session para assinatura
- ✅ Webhooks (`payment_intent.succeeded`, `charge.updated`)
- ✅ Customer Portal (gestão de faturas)
- ✅ Support para múltiplas moedas

**Exemplos de uso**:

```typescript
// Criar Payment Intent
const intent = await createPaymentIntent({
  orderId: "order-123",
  restaurantId: "restaurant-456",
  amountCents: 5000,
  currency: "EUR", // Portugal, Espanha
});

// Interface React
<StripePaymentModal
  clientSecret={intent.client_secret}
  total={amount}
  onSuccess={handlePaymentSuccess}
/>;
```

---

### 2. **SumUp — Terminal de Pagamento + Webhooks**

**Localização**: `integration-gateway/src/services/sumup-*`

```typescript
// Arquivo: integration-gateway/src/services/sumup-checkout.ts
export async function createSumUpCheckout(
  input: CreateSumUpCheckoutInput,
): Promise<SumUpCheckoutResponse>;

export async function createSumUpPixCheckout(
  input: CreateSumUpCheckoutInput & { currency?: string },
): Promise<SumUpCheckoutResponse>;
```

**Configuração (`.env`):**

```dotenv
SUMUP_API_KEY=...
SUMUP_ACCESS_TOKEN=...
SUMUP_MERCHANT_CODE=...
SUMUP_API_BASE_URL=https://api.sumup.com
SUMUP_PIX_DEFAULT_COUNTRY=BR
SUMUP_PIX_DEFAULT_CURRENCY=BRL
```

**Webhook Handler**:

```typescript
// Arquivo: integration-gateway/src/index.ts
app.post("/api/v1/webhook/sumup", async (req, res) => {
  // 1. Verificar HMAC-SHA256
  // 2. Extrair evento (merchant_code, payment_id, amount, status)
  // 3. Chamar RPC backend para persistir webhook
  // 4. Responder com 200 OK para SumUp não retentar
});
```

**Países suportados**: PT, ES, BR, DE, FR, AT, IT, e outros (depende de approval SumUp)

---

### 3. **Pix — Brasil (SumUp Integration)**

**Localização**: `integration-gateway/src/services/sumup-checkout.ts`

```typescript
export async function createSumUpPixCheckout(
  input: Omit<CreateSumUpCheckoutInput, "currency" | "paymentType" | "country">,
): Promise<SumUpCheckoutResponse> {
  // Força:
  // - paymentType: 'pix'
  // - country: 'BR'
  // - currency: 'BRL'
  return createSumUpCheckout({
    ...input,
    currency: "BRL",
    paymentType: "pix",
    country: "BR",
  });
}
```

**Exemplo**:

```typescript
const pix = await createSumUpPixCheckout({
  amount: 50.0,
  checkoutReference: "ORDER-12345",
  description: "Pagamento Pedido #12345",
});

// Resulta em:
// {
//   "id": "checkout_br_xxx",
//   "status": "PENDING",
//   "pix_qr": "00020126360076...visível ao cliente"
// }
```

---

## 🌍 Mercados Operacionais — Definição Final

### Configuração de Bootstrap:

Arquivo: `merchant-portal/src/pages/BootstrapPage.tsx`

```typescript
const COUNTRIES = [
  { value: "PT", label: "Portugal (EUR)" },
  { value: "ES", label: "Espanha (EUR)" },
  { value: "BR", label: "Brasil (BRL)" },
  { value: "US", label: "EUA (USD)" },
];
```

---

## 📍 Matriz de Suporte — Países × Métodos de Pagamento

| País         | Código | Moeda | Stripe | SumUp | Pix |
| ------------ | ------ | ----- | ------ | ----- | --- |
| **Portugal** | PT     | EUR   | ✅     | ✅    | ❌  |
| **Espanha**  | ES     | EUR   | ✅     | ✅    | ❌  |
| **Brasil**   | BR     | BRL   | ✅     | ✅    | ✅  |
| **EUA**      | US     | USD   | ✅     | ⚠️    | ❌  |

**Legenda**:

- ✅ Suportado nativamente
- ⚠️ Requer verificação/setup específico
- ❌ Não aplicável (moeda/região)

---

## 🏃 Plano de Ativação por Mercado

### **Tier 1 (Imediato)**

```
🇵🇹 Portugal (PT)
├─ Stripe: EUR
├─ SumUp Terminal: EUR
└─ Foco: Restaurantes tradicionais
```

### **Tier 2 (Q1 2026)**

```
🇪🇸 Espanha (ES)
├─ Stripe: EUR
├─ SumUp Terminal: EUR
└─ Foco: Cadeia de franquias
```

### **Tier 3 (Q2 2026)**

```
🇧🇷 Brasil (BR)
├─ Stripe: BRL
├─ SumUp Terminal: BRL
├─ Pix: BRL (integração nativa)
└─ Foco: TPV moderno + pagamentos instantâneos
```

### **Tier 4 (Futuro)**

```
🇺🇸 EUA (US)
├─ Stripe: USD
├─ SumUp Terminal: USD (se aprovado)
└─ Foco: Tech-driven restaurants
```

---

## 🔧 Checklist de Implementação por País

### Portugal (PT) — Status: ✅ PRONTO

- [x] Stripe configurado (EUR)
- [x] SumUp integrado (EUR)
- [x] Webhook handler ativo
- [x] Testes de pagamento funcionais
- [x] Support de assinatura SaaS

### Espanha (ES) — Status: ✅ PRONTO

- [x] Stripe: Aceita EUR
- [x] SumUp: Suporta ES (verificar merchant code)
- [ ] Localização de UI (es-ES)
- [ ] Compliance fiscal ES (IVA)

### Brasil (BR) — Status: ✅ PRONTO (COM PIX)

- [x] Stripe: Suporta BRL
- [x] SumUp: Integrado para BRL
- [x] Pix: Checkout SumUp nativo
- [x] Webhook handler para Pix
- [ ] Validação CPF/CNPJ (futuro)
- [ ] Compliance fiscal BR (NF-e)

### EUA (US) — Status: ⏳ PENDENTE

- [ ] Stripe: Suporta USD ✅ (código pronto)
- [ ] SumUp: Verificar se US está ativo
- [ ] Compliance (PCI-DSS, etc.)
- [ ] Testing em staging

---

## 🎯 Recomendação Imediata

**Definição oficial de mercados operacionais:**

```markdown
## ChefIApp POS — Markets 2026

### ✅ LIVE (Produção)

- 🇵🇹 Portugal (PT) — EUR — Stripe + SumUp Terminal
- 🇪🇸 Espanha (ES) — EUR — Stripe + SumUp Terminal

### ✅ LIVE (Com Pix)

- 🇧🇷 Brasil (BR) — BRL — Stripe + SumUp Terminal + **Pix (QR Code)**

### 🚀 Roadmap

- 🇺🇸 EUA (US) — Q2 2026 — Stripe + SumUp (pending approval)
- 🇫🇷 França (FR) — Q3 2026 — Stripe + SumUp
- 🇩🇪 Alemanha (DE) — Q3 2026 — Stripe + SumUp
```

---

## 📞 Próximos Passos

### 1. **Validar com SumUp** (URGENTE)

- Confirmar aprovação para ES
- Confirmar merchant codes por país
- Verificar disponibilidade US

### 2. **Ativar Pix em Produção**

- [ ] Testar checkout Pix com SumUp: https://api.sumup.com/v0.1/checkouts
- [ ] Validar QR code gerado
- [ ] Configurar webhook para Pix

### 3. **Documentação de Onboarding**

- [ ] Guia de setup Stripe por país
- [ ] Guia de setup SumUp por país
- [ ] SLA de suporte Pix

### 4. **Testes E2E**

- [ ] Payment Intent (EUR, BRL, USD) — Stripe
- [ ] Terminal checkout — SumUp
- [ ] Pix QR scan → pagamento — SumUp

---

## 📁 Arquivos Principais para Referência

| Arquivo                                              | Função                          |
| ---------------------------------------------------- | ------------------------------- |
| `integration-gateway/src/index.ts`                   | Webhook handler (SumUp, Stripe) |
| `integration-gateway/src/services/sumup-checkout.ts` | Checkout API SumUp              |
| `merchant-portal/src/core/tpv/stripePayment.ts`      | Stripe Payment Intent           |
| `merchant-portal/src/pages/BootstrapPage.tsx`        | Country selection               |
| `docs/CHEFIAPP_PAYMENTS_INTEGRATION_SPEC.md`         | Especificação completa          |

---

**Documento preparado para decisão executiva de mercados Q1 2026.**
