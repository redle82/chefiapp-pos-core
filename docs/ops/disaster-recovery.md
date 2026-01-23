# 🛡️ Disaster Recovery - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado

---

## 🎯 OBJETIVO

Implementar estratégia de backups e disaster recovery para garantir RTO < 1h e RPO < 15min.

---

## 📊 SLAs

- **RTO (Recovery Time Objective):** < 1 hora
- **RPO (Recovery Point Objective):** < 15 minutos
- **SLA:** 99.95% uptime

---

## 💾 BACKUPS

### Supabase (Automático)

**Configuração:**
- Supabase faz backups automáticos diários
- Retenção: 7 dias (plano Pro) ou 30 dias (plano Enterprise)
- Backups incluem: Database completo + Storage

**Acessar Backups:**
1. Acesse Supabase Dashboard
2. Vá em **Database** > **Backups**
3. Selecione backup para restaurar

---

### Backups Manuais (Recomendado)

**Frequência:**
- Diário (automático via Supabase)
- Antes de migrations críticas (manual)
- Semanal (full backup para arquivo)

**Processo:**
```bash
# Backup completo do banco
supabase db dump -f backup-$(date +%Y%m%d).sql

# Backup apenas schema
supabase db dump --schema-only -f schema-$(date +%Y%m%d).sql

# Backup apenas dados
supabase db dump --data-only -f data-$(date +%Y%m%d).sql
```

---

## 🔄 RESTAURAÇÃO

### Restaurar Backup Completo

```bash
# Restaurar backup
supabase db reset
psql $DATABASE_URL < backup-20260122.sql
```

### Restaurar Apenas Schema

```bash
psql $DATABASE_URL < schema-20260122.sql
```

### Restaurar Apenas Dados

```bash
psql $DATABASE_URL < data-20260122.sql
```

---

## 🚨 DISASTER RECOVERY

### Cenário 1: Corrupção de Dados

**Processo:**
1. Identificar ponto de restauração (último backup válido)
2. Notificar usuários (manutenção programada)
3. Restaurar backup
4. Validar dados
5. Reativar sistema

**Tempo estimado:** 30-60 minutos

---

### Cenário 2: Perda Completa de Infraestrutura

**Processo:**
1. Provisionar nova infraestrutura (Supabase)
2. Restaurar backup mais recente
3. Reconfigurar variáveis de ambiente
4. Validar sistema
5. Atualizar DNS/configurações
6. Reativar sistema

**Tempo estimado:** 1-2 horas

---

### Cenário 3: Migration Quebrou Produção

**Processo:**
1. Executar rollback de migration
2. Validar dados
3. Investigar causa
4. Corrigir migration
5. Reaplicar quando seguro

**Tempo estimado:** 15-30 minutos

---

## 📋 CHECKLIST DE DISASTER RECOVERY

### Antes de Incidente
- [ ] Backups automáticos configurados
- [ ] Backups manuais regulares
- [ ] Processo documentado
- [ ] Equipe treinada
- [ ] Testes de restauração realizados

### Durante Incidente
- [ ] Identificar tipo de incidente
- [ ] Avaliar impacto
- [ ] Decidir: rollback ou restore
- [ ] Executar procedimento
- [ ] Validar restauração
- [ ] Comunicar usuários

### Após Incidente
- [ ] Documentar incidente
- [ ] Investigar causa raiz
- [ ] Implementar prevenção
- [ ] Atualizar procedimentos
- [ ] Revisar SLAs

---

## 🧪 TESTAR DISASTER RECOVERY

### Teste Anual (Recomendado)

1. **Criar ambiente de teste**
2. **Simular perda de dados**
3. **Executar restauração**
4. **Validar dados**
5. **Medir tempo de restauração**
6. **Documentar resultados**

---

## 📚 REFERÊNCIAS

- **Supabase Backups:** https://supabase.com/docs/guides/platform/backups
- **PostgreSQL Backup:** https://www.postgresql.org/docs/current/backup.html
- **Script de Backup:** `scripts/backup-database.sh` (criar se necessário)

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
