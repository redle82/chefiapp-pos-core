# Stripe em modo teste

**Objetivo:** Validar checkout e fluxo de billing sem cobranças reais. Usar sempre chaves e Price ID de **teste** (Dashboard em modo Test).

---

## 1. Chaves e Price (teste)

| Variável | Onde | Valor |
|----------|------|--------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | .env.local / Vercel (Preview) | `pk_test_...` (Stripe Dashboard → Developers → API keys → Test) |
| `VITE_STRIPE_PRICE_ID` | .env.local / Vercel (Preview) | `price_...` de um preço criado em **modo Test** (Products → preço €79/mês → copiar ID) |

Sem `VITE_STRIPE_PRICE_ID`, a página `/app/billing` mostra "Preço do plano não configurado" e desativa o botão.

---

## 2. Obter Price ID em modo teste

1. Stripe Dashboard → ativar **Test mode** (toggle no canto superior).
2. **Products** → criar produto (ex. "ChefIApp Mensal") ou usar existente.
3. Adicionar **Price** (ex. €79/mês recorrente) → guardar.
4. Copiar o ID do preço (`price_xxxxxxxxxxxxx`).
5. Colar em `VITE_STRIPE_PRICE_ID` no `.env.local` ou em Vercel → Environment Variables (ambiente **Preview**).

---

## 3. Cartão de teste

No checkout Stripe (modo teste), usar por exemplo:

- **Número:** `4242 4242 4242 4242`
- **Validade:** qualquer data futura
- **CVC:** qualquer 3 dígitos

Mais opções: [Stripe – Testing](https://docs.stripe.com/testing#cards).

---

## 4. Onde configurar

- **Local:** `merchant-portal/.env.local` (não fazer commit).
- **Vercel (preview):** Settings → Environment Variables → **Preview** → adicionar `VITE_STRIPE_PUBLISHABLE_KEY` e `VITE_STRIPE_PRICE_ID` com valores de teste.

Em **Production** só deves usar chaves **live** quando fores cobrar a sério (ver [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md)).

---

## 5. Teste rápido

1. Abrir `https://www.chefiapp.com/app/billing` (ou localhost se em dev).
2. Confirmar que o preço (ex. 79 €/mês) aparece e o botão "Ativar agora" está ativo.
3. Clicar → completar checkout com cartão `4242 4242 4242 4242`.
4. Confirmar redirect para `/billing/success` e mensagem "Assinatura ativa".

---

## 6. Ver números a subir no Stripe (2, 10, 50, 100, 1000)

Para encher o dashboard Stripe em **modo Test** com clientes e subscrições (analíticos a subir):

1. **Variáveis:** `STRIPE_SECRET_KEY=sk_test_...` e `STRIPE_PRICE_ID=price_...` (o mesmo preço de teste).
2. **Na raiz do repo:**

```bash
# 2 restaurantes (clientes + subscrições)
STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_ID=price_xxx npm run stripe:seed:test 2

# 10 (default)
STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_ID=price_xxx npm run stripe:seed:test 10

# 50, 100, 1000
STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_ID=price_xxx npm run stripe:seed:test 50
STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_ID=price_xxx npm run stripe:seed:test 100
STRIPE_SECRET_KEY=sk_test_xxx STRIPE_PRICE_ID=price_xxx npm run stripe:seed:test 1000
```

Ou exportar uma vez e depois só o número:

```bash
export STRIPE_SECRET_KEY=sk_test_xxx
export STRIPE_PRICE_ID=price_xxx   # do merchant-portal/.env.local ou Dashboard
npm run stripe:seed:test 10
npm run stripe:seed:test 100
```

O script cria **N clientes** (email `test-restaurant-1@chefiapp.test`, etc.) e **N subscrições** (estado `incomplete` até pagamento). No Stripe Dashboard (Test) vês:

- **Customers** a subir
- **Subscriptions** a subir

Receita/MRR só sobe quando as subscrições forem pagas (checkout manual ou pagamento das faturas em teste).

---

**Próximo:** Quando estiveres pronto para cobranças reais, trocar para chaves live e concluir [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md).
