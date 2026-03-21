# Revisão Estratégica — Prontos para Cliente Piloto?

**Data:** 2026-02-26  
**Pergunta:** Podemos operar 1 restaurante real com risco controlado?

---

## 1. Veredicto

| Critério | Estado |
|----------|--------|
| **Técnico** | 🟡 Pronto **após** aplicar migration RLS em produção |
| **Comercial** | 🟡 Pronto em modo operacional (sem cobrança online) |
| **Segurança** | 🟡 Pronto **após** RLS + validação JWT |
| **Go/No-Go** | **Condicional** — aplicar `20260226_rls_tenant_hardening.sql` em produção e validar JWT antes de escalar |

---

## 2. Critérios técnicos

### 2.1 Infraestrutura

| Pilar | Estado | Nota |
|-------|--------|------|
| Backend (Supabase) | 🟢 Activo | PostgREST 401 sem apikey |
| Frontend (Vercel) | 🟢 | Domínio e deploy a confirmar (chefiapp.com) |
| RLS multi-tenant | 🟡 Migration criada, **não aplicada** | Ficheiro pronto; falta `dbmate up` em produção |
| Gateway | 🔴 Opcional | Modo 48h: operação sem checkout/PIX |

### 2.2 Funcionalidade (modo operacional)

| Fluxo | Estado |
|-------|--------|
| Login / Auth | 🟢 |
| Onboarding (conta, restaurante, staff) | 🟢 |
| Pedidos, KDS, Dashboard | 🟢 |
| Tarefas (criar, atribuir, concluir) | 🟢 |
| POS — dinheiro | 🟢 |
| Relatórios, fecho de caixa | 🟢 |
| Checkout Stripe | 🔴 Oculto (modo 48h) |
| PIX / SumUp | 🔴 Ocultos (modo 48h) |

### 2.3 Bloqueadores técnicos (antes de piloto)

| # | Bloqueador | Acção |
|---|------------|-------|
| 1 | Migration RLS não aplicada em produção | `psql -f 20260226_rls_tenant_hardening.sql` no Supabase produção |
| 2 | JWT não validado | Confirmar que todas as chamadas ao Core passam `Authorization: Bearer <JWT>` |
| 3 | chefiapp.com 404 (se ainda vigente) | Promover deployment Vercel a Production e configurar domínios |

---

## 3. Critérios comerciais

### 3.1 Posicionamento actual

**"Sistema de gestão operacional para restaurantes"**

- CTA: "Começar a usar" / "Trial gratuito"
- Sem cobrança online até gateway activo
- Vendável: sim — prova de uso, dor real, operação real

### 3.2 O que o piloto valida

- Uso real do sistema (pedidos, tarefas, KDS)
- Qualidade do onboarding
- Estabilidade operacional
- Dados para pricing futuro

### 3.3 O que NÃO está disponível (e está ok)

- Assinatura paga (Stripe)
- PIX / cartão no TPV
- Upload de imagens via gateway

---

## 4. Critérios de segurança

| Aspecto | Estado |
|---------|--------|
| PostgREST 401 sem apikey | 🟢 |
| RLS com `has_restaurant_access()` | 🟡 Migration criada |
| REVOKE anon em tabelas multi-tenant | 🟡 Migration criada |
| Guards em RPCs SECURITY DEFINER | 🟡 Migration criada |
| JWT em todas as chamadas ao Core | ⚠️ A validar |

**Risco crítico:** Se o frontend não enviar JWT, `auth.uid()` = NULL e políticas com `auth.uid() IS NOT NULL` bloqueiam. Políticas antigas (USING true) permitiam bypass. Após a migration: ou o sistema funciona com JWT, ou falha em vez de expor dados.

---

## 5. Checklist pré-piloto

### Obrigatório (antes do primeiro restaurante real)

- [ ] **Aplicar migration RLS** em Supabase produção
- [ ] **Validar JWT** — todas as chamadas ao PostgREST com `Authorization: Bearer`
- [ ] **chefiapp.com online** — deploy em Production, domínios configurados
- [ ] **Teste E2E** — criar conta → onboarding → pedido → tarefa → pagamento em dinheiro

### Recomendado

- [ ] Teste cross-tenant — JWT do restaurante A não acede a dados do B
- [ ] Teste sem JWT — requests sem Bearer devem falhar (401 ou 0 rows)

---

## 6. Resposta directa

**Estamos prontos para cliente piloto?**

**Sim, se:**
1. Migration RLS for aplicada em produção
2. JWT for enviado em todas as chamadas ao Core
3. chefiapp.com estiver acessível
4. Aceitares operar em modo "gestão operacional" (sem cobrança online)

**Não, se:**
- A migration não for aplicada (risco de cross-tenant)
- O frontend não enviar JWT (acesso bloqueado ou policies antigas ainda activas)
- O domínio público não estiver a funcionar

---

## 7. Próximo movimento

| Prioridade | Acção |
|------------|-------|
| 1 | Aplicar `20260226_rls_tenant_hardening.sql` no Supabase produção |
| 2 | Validar que o frontend envia JWT nas chamadas ao Core |
| 3 | Confirmar chefiapp.com online |
| 4 | Teste E2E com 1 conta piloto |

**Estimativa:** 0.5–1 dia para itens 1–3; 0.5 dia para item 4.
