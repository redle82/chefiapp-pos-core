# ANTI-SUPABASE AGGRESSIVE CHECKLIST

> **STATUS:** ENFORCED (Docker Core Sovereignty)
> **OBJECTIVE:** Prevent any leakage of financial/critical domain logic to Supabase.

## The Rule

**"Nenhuma escrita ou leitura de domínios financeiros (Orders, Stock, Fiscal, Billing) passa pelo client do Supabase."**

Todo o acesso a estes dados deve ser feito exclusivamente via:

- **Docker Core API** (em produção/dev)
- **Shim mocks** (apenas se absolutamente necessário e fora de produção)

## Automated Check

Temos um script de verificação que corre em CI/CD e localmente:

```bash
node scripts/check-supabase-violations.cjs
```

Este script falha se encontrar:

- `supabase.from('gm_orders')`
- `supabase.from('gm_inventory_*')`
- `supabase.from('fiscal_*')`
- ... e outras tabelas críticas.

### Como Corrigir uma Violação

Se o script falhar:

1. **NÃO use Supabase.**
2. Use os `Readers` ou `Writers` do Core Boundary (`src/core-boundary/`).
3. Se for um script de **Lab** ou **Legado** que _realmente_ precisa de acesso direto (e nunca vai correr em produção Docker):
   - Adicione o comentário no topo do ficheiro:
     ```typescript
     // LEGACY / LAB — blocked in Docker mode
     ```

## Approved Supabase Usage

Apenas permitido em:

- **Auth**: `useSupabaseAuth` (temporário até Core Auth).
- **Non-Critical Infra**: Logs, storage (se aplicável e não-financeiro).
- **Tests/Mocks**: Ficheiros de teste explícitos.
