# Backup e Restauro — ChefIApp

**Propósito:** Documento canónico de **backup** e **restauro**. Detalhado a partir de [disaster-recovery.md](./disaster-recovery.md).  
**Público:** DevOps, engenharia.  
**Referência:** [disaster-recovery.md](./disaster-recovery.md) · [SLO_SLI.md](../architecture/SLO_SLI.md) · [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md)

---

## 1. Objetivos (RTO / RPO)

- **RTO (Recovery Time Objective):** < 1 hora
- **RPO (Recovery Point Objective):** < 15 minutos
- **SLA uptime:** 99,95% (referência)

---

## 2. Backups

### Supabase (automático)

- Backups automáticos diários pelo Supabase.
- Retenção: 7 dias (Pro) ou 30 dias (Enterprise).
- Inclui: base de dados + Storage.
- Acesso: Supabase Dashboard → **Database** → **Backups**.

### Backups manuais (recomendado)

**Quando:** Antes de migrações críticas; cópia semanal para arquivo.

**Comandos:**

```bash
# Backup completo
supabase db dump -f backup-$(date +%Y%m%d).sql

# Apenas schema
supabase db dump --schema-only -f schema-$(date +%Y%m%d).sql

# Apenas dados
supabase db dump --data-only -f data-$(date +%Y%m%d).sql
```

### Docker Core

Se o Core for Postgres em Docker: usar `pg_dump` (ou equivalente) conforme documentação do container; agendar dumps periódicos e armazenar em local seguro.

---

## 3. Restauro

### Restaurar backup completo

```bash
# Atenção: supabase db reset apaga dados locais
supabase db reset
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

### Restaurar apenas schema

```bash
psql $DATABASE_URL < schema-YYYYMMDD.sql
```

### Restaurar apenas dados

```bash
psql $DATABASE_URL < data-YYYYMMDD.sql
```

### Restauro a partir do Supabase Dashboard

1. Supabase Dashboard → **Database** → **Backups**
2. Selecionar ponto de restauração
3. Seguir fluxo de restauração (pode criar novo projeto ou substituir)

---

## 4. Cenários de uso

| Cenário | Ação típica | Ref. |
|---------|-------------|------|
| **Corrupção de dados** | Identificar último backup válido; restaurar; validar; reativar. | disaster-recovery § Cenário 1 |
| **Perda de infraestrutura** | Provisionar nova infra; restaurar backup mais recente; reconfigurar env/DNS; reativar. | disaster-recovery § Cenário 2 |
| **Migration quebrou produção** | Rollback de migration; validar; corrigir e reaplicar quando seguro. | [rollback-procedure.md](./rollback-procedure.md) |

---

## 5. Checklist operacional

### Antes de incidente

- [ ] Backups automáticos configurados (Supabase e/ou Docker)
- [ ] Backups manuais regulares (ex.: semanal) e armazenados fora do ambiente prod
- [ ] Processo documentado e equipa conhece este doc
- [ ] Teste de restauração realizado pelo menos uma vez

### Durante restauração

- [ ] Identificar tipo de incidente e ponto de restauração
- [ ] Notificar utilizadores (manutenção/incidente)
- [ ] Executar restauro conforme secção 3
- [ ] Validar dados e funcionalidade crítica
- [ ] Reativar e comunicar fim da janela

### Após incidente

- [ ] Documentar incidente e causa raiz
- [ ] Atualizar procedimentos se necessário
- [ ] Revisar RTO/RPO e políticas de backup

---

## 6. Referências

- [disaster-recovery.md](./disaster-recovery.md) — Estratégia DR, RTO/RPO, cenários
- [rollback-procedure.md](./rollback-procedure.md) — Rollback de deploy/migrations
- [RUNBOOKS.md](./RUNBOOKS.md) — Índice de runbooks e alertas
- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)

---

*Documento vivo. Alterações em frequência, retenção ou comandos de backup devem ser reflectidas aqui.*
