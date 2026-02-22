# 🇧🇷 Plano de Ativação Pix — ChefIApp Brasil

**Data**: 21 de Fevereiro de 2026
**Status**: ✅ **Fase 2 COMPLETA** | Fase 3 Pendente
**Prioridade**: 🔴 CRÍTICA (diferencial Brasil)

---

## 📊 Estado Atual — ATUALIZADO

### ✅ Fase 1: Testes Unitários — **COMPLETA**

- ✅ 25/25 testes passando (1.532s)
- ✅ Checkout creation validado
- ✅ Webhook parsing validado
- ✅ Idempotency validado
- ✅ Amount normalization validado
- ✅ Status transitions validados
- **Documentação**: [PHASE1_PIX_TESTING_COMPLETE.md](./PHASE1_PIX_TESTING_COMPLETE.md)

### ✅ Fase 2: UI Integration — **COMPLETA**

- ✅ PaymentBroker extended (createPixCheckout, getPixCheckoutStatus)
- ✅ PaymentModal Pix UI implementado
- ✅ QR Code display (280px × 280px)
- ✅ Countdown timer (10 minutos)
- ✅ Status polling (2-second intervals)
- ✅ Build successful (5.40s, zero errors)
- **Documentação**: [PIX_UI_INTEGRATION_COMPLETE.md](./PIX_UI_INTEGRATION_COMPLETE.md)

### ⏳ Fase 3: E2E Testing — **BLOQUEADA**

- ⏳ Aguardando credenciais SumUp sandbox
- ⏳ Merchant code brasileiro (sandbox)
- ⏳ API keys sandbox

---

## ✅ Implementação Completa

```typescript
// integration-gateway/src/services/sumup-checkout.ts
export async function createSumUpPixCheckout(
  input,
): Promise<SumUpCheckoutResponse> {
  return createSumUpCheckout({
    ...input,
    paymentType: "pix",
    country: "BR",
    currency: "BRL",
  });
}
```

### ✅ Webhook Handler

```typescript
// integration-gateway/src/index.ts
app.post("/api/v1/webhook/sumup", async (req, res) => {
  // HMAC-SHA256 verification
  // Event processing (payment_id, merchant_code, amount, status)
  // RPC persistence
});
```

### ✅ Frontend UI (NOVO — Fase 2)

```typescript
// merchant-portal/src/pages/TPV/components/PaymentModal.tsx
{method === "pix" && (
  <div style={styles.pixQrContainer}>
    <div style={styles.pixQrHeader}>
      <span>Escaneie o QR Code com seu app bancário</span>
      <div style={styles.pixTimer}>
        <span>{MM:SS}</span>
        <span>restantes</span>
      </div>
    </div>
    <div style={styles.pixQrBox}>
      <img src={pixQrCodeUrl} alt="QR Code Pix" />
    </div>
  </div>
)}
```

### ✅ Configuração .env

```dotenv
SUMUP_PIX_DEFAULT_COUNTRY=BR
SUMUP_PIX_DEFAULT_CURRENCY=BRL
```

---

## ✅ Fase 1: Testes Unitários — **COMPLETA**

### Resultados

```
PASS src/services/sumup-payment.test.ts
PASS src/services/sumup-checkout.test.ts

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Time:        1.532 s
```

### Cobertura

- ✅ Decimal normalization (99.999 → 100.00)
- ✅ Pix format enforcement (country=BR, paymentType=pix, currency=BRL)
- ✅ Amount limits (MIN 0.01 BRL, MAX 999,999.99 BRL)
- ✅ QR Code response handling
- ✅ Lifecycle (PENDING → COMPLETED)
- ✅ Webhook idempotency (duplicate event_id)
- ✅ Missing orderId graceful handling
- ✅ Status transitions (PENDING → SUCCESSFUL → PAID → COMPLETED)
- ✅ Error scenarios (network, auth, validation)

**Documentação**: [PHASE1_PIX_TESTING_COMPLETE.md](./PHASE1_PIX_TESTING_COMPLETE.md)

---

## ✅ Fase 2: UI Integration — **COMPLETA**

### 1.1 Teste de Checkout Pix

**Arquivo**: `integration-gateway/src/services/sumup-checkout.test.ts`

