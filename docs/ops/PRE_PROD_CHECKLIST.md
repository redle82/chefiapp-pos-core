# Checklist obrigatório antes de produção

**Uso:** Preencher antes de cada deploy para produção (ex.: antes de criar tag `v*` ou executar pipeline de release).

---

## Antes de cada deploy

- [ ] **Migration testada em staging com dump real**  
  Migrations aplicadas em ambiente de staging (ou cópia anónima de prod). Sem erros. Comando: conforme stack (Supabase `supabase db push` em projeto staging; Docker Core `make migrate-*` em staging).

- [ ] **Backup automatizado antes do deploy**  
  Backup da base de dados de produção executado (Supabase Dashboard / pg_dump / script interno). Retenção e localização conhecidas. Ver [BACKUP_RESTORE.md](./BACKUP_RESTORE.md).

- [ ] **Script de rollback documentado e testado**  
  Procedimento de rollback conhecido e, quando possível, testado em staging. Ver [rollback-procedure.md](./rollback-procedure.md) e [scripts/rollback-migration.sh](../../scripts/rollback-migration.sh).

- [ ] **Healthcheck pós-deploy**  
  Após deploy, validar que frontend e API respondem (HTTP 200 ou 302 conforme esperado). Em CI: job "Smoke Test" no [deploy workflow](../../.github/workflows/deploy.yml). Manual: [scripts/ops/healthcheck-post-deploy.sh](../../scripts/ops/healthcheck-post-deploy.sh) com URLs de prod.

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy e provisioning |
| [rollback-procedure.md](./rollback-procedure.md) | Rollback app e migrations |
| [rollback-checklist.md](./rollback-checklist.md) | Checklist rápido de rollback |
| [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) | Backup e restauro |
