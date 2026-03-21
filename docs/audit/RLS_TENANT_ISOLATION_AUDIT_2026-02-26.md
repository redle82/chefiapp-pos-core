# Auditoria RLS — Isolamento de Tenant

**Data:** 2026-02-26  
**Objetivo:** Validar que o PostgREST + RLS garantem isolamento entre restaurantes (sem cross-tenant leakage).  
**Contexto:** Frontend → PostgREST directo com anon key; has_restaurant_access() é o mecanismo central.

---

## 1. Mecanismo de isolamento

| Componente | Função |
|------------|--------|
| `has_restaurant_access(restaurant_id)` | Verifica se o utilizador actual tem acesso ao restaurante |
| `restaurant_users` | Mapeia user_id (auth.uid()) → restaurant_id |
| `auth.jwt() ->> 'restaurant_id'` | JWT pode conter restaurant_id como claim |
| `auth.uid()` | User ID do JWT (NULL se anon) |

**Nota:** Em produção Supabase, o frontend deve passar JWT (Keycloak) em `Authorization: Bearer` para que `auth.uid()` e `auth.jwt()` tenham valor. Sem JWT, `has_restaurant_access()` retorna false e políticas com `TO authenticated` bloqueiam anon.

---

## 2. Tabelas com isolamento correcto

Tabelas que usam `has_restaurant_access(restaurant_id)` e `TO authenticated`:

| Tabela | Migração | Nota |
|--------|----------|------|
| gm_restaurants | 20260321 | SELECT/UPDATE/DELETE com has_restaurant_access(id) |
| gm_orders | 20260321 | Via restaurant_id |
| gm_order_items | 20260321 | Via gm_orders |
| gm_payments | 20260321, 20260212 | Via gm_orders |
| gm_restaurant_members | 20260321 | has_restaurant_access(restaurant_id) |
| gm_reservations | 20260212 | has_restaurant_access(restaurant_id) |
| gm_cash_registers | 20260212 | has_restaurant_access(restaurant_id) |
| gm_tasks, recurring_tasks, task_rules | 20260212 | has_restaurant_access(restaurant_id) |
| gm_integration_credentials | 20260305 | Via restaurant_users + auth.uid() |
| gm_device_heartbeats | 20260221 | has_restaurant_access(restaurant_id) |
| api_keys, webhook_out_config | 20260301 | has_restaurant_access(restaurant_id) |
| inventory_items | 20260220 | has_restaurant_access(restaurant_id) |
| gm_order_requests | 20260220 | tenant_id IN current_user_restaurants() |

**Core tables (pedidos, pagamentos, tarefas, membros):** ✅ Isoladas.

---

## 3. Risco alto — políticas abertas

### 3.1 gm_organizations, gm_org_members

**Ficheiro:** `20260304_gm_organizations.sql`

```sql
CREATE POLICY "org_read_all" ON public.gm_organizations FOR SELECT USING (true);
CREATE POLICY "org_insert_all" ... WITH CHECK (true);
CREATE POLICY "org_update_all" ... USING (true);
-- idem gm_org_members
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gm_organizations TO anon, authenticated;
```

**Risco:** Qualquer request (incl. anon) pode ler, inserir e actualizar todas as organizações e membros.  
**Impacto:** Cross-tenant leakage de dados de org; possivel criação de orgs por anon.

---

### 3.2 gm_orchestrator_logs

**Ficheiro:** `20260225_enterprise_hardening.sql`

```sql
CREATE POLICY gm_orchestrator_logs_tenant_read ... USING (true);
CREATE POLICY gm_orchestrator_logs_tenant_insert ... WITH CHECK (true);
GRANT SELECT, INSERT ON public.gm_orchestrator_logs TO anon;
```

**Risco:** anon pode ler e inserir logs de orquestração de todos os restaurantes.  
**Impacto:** Leitura de decisões operacionais e estado interno; poluição com dados falsos.

---

### 3.3 gm_restaurant_settings

**Ficheiro:** `20260225_enterprise_hardening.sql`

