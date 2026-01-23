# 🚀 Guia de Deploy - ChefIApp para Produção

**Data:** 2026-01-24  
**Versão:** 2.0.0  
**Ambiente:** Sofia Gastrobar (Restaurante Único)

---

## 📋 Pré-requisitos

### 1. Backup do Banco de Dados

```bash
# Criar backup antes de qualquer alteração
pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_pre_production_$(date +%Y%m%d).sql
```

### 2. Verificar Versão do Supabase

- [ ] Supabase Dashboard acessível
- [ ] Permissões de admin configuradas
- [ ] RLS (Row Level Security) habilitado

---

## 🗄️ Passo 1: Executar Migration de Audit Logs

### 1.1 Acessar SQL Editor no Supabase

1. Acessar Supabase Dashboard
2. Ir para **SQL Editor**
3. Criar nova query

### 1.2 Executar Migration

```sql
-- Copiar e colar o conteúdo de: mobile-app/migration_audit_logs.sql
-- Executar a query completa
```

### 1.3 Validar Migration

```sql
-- Verificar que tabela foi criada
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'gm_audit_logs'
);

-- Verificar estrutura
\d gm_audit_logs

-- Verificar RLS
SELECT * FROM pg_policies WHERE tablename = 'gm_audit_logs';

-- Verificar índices
SELECT indexname FROM pg_indexes WHERE tablename = 'gm_audit_logs';
```

**Resultado Esperado:**
- ✅ Tabela `gm_audit_logs` existe
- ✅ 2 policies RLS criadas
- ✅ 6 índices criados

---

## 📱 Passo 2: Build e Deploy do App

### 2.1 Verificar Variáveis de Ambiente

```bash
# Verificar .env ou variáveis de ambiente
EXPO_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
```

### 2.2 Build para Produção

```bash
# Para iOS
eas build --platform ios --profile production

# Para Android
eas build --platform android --profile production
```

### 2.3 Validar Build

- [ ] Build completou sem erros
- [ ] APK/IPA gerado
- [ ] Tamanho do arquivo razoável

---

## 🧪 Passo 3: Validação Pós-Deploy

### 3.1 Testes Básicos

1. **Login:**
   - [ ] Login funciona
   - [ ] Sessão persiste

2. **Carregamento:**
   - [ ] App carrega sem erros
   - [ ] Dados são carregados corretamente

3. **Ações Críticas:**
   - [ ] Criar pedido funciona
   - [ ] Pagar pedido funciona
   - [ ] Abrir/fechar caixa funciona

### 3.2 Validar Logs de Auditoria

```sql
-- Verificar que logs estão sendo criados
SELECT 
    action,
    COUNT(*) as count,
    MAX(created_at) as last_log
FROM gm_audit_logs
GROUP BY action
ORDER BY last_log DESC;
```

**Resultado Esperado:**
- ✅ Logs sendo criados para ações críticas
- ✅ `user_id` preenchido corretamente
- ✅ `restaurant_id` preenchido corretamente

---

## 🔍 Passo 4: Monitoramento Inicial

### 4.1 Primeiras 24 Horas

**Métricas a Monitorar:**

1. **Erros:**
   ```sql
   -- Verificar erros no console do app
   -- Monitorar Supabase logs
   ```

2. **Performance:**
   - [ ] Tempo de carregamento < 3s
   - [ ] Sem travamentos
   - [ ] Navegação fluida

3. **Logs de Auditoria:**
   ```sql
   -- Verificar volume de logs
   SELECT 
       DATE(created_at) as date,
       action,
       COUNT(*) as count
   FROM gm_audit_logs
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY DATE(created_at), action
   ORDER BY date DESC, count DESC;
   ```

### 4.2 Alertas Configurados

- [ ] Alertas de erro configurados
- [ ] Monitoramento de performance ativo
- [ ] Notificações de logs críticos

---

## 🚨 Rollback Plan

### Se Algo Der Errado

1. **Reverter Migration:**
   ```sql
   -- CUIDADO: Isso apagará todos os logs
   DROP TABLE IF EXISTS public.gm_audit_logs CASCADE;
   ```

2. **Reverter Build:**
   - [ ] Instalar versão anterior do app
   - [ ] Verificar que funcionalidades básicas funcionam

3. **Restaurar Backup:**
   ```bash
   psql -h [HOST] -U [USER] -d [DATABASE] < backup_pre_production_[DATE].sql
   ```

---

## ✅ Checklist Final de Deploy

### Antes de Deploy

- [ ] ✅ Backup do banco criado
- [ ] ✅ Migration testada em ambiente de staging
- [ ] ✅ Build testado localmente
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Documentação revisada

### Durante Deploy

- [ ] ✅ Migration executada com sucesso
- [ ] ✅ Tabela de logs validada
- [ ] ✅ Build gerado sem erros
- [ ] ✅ App instalado em dispositivo de teste

### Após Deploy

- [ ] ✅ Testes básicos passaram
- [ ] ✅ Logs de auditoria funcionando
- [ ] ✅ Nenhum erro crítico
- [ ] ✅ Performance aceitável
- [ ] ✅ Monitoramento ativo

---

## 📞 Suporte

### Em Caso de Problemas

1. **Verificar Logs:**
   - Console do app
   - Supabase logs
   - Logs de auditoria

2. **Documentação:**
   - `STATUS_FINAL_PRODUCAO.md` - Status geral
   - `PRE_PRODUCTION_CHECKLIST.md` - Checklist de validação
   - `CHEFIAPP_FIXES_APPLIED.md` - Correções aplicadas

3. **Contatos:**
   - Equipe de desenvolvimento
   - Suporte Supabase

---

## 🎯 Critérios de Sucesso

**✅ Deploy Bem-Sucedido se:**
- ✅ Migration executada sem erros
- ✅ App funcionando normalmente
- ✅ Logs de auditoria ativos
- ✅ Nenhum erro crítico
- ✅ Performance aceitável

**❌ Rollback Necessário se:**
- ❌ Migration falhou
- ❌ App não inicia
- ❌ Erros críticos aparecem
- ❌ Performance inaceitável

---

**Versão:** 2.0.0  
**Data:** 2026-01-24  
**Status:** 📋 **GUIA DE DEPLOY**