```typescript
describe("SumUp Pix Checkout", () => {
  it("deve criar checkout com paymentType=pix e country=BR", async () => {
    const checkout = await createSumUpPixCheckout({
      amount: 9999, // 99.99 BRL
      checkoutReference: "ORDER-PIX-001",
      description: "Combo Moqueca - Restaurante Rio",
    });

    expect(checkout).toHaveProperty("id");
    expect(checkout.status).toBe("PENDING");
    expect(checkout.amount).toBe(9999);
    expect(checkout.currency).toBe("BRL");
  });

  it("deve normalizar valores decimais", () => {
    const normalized = normalizeCheckoutAmount(99.999);
    expect(normalized).toBe(99.99);
    const normalized2 = normalizeCheckoutAmount(50);
    expect(normalized2).toBe(50.0);
  });

  it("deve respeitar limites SumUp", async () => {
    // SumUp Pix: MIN 0.01 BRL, MAX 999,999.99 BRL
    const tooSmall = await createSumUpPixCheckout({
      amount: 0.001,
      checkoutReference: "ORDER-MIN",
    }).catch((e) => e.message);
    expect(tooSmall).toContain("amount");

    const tooBig = await createSumUpPixCheckout({
      amount: 1000000,
      checkoutReference: "ORDER-MAX",
    }).catch((e) => e.message);
    expect(tooBig).toContain("amount");
  });
});
```

**Comando**:

```bash
cd integration-gateway
npm test -- sumup-checkout.test.ts
```

## ✅ Fase 2: UI Integration — **COMPLETA**

### Entregáveis (2 horas — Implementado em 21/02/2026)

1. **PaymentBroker Extension**

   - ✅ `createPixCheckout()` method
   - ✅ `getPixCheckoutStatus()` method
   - ✅ TypeScript interfaces (PixCheckoutResult, PixCheckoutStatusResult)
   - **Arquivo**: `merchant-portal/src/core/payment/PaymentBroker.ts` (+70 linhas)

2. **PaymentModal UI**

   - ✅ Pix payment method option (⚡ icon)
   - ✅ QR Code display (280px × 280px, white background)
   - ✅ Countdown timer (10:00 → 0:00, MM:SS format)
   - ✅ Status polling (2-second intervals)
   - ✅ 6 UI states: idle → creating → qr-ready → polling → completed → expired
   - ✅ Error handling (network, timeout, payment failure)
   - ✅ Regenerate QR Code on expiry
   - **Arquivo**: `merchant-portal/src/pages/TPV/components/PaymentModal.tsx` (+150 linhas)

3. **Build & Compilation**
   - ✅ TypeScript: Zero errors
   - ✅ Vite build: Success (5.40s)
   - ✅ Bundle size: ~200KB incremental increase
   - ✅ Linting: Consistent with existing code style

### Resultados

```
✓ built in 5.40s

PWA v1.2.0
mode      generateSW
precache  76 entries (11307.84 KiB)
```

### Fluxo de Pagamento Pix

```
User selects "PIX" → Click "Confirmar"
         ↓
PaymentBroker.createPixCheckout()
         ↓
Integration Gateway: POST /api/v1/payment/pix/checkout
         ↓
SumUp API: Create checkout (paymentType=pix, country=BR)
         ↓
Return: {checkout_id, qr_code_url, status}
         ↓
Display QR Code + Start Timer (10:00) + Start Polling
         ↓
Poll Status (every 2s): GET /api/v1/payment/sumup/checkout/:id
         ↓
Status = "PAID" → Call onPay() → Complete Order
```

### Screenshots (UI States)

1. **Idle**: "Clique em Confirmar para gerar QR Code Pix" ⚡
2. **Creating**: "Gerando QR Code Pix..." ⏳ (spinner)
3. **QR Ready**: Shows QR Code + Timer (9:59) + "Aguardando confirmação..."
4. **Completed**: "Pagamento Pix confirmado!" ✅ (green)
5. **Expired**: "QR Code expirado. Clique em Confirmar para gerar novo código." ⏱️ (red)

**Documentação Completa**: [PIX_UI_INTEGRATION_COMPLETE.md](./PIX_UI_INTEGRATION_COMPLETE.md)

---

## ⏳ Fase 3: Testes E2E (PRÓXIMO — Aguardando SumUp Sandbox)

### 2.1 Criar QR Code Pix

**Teste Manual**:

```bash
# 1. Start integration-gateway
cd integration-gateway
npm run dev
# → Escuta em http://localhost:4320

# 2. Criar checkout Pix
curl -X POST http://localhost:4320/api/v1/checkout/pix \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer chefiapp-internal-token-dev' \
  -d '{
    "amount": 99.99,
    "checkoutReference": "ORDER-E2E-001",
    "description": "Prato Vegano - ChefIApp"
  }'

# Resposta esperada:
# {
#   "id": "checkout_pix_xxx",
#   "status": "PENDING",
#   "pix_qr": "00020126360076142851...",  ← QR Code
#   "pix_qr_url": "https://api.sumup.com/v0.1/checkouts/checkout_pix_xxx/qr",
#   "amount": 9999,
#   "currency": "BRL"
# }
```

