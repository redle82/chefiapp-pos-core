# 🔄 Processo de Rollback - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Documentado

---

## 🎯 OBJETIVO

Documentar o processo completo de rollback para app e database migrations. Garantir que a equipe pode executar rollback em < 15 minutos em caso de incidente crítico.

---

## 📱 ROLLBACK DE APP (Expo EAS)

### Listar Releases

```bash
# Listar todas as releases
eas update:list --channel production

# Listar releases de um canal específico
eas update:list --channel staging
```

### Fazer Rollback

```bash
# Rollback para versão anterior (última release)
eas update:rollback --channel production

# Rollback para versão específica
eas update:rollback --channel production --branch main --message "Rollback to previous version"
```

### Validar Rollback

1. **Verificar versão atual:**
   ```bash
   eas update:list --channel production
   ```

2. **Testar app:**
   - Abrir app no dispositivo
   - Verificar funcionalidades críticas
   - Confirmar que versão anterior está ativa

3. **Monitorar erros:**
   - Verificar Sentry para novos erros
   - Validar que problemas foram resolvidos

---

## 🗄️ ROLLBACK DE MIGRATION (Supabase)

### Usar Script Automatizado

```bash
# Rollback da última migration
./scripts/rollback-migration.sh

# Rollback para migration específica
./scripts/rollback-migration.sh 20240124120000
```

### Processo Manual

1. **Listar migrations:**
   ```bash
   supabase migration list
   ```

2. **Verificar migration atual:**
   ```bash
   supabase migration list --db-url $DATABASE_URL
   ```

3. **Executar rollback:**
   ```bash
   # Rollback da última migration
   supabase migration down

   # Rollback para migration específica
   supabase migration down --version 20240124120000
   ```

4. **Validar rollback:**
   ```bash
   # Verificar estado do banco
   supabase db diff

   # Testar queries críticas
   psql $DATABASE_URL -c "SELECT * FROM gm_orders LIMIT 1;"
   ```

---

## ⚠️ CHECKLIST DE ROLLBACK RÁPIDO

### Antes de Fazer Rollback

- [ ] **Identificar problema:** Qual é o erro crítico?
- [ ] **Confirmar necessidade:** Rollback é realmente necessário?
- [ ] **Backup:** Fazer backup do banco (se rollback de migration)
- [ ] **Comunicar:** Avisar equipe sobre rollback
- [ ] **Documentar:** Anotar motivo do rollback

### Durante Rollback

- [ ] **App:**
  - [ ] Listar releases disponíveis
  - [ ] Executar rollback
  - [ ] Validar versão anterior ativa

- [ ] **Database:**
  - [ ] Listar migrations
  - [ ] Executar rollback
  - [ ] Validar estado do banco

### Após Rollback

- [ ] **Validar funcionalidades:**
  - [ ] Login funciona
  - [ ] Pedidos funcionam
  - [ ] Pagamentos funcionam
  - [ ] Cozinha funciona

- [ ] **Monitorar:**
  - [ ] Verificar Sentry (sem novos erros)
  - [ ] Verificar logs do Supabase
  - [ ] Validar com usuários (se aplicável)

- [ ] **Documentar:**
  - [ ] Anotar rollback realizado
  - [ ] Documentar causa raiz
  - [ ] Criar ticket para correção permanente

---

## 🚨 CENÁRIOS COMUNS

### Erro Crítico em Produção

1. **Identificar erro no Sentry**
2. **Decidir:** Rollback necessário?
3. **Executar rollback de app** (se erro no app)
4. **Executar rollback de migration** (se erro no banco)
5. **Validar** que problema foi resolvido
6. **Investigar** causa raiz
7. **Corrigir** e fazer deploy novamente

### Migration Quebrou Produção

1. **Identificar migration problemática**
2. **Fazer backup do banco**
3. **Executar rollback:**
   ```bash
   ./scripts/rollback-migration.sh [version-problematica]
   ```
4. **Validar** que dados estão corretos
5. **Corrigir migration** em desenvolvimento
6. **Testar** migration corrigida
7. **Aplicar** migration corrigida em produção

### App Quebrou Após Deploy

1. **Identificar versão problemática**
2. **Executar rollback:**
   ```bash
   eas update:rollback --channel production
   ```
3. **Validar** que app funciona
4. **Investigar** causa do problema
5. **Corrigir** e fazer novo deploy

---

## 📋 TEMPO ESTIMADO

| Ação | Tempo |
|------|-------|
| Identificar problema | 2-5 min |
| Decidir rollback | 1-2 min |
| Rollback de app | 2-3 min |
| Rollback de migration | 3-5 min |
| Validação | 3-5 min |
| **Total** | **11-20 min** |

**Meta:** < 15 minutos

---

## 🔒 SEGURANÇA

### Antes de Rollback

- ✅ Fazer backup do banco (se migration)
- ✅ Comunicar equipe
- ✅ Documentar motivo

### Durante Rollback

- ✅ Validar comandos antes de executar
- ✅ Confirmar versão/migration correta
- ✅ Não pular etapas

### Após Rollback

- ✅ Validar que problema foi resolvido
- ✅ Não deixar sistema instável
- ✅ Planejar correção permanente

---

## 📚 REFERÊNCIAS

- **Script de Rollback:** `scripts/rollback-migration.sh`
- **Expo EAS Docs:** https://docs.expo.dev/eas-update/rollback/
- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli

---

## 🔄 MANUTENÇÃO

### Atualizar Documentação

Quando houver mudanças no processo:
1. Atualizar este documento
2. Atualizar checklist rápido
3. Comunicar equipe

### Revisar Processo

Revisar este processo a cada 3 meses ou após incidentes críticos.

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Documentado
