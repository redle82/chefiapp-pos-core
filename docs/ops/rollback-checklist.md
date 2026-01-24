# ✅ Checklist de Rollback Rápido

**Versão:** 1.0  
**Data:** 2026-01-24  
**Uso:** Checklist de 1 página para execução rápida de rollback

---

## 🚨 ROLLBACK DE APP (Expo EAS)

### Antes
- [ ] Identificar problema crítico
- [ ] Confirmar necessidade de rollback
- [ ] Comunicar equipe

### Executar
- [ ] Listar releases: `eas update:list --channel production`
- [ ] Executar rollback: `eas update:rollback --channel production`
- [ ] Validar versão anterior ativa

### Depois
- [ ] Testar funcionalidades críticas
- [ ] Verificar Sentry (sem novos erros)
- [ ] Documentar rollback realizado

**Tempo estimado:** 5-10 minutos

---

## 🗄️ ROLLBACK DE MIGRATION (Supabase)

### Antes
- [ ] Identificar migration problemática
- [ ] Fazer backup do banco
- [ ] Comunicar equipe

### Executar
- [ ] Listar migrations: `supabase migration list`
- [ ] Executar rollback: `./scripts/rollback-migration.sh [version]`
- [ ] Validar estado do banco

### Depois
- [ ] Testar queries críticas
- [ ] Validar dados estão corretos
- [ ] Documentar rollback realizado

**Tempo estimado:** 5-10 minutos

---

## ⚡ COMANDOS RÁPIDOS

```bash
# Rollback de app
eas update:rollback --channel production

# Rollback de migration
./scripts/rollback-migration.sh

# Verificar estado
eas update:list --channel production
supabase migration list
```

---

## 📞 CONTATO

**Emergência:** [contato de emergência]  
**Documentação completa:** `docs/ops/rollback-procedure.md`

---

**Versão:** 1.0  
**Data:** 2026-01-24
