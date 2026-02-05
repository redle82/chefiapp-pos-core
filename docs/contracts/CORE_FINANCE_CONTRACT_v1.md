# ❤️ CORE FINANCE CONTRACT — v1

**(O Coração do ChefIApp OS)**

Tudo o que não passa pelo Core Finance não existe economicamente.

Pedido, menu, tarefa, integração, relatório, dono, auditor — todos obedecem a este contrato.

---

## Princípios fundamentais (leis financeiras)

1. Pedido ≠ Dinheiro
2. Dinheiro só nasce quando o Core valida
3. Nenhum preço é calculado fora do Core
4. Imposto é declarativo, não inferido
5. Nada fecha sem reconciliação
6. Tudo é auditável
7. Histórico nunca muda

---

## 1️⃣ ENTIDADE CENTRAL: FINANCIAL_ORDER

Um pedido só vira real quando é aceito pelo Core Finance.

### Campos canónicos

| Campo              | Descrição                                           |
| ------------------ | --------------------------------------------------- |
| financial_order_id | PK                                                  |
| order_id           | FK                                                  |
| store_id           | FK                                                  |
| currency           |                                                     |
| subtotal           |                                                     |
| tax_total          |                                                     |
| total              |                                                     |
| status             | PENDING \| AUTHORIZED \| PAID \| FAILED \| REFUNDED |
| created_at         |                                                     |

### Regras duras

- ❌ Pedido sem `financial_order` é operacional, não económico
- ❌ KDS não executa pedido sem estado financeiro válido
- ❌ Nada “entra no caixa” fora daqui

---

## 2️⃣ PRICE SNAPSHOT (ligação com Menu 👑)

No momento da criação do pedido:

**order_price_snapshot**

- product_name
- base_price
- modifiers
- tax_rate
- final_price

👉 O Core Finance **nunca recalcula** o menu. Confia no snapshot validado.

---

## 3️⃣ PAYMENT CONTRACT

### payments

| Campo              | Descrição                               |
| ------------------ | --------------------------------------- |
| payment_id         | PK                                      |
| financial_order_id | FK                                      |
| method             | CASH \| CARD \| ONLINE \| UBER \| API   |
| amount             |                                         |
| status             | PENDING \| AUTHORIZED \| PAID \| FAILED |
| provider_ref       |                                         |
| created_at         |                                         |

### Regras

- Um pedido pode ter vários pagamentos (split)
- O pedido só vira **PAID** quando: `soma(payments.PAID) == total`
- **AUTHORIZED ≠ PAID**
- **FAILED** não gera tarefas nem KDS

---

## 4️⃣ CASH REGISTER (caixa real)

### cash_registers

| Campo           | Descrição |
| --------------- | --------- |
| register_id     | PK        |
| store_id        | FK        |
| opened_at       |           |
| closed_at       |           |
| opening_balance |           |
| closing_balance |           |

### cash_movements

| Campo              | Descrição |
| ------------------ | --------- |
| movement_id        | PK        |
| register_id        | FK        |
| type               | IN \| OUT |
| amount             |           |
| reason             |           |
| related_payment_id | FK        |
| created_at         |           |

👉 Caixa é **estado contínuo**, não soma de pedidos.

---

## 5️⃣ INVOICING & TAX (governo manda)

### tax_profiles

| Campo          | Descrição |
| -------------- | --------- |
| tax_profile_id | PK        |
| country        |           |
| tax_type       |           |
| rate           |           |

### invoices

| Campo              | Descrição |
| ------------------ | --------- |
| invoice_id         | PK        |
| financial_order_id | FK        |
| invoice_number     |           |
| issued_at          |           |
| tax_breakdown      |           |
| total              |           |

### Regras

- Imposto calculado uma vez
- Invoice nunca muda
- Reembolso gera nota inversa, não edição

---

## 6️⃣ REFUNDS & FAILURES (o mundo real dói)

### refunds

| Campo      | Descrição |
| ---------- | --------- |
| refund_id  | PK        |
| payment_id | FK        |
| amount     |           |
| reason     |           |
| created_at |           |

### Regras

- Refund não apaga pagamento
- Refund não apaga pedido
- Refund gera evento financeiro

---

## 7️⃣ FINANCIAL EVENTS (memória imutável)

### financial_events

| Campo              | Descrição |
| ------------------ | --------- |
| event_id           | PK        |
| financial_order_id | FK        |
| type               |           |
| payload            |           |
| created_at         |           |

**Eventos:**

- `ORDER_PRICED`
- `PAYMENT_AUTHORIZED`
- `PAYMENT_CAPTURED`
- `PAYMENT_FAILED`
- `ORDER_PAID`
- `ORDER_REFUNDED`
- `INVOICE_ISSUED`

👉 Permite: auditoria, replay, simulação, contabilidade.

---

## 8️⃣ RELAÇÃO COM KDS E TASKS

**Regra soberana:** KDS só executa pedidos **PAID** (ou **AUTHORIZED** se política permitir).

**Tasks financeiras automáticas:**

- conferir caixa
- fechar turno
- divergência de caixa
- falha de pagamento

---

## 9️⃣ INTEGRAÇÕES (Uber, API, etc.)

Pedido externo:

1. Pedido chega
2. Menu validado
3. Financial Order criada
4. Pagamento externo validado
5. Pedido liberado para KDS

👉 **Integração nunca pula** o Core Finance.

---

## 🔥 O QUE É PROIBIDO (sem exceção)

- ❌ TPV fechar pedido fora do Core
- ❌ KDS decidir pagamento
- ❌ Preço digitado
- ❌ Imposto calculado fora do Core
- ❌ Editar invoice
- ❌ “Depois a gente ajusta”

---

## 🧪 TESTES CRÍTICOS QUE ESTE CONTRATO GARANTE

- Pedido sem pagamento não entra na cozinha
- Pagamento parcial não libera execução
- Erro de pagamento não gera tarefa errada
- Caixa sempre reconcilia
- Auditoria consegue explicar tudo

---

## Frase final (lei absoluta)

**O Core Finance é o coração.**
Se ele para, o restaurante para.
Se ele mente, o sistema morre.
