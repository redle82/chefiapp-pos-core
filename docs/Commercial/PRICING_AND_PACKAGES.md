# Pricing & Packages

**Propósito:** Definição oficial dos planos ChefIApp, preços por moeda, add-ons, descontos multi-local e serviços opcionais.  
**Ref:** [GLOBAL_COMMERCIAL_OS.md](./GLOBAL_COMMERCIAL_OS.md), [PLATFORM_MODULAR_DECISION.md](../strategy/PLATFORM_MODULAR_DECISION.md)

---

## 1. Estrutura de planos

| Plano | Módulos incluídos | Locais | Preço mensal (referência) |
|-------|-------------------|--------|---------------------------|
| **Starter** | Core + POS | 1 | EUR 29 / USD 32 / BRL 149 |
| **Pro** | Core + POS + Workforce | até 3 | EUR 59 / USD 65 / BRL 299 |
| **Enterprise** | Core + POS + Workforce + Intelligence | Ilimitado | EUR 99 / USD 110 / BRL 499 |

---

## 2. Módulos por plano

### 2.1 Starter — Core + POS

| Módulo | Incluído | Descrição |
|--------|----------|-----------|
| **Core** | ✅ | Auth, RBAC, multi-tenant, eventos, API base |
| **POS** | ✅ | Pedidos, mesas, KDS, pagamentos, fechamento de caixa |

**Inclui:**
- 1 local
- TPV (pedidos, pagamento)
- KDS básico (display cozinha)
- Fechamento de caixa

**Não inclui:**
- Workforce Orchestrator (tarefas automáticas)
- Analytics avançado
- API pública documentada
- Suporte prioritário

### 2.2 Pro — Core + POS + Workforce

| Módulo | Incluído | Descrição |
|--------|----------|-----------|
| **Core** | ✅ | Idem Starter |
| **POS** | ✅ | Idem Starter |
| **Workforce** | ✅ | Tarefas, check-in, orquestrador, atribuição por zona |

**Inclui tudo do Starter, mais:**
- Até 3 locais
- Workforce Orchestrator (tarefas automáticas quando calmo)
- KDS Task Board Mode (tarefas quando KDS vazio)
- Check-in / turnos básicos

**Não inclui:**
- Intelligence (métricas avançadas, heatmap)
- API pública
- Suporte prioritário

### 2.3 Enterprise — Core + POS + Workforce + Intelligence

| Módulo | Incluído | Descrição |
|--------|----------|-----------|
| **Core** | ✅ | Idem Pro |
| **POS** | ✅ | Idem Pro |
| **Workforce** | ✅ | Idem Pro |
| **Intelligence** | ✅ | Métricas cruzadas, heatmap, alertas, relatórios avançados |

**Inclui tudo do Pro, mais:**
- Locais ilimitados
- Analytics / Intelligence
- API pública documentada
- Suporte prioritário
- Auditoria e compliance (RBAC completo)

---

## 3. Preços mensais por moeda

| Plano | EUR | USD | BRL | GBP | MXN |
|-------|-----|-----|-----|-----|-----|
| **Starter** | €29 | $32 | R$ 149 | £26 | $599 |
| **Pro** | €59 | $65 | R$ 299 | £52 | $1.199 |
| **Enterprise** | €99 | $110 | R$ 499 | £88 | $1.999 |

*Valores em centavos no Core: ver `billing_plan_prices` seed. GBP e MXN são propostas para expansão.*

---

## 4. Terminal add-ons

| Add-on | Descrição | Preço mensal (referência EUR) |
|--------|-----------|-------------------------------|
| **Terminal extra (TPV)** | 2.º ou 3.º terminal por local | +€10 / terminal |
| **KDS extra** | Display cozinha adicional por local | +€5 / display |
| **Impressora** | N/A (hardware do cliente) | — |

*Implementação futura: `billing_addons` ou itemizado no contrato.*

---

## 5. Multi-location discounts

| Condição | Desconto | Aplicável |
|----------|----------|-----------|
| 2 locais (Pro) | — | Preço base Pro |
| 3 locais (Pro) | — | Preço base Pro |
| 4+ locais | Enterprise | Migrar para Enterprise |
| Enterprise 6+ locais | Negociável | Contato vendas |

*Pro: até 3 locais no preço base. Enterprise: locais ilimitados no preço base.*

---

## 6. Serviços opcionais

| Serviço | Descrição | Preço (referência) |
|---------|-----------|--------------------|
| **Setup assistido** | Configuração inicial com engenheiro (1–2h) | €99 one-time |
| **Formação** | Sessão de formação para equipa (1h) | €49 / sessão |
| **Migração de dados** | Import de menu / histórico (se aplicável) | Quote |
| **Integração API** | Desenvolvimento de conector custom | Quote |
| **Suporte premium** | SLA dedicado, canal privado | Quote (Enterprise) |

*Estes serviços não estão no Core billing; são contratados separadamente.*

---

## 7. Trial

| Elemento | Valor |
|----------|-------|
| **Duração** | 14 dias |
| **Cartão** | Não obrigatório para iniciar |
| **Funcionalidades** | Pro (ou plano escolhido) durante trial |
| **Ao expirar** | Redirecionamento para checkout ou downgrade |

---

## 8. Module gating logic (resumo)

| Funcionalidade | Starter | Pro | Enterprise |
|----------------|---------|-----|------------|
| POS + KDS | ✅ | ✅ | ✅ |
| Fechamento caixa | ✅ | ✅ | ✅ |
| Workforce Orchestrator | ❌ | ✅ | ✅ |
| Tarefas automáticas | ❌ | ✅ | ✅ |
| KDS Task Board Mode | ❌ | ✅ | ✅ |
| Analytics / Intelligence | ❌ | ❌ | ✅ |
| API pública | ❌ | ❌ | ✅ |
| Suporte prioritário | ❌ | ❌ | ✅ |
| Locais | 1 | 3 | Ilimitado |

---

## 9. Referências técnicas

- Seed de preços: `docker-core/schema/migrations/20260228_billing_plan_prices_seed_multi_currency.sql`
- Resolução de moeda: `gm_restaurants.country` / `restaurant.currency`
- Stripe mapping: env vars `STRIPE_PRICE_STARTER_EUR`, etc. no integration-gateway
