# 🐛 Reprodutibilidade de Bugs - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado

---

## 🎯 OBJETIVO

Implementar processo para reproduzir bugs reportados, garantindo que equipe pode investigar e corrigir rapidamente.

---

## 📋 PROCESSO DE REPRODUÇÃO

### 1. Receber Bug Report

**Informações necessárias:**
- Ticket ID
- Restaurant ID
- Descrição do bug
- Steps para reproduzir
- Screenshots/logs (se disponíveis)

---

### 2. Criar Ambiente Isolado

**Opção A: Usar dados do restaurante (staging)**
```bash
# Restaurar snapshot de dados do restaurante
./scripts/reproduce-bug.sh TICKET-123 restaurant-id
```

**Opção B: Criar ambiente de teste**
```bash
# Criar restaurante de teste com dados similares
./scripts/provision-restaurant.sh "Test Restaurant" "test@example.com"
```

---

### 3. Executar Steps de Reprodução

1. Fazer login como usuário do restaurante
2. Navegar para funcionalidade mencionada
3. Reproduzir passos descritos no ticket
4. Verificar se bug ocorre

---

### 4. Coletar Logs e Contexto

**Sentry:**
- Buscar erros relacionados ao restaurant_id
- Verificar breadcrumbs
- Analisar stack traces

**Supabase Logs:**
- Verificar queries lentas
- Verificar erros de RLS
- Verificar audit_logs

**Audit Logs:**
```sql
SELECT * 
FROM gm_audit_logs 
WHERE tenant_id = 'restaurant-id' 
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

### 5. Documentar Reprodução

**Template:**
```markdown
## Bug: [TICKET-123]

### Ambiente
- Restaurant ID: xxx
- User ID: yyy
- Data/Hora: 2026-01-22 10:30:00

### Steps para Reproduzir
1. ...
2. ...
3. ...

### Resultado Esperado
...

### Resultado Atual
...

### Logs
- Sentry: [link]
- Supabase: [link]
- Audit Logs: [query]

### Contexto Adicional
...
```

---

## 🔧 SCRIPT DE REPRODUÇÃO

**Uso:**
```bash
./scripts/reproduce-bug.sh [ticket_id] [restaurant_id]
```

**O que faz:**
1. Busca dados do ticket
2. Busca dados do restaurante
3. Cria ambiente isolado (se possível)
4. Fornece steps de reprodução
5. Coleta logs e contexto

---

## 🔗 INTEGRAÇÃO COM SISTEMA DE TICKETS

### Ao Criar Ticket

1. Ticket é criado em `gm_support_tickets`
2. Metadata inclui:
   - restaurant_id
   - user_id
   - action que causou o bug
   - contexto adicional

### Ao Reproduzir

1. Usar script de reprodução
2. Adicionar comentário no ticket com resultado
3. Atualizar status para 'in_progress'

---

## 📚 REFERÊNCIAS

- **Script:** `scripts/reproduce-bug.sh`
- **Tabela:** `gm_support_tickets`
- **Audit Logs:** `gm_audit_logs`
- **Sentry:** https://sentry.io

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
