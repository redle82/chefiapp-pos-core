# TPV - Checklist de Deploy

**Data**: 2025-01-27  
**Status**: ✅ **PRONTO PARA DEPLOY**

---

## ✅ PRÉ-DEPLOY

- [x] Migrations SQL criadas
- [x] Código TypeScript implementado
- [x] Documentação completa
- [x] Sem erros de lint
- [x] Componentes exportados corretamente

---

## 🚀 DEPLOY

### 1. Aplicar Migrations

```bash
# Via Supabase CLI
supabase db push

# OU via Dashboard SQL Editor
# Executar: 072_payment_security.sql
# Executar: 073_cash_register_validation.sql
```

### 2. Verificar Migrations

```sql
-- Verificar constraints
SELECT conname FROM pg_constraint 
WHERE conname = 'uq_one_paid_payment_per_order';

-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name LIKE 'tr_validate%';
```

### 3. Testar Fluxo Básico

- [ ] Abrir caixa
- [ ] Criar pedido
- [ ] Adicionar items
- [ ] Processar pagamento
- [ ] Fechar caixa

---

## ✅ PÓS-DEPLOY

- [ ] Testes de stress
- [ ] Validação de proteções
- [ ] Monitoramento de erros

---

**FIM**

