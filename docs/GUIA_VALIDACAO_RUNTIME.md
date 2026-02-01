# 🧪 GUIA DE VALIDAÇÃO - RESTAURANT RUNTIME CONTEXT

**Data:** 27/01/2026  
**Objetivo:** Validar que o sistema está funcionando corretamente após implementação

---

## ✅ CHECKLIST DE VALIDAÇÃO

### 1. **RestaurantRuntimeContext Carregando**
- [ ] Abrir console do navegador
- [ ] Verificar se aparece: `[RestaurantRuntime] ✅ Estado carregado:`
- [ ] Verificar se `restaurant_id` existe
- [ ] Verificar se `mode` está correto (`onboarding` ou `active`)

**Como verificar:**
```javascript
// No console do navegador
// O contexto deve estar disponível via React DevTools
```

---

### 2. **IdentitySection Salvando**
- [ ] Acessar `/onboarding?section=identity`
- [ ] Preencher: Nome, Tipo, País, Fuso, Moeda, Idioma
- [ ] Verificar console: `[IdentitySection] ✅ Identidade salva no banco`
- [ ] Verificar se `setup_status.identity = true` no banco

**Query SQL para verificar:**
```sql
SELECT * FROM restaurant_setup_status WHERE restaurant_id = '...';
```

---

### 3. **LocationSection Salvando**
- [ ] Acessar `/onboarding?section=location`
- [ ] Preencher: Endereço, Cidade, CEP, Capacidade, Zonas
- [ ] Verificar console: `[LocationSection] ✅ Localização salva no banco`
- [ ] Verificar se `setup_status.location = true` no banco
- [ ] Verificar se mesas foram criadas (se RPC funcionou)

**Query SQL para verificar:**
```sql
SELECT * FROM gm_tables WHERE restaurant_id = '...';
SELECT * FROM restaurant_zones WHERE restaurant_id = '...';
```

---

### 4. **ScheduleSection Salvando**
- [ ] Acessar `/onboarding?section=schedule`
- [ ] Configurar horários para cada dia
- [ ] Verificar console: `[ScheduleSection] ✅ Horários salvos no banco`
- [ ] Verificar se `setup_status.schedule = true` no banco

**Query SQL para verificar:**
```sql
SELECT * FROM restaurant_schedules WHERE restaurant_id = '...';
```

---

### 5. **PeopleSection Validando**
- [ ] Acessar `/onboarding?section=people`
- [ ] Adicionar pelo menos 1 pessoa com role `manager` ou `owner`
- [ ] Verificar se seção marca como `COMPLETE`
- [ ] Verificar se `setup_status.people = true` no banco

---

### 6. **PublishSection Publicando**
- [ ] Acessar `/onboarding?section=publish`
- [ ] Verificar se botão "Publicar" está habilitado (todas seções completas)
- [ ] Clicar em "Publicar"
- [ ] Verificar console: `[RestaurantRuntime] ✅ Restaurante publicado e módulos instalados`
- [ ] Verificar se redirecionou para `/dashboard`

**Query SQL para verificar:**
```sql
-- Restaurante ativo
SELECT id, status FROM gm_restaurants WHERE id = '...';
-- Deve retornar: status = 'active'

-- Módulos instalados
SELECT * FROM installed_modules WHERE restaurant_id = '...';
-- Deve retornar: tpv, kds, menu
```

---

### 7. **Dashboard Portal Funcionando**
- [ ] Após publicar, verificar se `/dashboard` carrega
- [ ] Verificar se mostra sistemas instalados (TPV, KDS, Menu)
- [ ] Verificar se sistemas são clicáveis
- [ ] Clicar em TPV → deve navegar para `/tpv`
- [ ] Clicar em KDS → deve navegar para `/kds-minimal`
- [ ] Clicar em Menu → deve navegar para `/menu-builder`

---

### 8. **RequireOnboarding Protegendo Rotas**
- [ ] Tentar acessar `/owner/vision` sem publicar
- [ ] Deve redirecionar para `/onboarding`
- [ ] Publicar restaurante
- [ ] Tentar acessar `/owner/vision` novamente
- [ ] Deve permitir acesso

**Rotas para testar:**
- `/owner/vision`
- `/manager/dashboard`
- `/employee/home`
- `/tasks`
- `/people`
- `/health`

---

### 9. **Persistência Após Recarregar**
- [ ] Completar onboarding e publicar
- [ ] Recarregar página (F5)
- [ ] Verificar se `runtime.mode` ainda é `'active'`
- [ ] Verificar se `runtime.restaurant_id` ainda existe
- [ ] Verificar se `runtime.installed_modules` ainda tem `['tpv', 'kds', 'menu']`

---

### 10. **Criação Automática de Restaurante**
- [ ] Limpar localStorage: `localStorage.clear()`
- [ ] Limpar banco (se necessário)
- [ ] Acessar `/onboarding`
- [ ] Preencher Identity
- [ ] Verificar se restaurante foi criado automaticamente
- [ ] Verificar console: `[RestaurantRuntime] ✅ Restaurante criado:`

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Problema: `restaurant_id` é `null`
**Solução:**
- Verificar se Docker Core está rodando
- Verificar se `CONFIG.SUPABASE_URL` está correto
- Verificar console para erros de conexão

### Problema: `setup_status` não está sendo salvo
**Solução:**
- Verificar se tabela `restaurant_setup_status` existe
- Verificar se `runtime.restaurant_id` não é `null`
- Verificar console para erros de SQL

### Problema: Módulos não estão sendo instalados
**Solução:**
- Verificar se tabela `installed_modules` existe
- Verificar se referência para `gm_restaurants` está correta
- Verificar console para erros de instalação

### Problema: Dashboard não aparece após publicar
**Solução:**
- Verificar se `runtime.mode === 'active'`
- Verificar se redirecionamento está funcionando
- Verificar console para erros

---

## 📊 QUERIES SQL ÚTEIS

### Verificar estado do restaurante
```sql
SELECT 
  r.id,
  r.name,
  r.status,
  r.created_at
FROM gm_restaurants r
ORDER BY r.created_at DESC
LIMIT 1;
```

### Verificar setup_status
```sql
SELECT 
  rss.restaurant_id,
  rss.sections,
  rss.updated_at
FROM restaurant_setup_status rss
WHERE rss.restaurant_id = '...';
```

### Verificar módulos instalados
```sql
SELECT 
  im.module_id,
  im.module_name,
  im.status,
  im.installed_at
FROM installed_modules im
WHERE im.restaurant_id = '...';
```

### Verificar mesas criadas
```sql
SELECT 
  t.id,
  t.table_number,
  t.zone,
  t.status
FROM gm_tables t
WHERE t.restaurant_id = '...'
ORDER BY t.table_number;
```

---

## ✅ CRITÉRIOS DE SUCESSO

1. ✅ RestaurantRuntimeContext carrega `restaurant_id` automaticamente
2. ✅ Cada seção salva no banco e atualiza `setup_status`
3. ✅ Publicar ativa restaurante e instala módulos
4. ✅ Dashboard aparece após publicação
5. ✅ Rotas protegidas verificam `runtime.mode`
6. ✅ Estado persiste após recarregar página

---

**Status:** ✅ **GUIA DE VALIDAÇÃO CRIADO**