### 2.2 Simular Pagamento Pix no Sandbox

**Via SumUp Merchant Simulator**:

1. Aceder: https://sandbox-merchants.sumup.com/
2. Login com credenciais sandbox
3. Selecionar merchant brasileira
4. Simular pagamento de `ORDER-E2E-001` com valor `99.99`
5. Verificar webhook recebido em `http://localhost:4320/api/v1/webhook/sumup`

**Payload esperado**:

```json
{
  "merchant_code": "MERCHANTS_SANDBOX_BR",
  "checkout": {
    "id": "checkout_pix_xxx",
    "status": "COMPLETED",
    "amount": 9999,
    "currency": "BRL",
    "merchant_code": "MERCHANTS_SANDBOX_BR"
  },
  "event": {
    "id": "evt_pix_e2e_001",
    "timestamp": 1709427600000
  }
}
```

### 2.3 Verificar Webhook Persistence

**Query de verificação**:

```sql
-- Core database
SELECT * FROM webhook_events
WHERE provider = 'sumup'
  AND event_id = 'evt_pix_e2e_001'
ORDER BY created_at DESC
LIMIT 1;

-- Esperado:
-- id | event_id | provider | event_type | payload | created_at
```

---

## 🎯 Fase 3: Integração com Payment Modal (Merchant Portal)

### 3.1 Adicionar Pix ao PaymentModal

**Arquivo**: `merchant-portal/src/pages/TPV/components/PaymentModal.tsx`

```typescript
type PaymentMethodId = "cash" | "card" | "mbway" | "pix";

const METHODS: MethodOption[] = [
  {
    id: "cash",
    label: "Dinheiro",
    icon: "💶",
    description: "Pagamento em especie",
  },
  {
    id: "card",
    label: "Cartão",
    icon: "💳",
    description: "Terminal SumUp",
  },
  {
    id: "pix",
    label: "Pix",
    icon: "📱",
    description: "QR Code instantâneo",
    countryRestrictions: ["BR"], // ← Apenas Brasil
  },
];
```

### 3.2 UI do Pix QR Code

```typescript
{
  method === "pix" && (
    <div style={styles.section}>
      {!pixCheckoutId ? (
        <button onClick={handleInitiatePix} style={styles.pixButton}>
          Levantar QR Code Pix
        </button>
      ) : (
        <div style={styles.pixQRContainer}>
          <img
            src={pixQRImage}
            alt="QR Code Pix"
            style={{ width: 200, height: 200 }}
          />
          <p style={styles.pixValue}>{formatAmount(totalAmount)} BRL</p>
          <p style={styles.pixInstruction}>
            Escanear com qualquer app bancário
          </p>
          <CountdownTimer
            endTime={pixExpireTime} // 10 minutos
            onExpire={handlePixExpired}
          />
        </div>
      )}
    </div>
  );
}
```

### 3.3 Fluxo de Iniciação Pix

```typescript
async function handleInitiatePix() {
  setPixLoading(true);
  try {
    const checkout = await PaymentBroker.createPixCheckout({
      orderId: order.id,
      restaurantId: restaurant.id,
      totalAmount,
    });

    setPixCheckoutId(checkout.id);
    setPixQRImage(checkout.pix_qr_image);
    setPixExpireTime(Date.now() + 10 * 60 * 1000);

    // Polling para confirmar pagamento
    pollPixStatus(checkout.id);
  } catch (error) {
    showError("Erro ao gerar QR Pix: " + error.message);
  } finally {
    setPixLoading(false);
  }
}

function pollPixStatus(checkoutId: string) {
  const poll = setInterval(async () => {
    const status = await PaymentBroker.getPixCheckoutStatus(checkoutId);

    if (status === "COMPLETED") {
      clearInterval(poll);
      handlePaymentSuccess({
        method: "pix",
        checkoutId,
      });
    } else if (status === "EXPIRED") {
      clearInterval(poll);
      handlePixExpired();
    }
  }, 2000); // Poll a cada 2 segundos

  setTimeout(() => clearInterval(poll), 10 * 60 * 1000); // Timeout após 10 min
}
```

---

