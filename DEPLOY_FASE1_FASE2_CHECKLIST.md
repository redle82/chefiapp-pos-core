# 📋 Checklist de Deploy Completo: FASES 1 e 2

**Objetivo:** Garantir um deploy seguro e auditável das funcionalidades críticas de segurança e fiscal.

---

## 1️⃣ Pré-Deploy

- [ ] **Backup:** (Opcional) Exportar dados atuais via Dashboard se houver produção real.
- [ ] **Comunicação:** Avisar equipe/usuários de possível instabilidade (5 min).
- [ ] **Código:** Verificar se `DEPLOY_MIGRATIONS_FASE1_FASE2.sql` está atualizado.

## 2️⃣ Deploy de Banco de Dados (Supabase)

### Componente A: RLS & Segurança
- [ ] Tabela `gm_orders` protegida?
- [ ] Tabela `gm_order_items` protegida?
- [ ] Tabela `gm_tables` protegida?
- [ ] Helper Function `public.user_restaurant_ids()` criada?

### Componente B: Integridade (Race Conditions)
- [ ] Unique Index `idx_gm_orders_active_table` criado? (Sem duplicidade mesa)
- [ ] Unique Index `idx_gm_cash_registers_one_open` criado? (Sem duplicidade caixa)
- [ ] Coluna `table_id` adicionada em `gm_orders`?

### Componente C: Fiscal (FASE 2)
- [ ] Tabela `fiscal_event_store` criada?
- [ ] Índices fiscais criados?
- [ ] RLS na tabela fiscal aplicado?

## 3️⃣ Validação Pós-Deploy

Executar `VALIDAR_DEPLOY.sql` e confirmar:
- [ ] Status RLS: **ATIVO**
- [ ] Policies Count: **> 20**
- [ ] Race Condition Indexes: **PRESENTES**
- [ ] Erros de permissão: **NENHUM**

## 4️⃣ Deploy de Aplicação (Frontend)

- [ ] Build Local: `npm run build` (Sucesso?)
- [ ] Environment Variables: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurados?
- [ ] Deploy para Produção (Vercel/Netlify)
- [ ] Smoke Test: Login -> Abrir Caixa -> Criar Pedido -> Pagar (Offline Mode Test)

## 5️⃣ Monitoramento (Pós-Launch)

- [ ] Verificar Logs do Supabase para erros 500/400.
- [ ] Monitorar tabela `fiscal_event_store` para novos eventos (se ativado).
- [ ] Verificar feedback dos usuários piloto.

---

**Status Final:** ⏳ PENDENTE / ✅ SUCESSO / ❌ FALHA