```sql
CREATE POLICY gm_restaurant_settings_read ... FOR SELECT USING (true);
CREATE POLICY gm_restaurant_settings_write ... FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON public.gm_restaurant_settings TO anon;
```

**Risco:** anon pode ler e alterar configurações operacionais (orchestrator, thresholds, KDS) de qualquer restaurante.  
**Impacto:** Alteração de parâmetros críticos de operação.

**Nota:** A migração `20260220_rls_operational_hardening.sql` tinha políticas seguras (`has_restaurant_access`) e `REVOKE anon`. A `20260225` adiciona políticas abertas e faz `GRANT` novamente. Com várias políticas permissive, basta uma passar.

---

### 3.4 gm_restaurant_members (patch)

**Ficheiro:** `patch_gm_restaurant_members.sql`

```sql
CREATE POLICY "Public read for own membership" ... USING (true); -- Relaxed for dev
CREATE POLICY "Public insert for bootstrap" ... WITH CHECK (true);
```

**Risco:** Leitura de todos os membros; inserção arbitrária. O comentário indica ser “para dev”.  
**Impacto:** Se aplicado em produção, revela associações user↔restaurant e permite inserções falsas.

---

### 3.5 gm_commercial_leads

**Ficheiro:** `20260601_gm_commercial_leads.sql`

```sql
CREATE POLICY "Allow authenticated read" ... TO authenticated USING (true);
```

**Risco:** Qualquer utilizador autenticado vê todos os leads.  
**Impacto:** Baixo a médio; dados comerciais (email, país, etc.) partilhados entre tenants.

---

### 3.6 gm_audit_logs

**Ficheiro:** `20260211_core_audit_logs.sql`

```sql
CREATE POLICY "audit_logs_tenant_read" ... USING (true); -- Docker Core: refine when auth.uid() available
```

**Risco:** Leitura de todos os audit logs.  
**Impacto:** Alto; pode incluir acções sensíveis e identificar utilizadores.

---

## 4. Resumo

| Severidade | Tabelas | Acção recomendada |
|------------|---------|-------------------|
| Crítico | gm_restaurant_settings, gm_orchestrator_logs | Substituir políticas por has_restaurant_access; remover GRANT anon |
| Alto | gm_organizations, gm_org_members | Adicionar políticas com isolamento por org/tenant |
| Alto | gm_restaurant_members (patch) | Aplicar apenas em dev ou corrigir políticas |
| Médio | gm_commercial_leads | Filtrar por tenant ou role comercial |
| Médio | gm_audit_logs | Adicionar filtro por tenant ou restrict a service_role |

---

## 5. Condição para RLS efectivo

O RLS só protege se:

1. O frontend enviar JWT (Keycloak) em `Authorization: Bearer` nas chamadas ao PostgREST.
2. O Supabase/PostgREST estiver configurado para validar esse JWT e popular `request.jwt.claims`.
3. `restaurant_users` (ou equivalente) estar populado com o mapeamento user_id → restaurant_id.
4. Ou o JWT incluir o claim `restaurant_id` quando relevante.

Se as requests forem apenas com apikey (anon) e sem Bearer token, o role será anon e `auth.uid()` será NULL. Nesse caso, políticas que exigem `authenticated` bloqueiam acesso; tabelas com `GRANT anon` e políticas abertas ficam expostas.

---

## 6. Checklist de mitigação

- [x] **Migration aplicada:** `docker-core/schema/migrations/20260226_rls_tenant_hardening.sql`
  - Corrige gm_orchestrator_logs, gm_restaurant_settings, gm_organizations, gm_org_members, gm_restaurant_members
  - REVOKE anon de todas as tabelas afectadas
  - Policies com has_restaurant_access() ou isolamento por org membership
  - Guard has_restaurant_access() em RPCs SECURITY DEFINER (log_orchestrator_decision, get_orchestrator_logs, upsert_restaurant_settings, get_restaurant_settings)
- [ ] Confirmar que o frontend passa JWT em todas as chamadas ao Core
- [ ] Verificar que restaurant_users (ou alternativa) está preenchido para os utilizadores activos