## 🎯 Fase 4: Compliance & Documentação

### 4.1 Validação de Dados Pix

```typescript
// utils/pixValidator.ts
export function validatePixPhone(phone: string): boolean {
  // Formato brasileiro: +55 (11) 98765-4321
  return /^\+55\s?\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(phone);
}

export function validatePixCPF(cpf: string): boolean {
  // Validar CPF com algoritmo oficial
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  // TODO: Implementar algoritmo de check digit
  return true;
}

export function validatePixKey(
  key: string,
  keyType: "email" | "phone" | "cpf" | "random",
): boolean {
  switch (keyType) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
    case "phone":
      return validatePixPhone(key);
    case "cpf":
      return validatePixCPF(key);
    case "random":
      return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(
        key,
      );
    default:
      return false;
  }
}
```

### 4.2 Logging & Auditoria

```typescript
// services/PixAuditLog.ts
export class PixAuditLog {
  static async logCreation(checkout: SumUpCheckoutResponse, orderId: string) {
    await db.pix_audit_log.insert({
      event: "PIX_CHECKOUT_CREATED",
      checkout_id: checkout.id,
      order_id: orderId,
      amount: checkout.amount,
      currency: checkout.currency,
      timestamp: new Date(),
    });
  }

  static async logPayment(event: EventData) {
    await db.pix_audit_log.insert({
      event: "PIX_PAYMENT_RECEIVED",
      checkout_id: event.checkout.id,
      status: event.checkout.status,
      timestamp: new Date(),
    });
  }

  static async logExpiry(checkoutId: string) {
    await db.pix_audit_log.insert({
      event: "PIX_CHECKOUT_EXPIRED",
      checkout_id: checkoutId,
      timestamp: new Date(),
    });
  }
}
```

---

## 📋 Checklist de Ativação

### HOJE (Fase 1)

- [ ] Executar testes unitários Pix
  ```bash
  npm test -- sumup-checkout.test.ts
  ```
- [ ] Verificar normalização de valores decimais
- [ ] Validar limites (MIN/MAX)

### AMANHÃ (Fase 2)

- [ ] Contactar SumUp para sandbox credentials
- [ ] Criar checkout Pix via API
- [ ] Gerar QR Code
- [ ] Simular pagamento no sandbox
- [ ] Validar webhook recebido
- [ ] Verificar idempotência (duplicate event_id)

### PRÓXIMA SEMANA (Fase 3)

- [ ] Integrar Pix no PaymentModal UI
- [ ] Implementar polling de status
- [ ] Testar countdown de expiração (10 min)
- [ ] Adicionar tratamento de erros

### ANTES DE PROD (Fase 4)

- [ ] Documentação de onboarding
- [ ] Testes de compliance
- [ ] Auditoria de transações
- [ ] SLA de suporte
- [ ] Treino do team

---

## 🔐 Segurança

### Validações Obrigatórias

1. ✅ HMAC-SHA256 signature verification (webhook)
2. ✅ Timeout idempotency (event_id deduplication)
3. ⏳ Rate limiting (max 100 requests/min por merchant)
4. ⏳ Input sanitization (amount, checkoutReference)

### Exemplo Rate Limiter

```typescript
import rateLimit from "express-rate-limit";

const pixLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: "Muitos checkouts Pix. Tente novamente depois.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/v1/checkout/pix", pixLimiter, async (req, res) => {
  // ...
});
```

---

## 📞 Contacto SumUp

**Informações necessárias**:

1. Merchant Code brasileiro (confirmação)
2. Sandbox API credentials (se não temos)
3. Verificar suporte Pix ativo
4. Limites de transação (MIN/MAX)
5. TTL padrão de QR Code (confirmação: 10 min)

**Email**: support@sumup.com
**Contacto Principal**: [TBD — verificar com goldmonkey]

---

## 🎯 KPIs de Sucesso

| Métrica                    | Target               | Status |
| -------------------------- | -------------------- | ------ |
| Checkout Pix response time | < 500ms              | ⏳     |
| QR Code geração            | 100% success         | ⏳     |
| Webhook latency            | < 2s                 | ⏳     |
| Idempotency rate           | 100% (no duplicates) | ⏳     |
| Payment confirmation       | < 5s após scan       | ⏳     |

---

**Próximo**: Executar Fase 1 (testes unitários) — ~2 horas
**Depois**: Contactar SumUp para Fase 2 (sandbox) — ~4 horas
**Total Estimado**: 3-5 dias até produção com confiança

---

**Documento preparado para execução imediata.**
