# TPV - Validação Rápida (5 minutos)

**Objetivo**: Validar se migrations foram aplicadas e sistema está blindado

---

## 🚀 EXECUÇÃO RÁPIDA

### Opção 1: Script Automático (Recomendado)

```bash
npm run validate:tpv
```

**Resultado**:
- ✅ **GO**: Todas as proteções ativas
- 🔴 **NO-GO**: Migrations não aplicadas ou bloqueadores encontrados

---

### Opção 2: Manual (SQL + UI)

#### 1. Verificar Migrations (1 min)

```bash
supabase migration list
```

**Esperado**: Ver `072_payment_security.sql` e `073_cash_register_validation.sql` como aplicadas

#### 2. Verificar Constraints (2 min)

Execute no Supabase SQL Editor:

```sql
-- Deve retornar 1 linha
SELECT conname FROM pg_constraint 
WHERE conname = 'uq_one_paid_payment_per_order';

-- Deve retornar 1 linha
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'gm_payments' AND column_name = 'idempotency_key';
```

#### 3. Teste Rápido UI (2 min)

1. Abrir `/app/tpv`
2. Tentar criar order **SEM** abrir caixa
3. **Esperado**: Erro ou botão desabilitado

---

## ✅ VEREDITO

**Se script retornar GO**: Sistema pronto para operação assistida  
**Se script retornar NO-GO**: Aplicar migrations primeiro (`supabase db push`)

---

**FIM**

