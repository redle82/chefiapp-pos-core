# CORE BOUNDARY

**Fronteira explícita entre Core validado e UI.**

## Regras Absolutas

1. **Nada dentro do Core pode depender de UI**
2. **Nada dentro do Core pode ter lógica visual**
3. **Tudo dentro do Core é testável independentemente**

## Estrutura

```
core-boundary/
├── README.md (este arquivo)
├── docker-core/
│   ├── connection.ts          # Conexão com Docker Core (PostgREST)
│   └── types.ts               # Tipos TypeScript do Core
├── rpcs/
│   ├── create_order_atomic.ts # Wrapper para RPC create_order_atomic
│   ├── process_order_payment.ts
│   └── open_cash_register_atomic.ts
└── contracts/
    ├── OrderContract.ts       # Contrato de dados para pedidos
    └── TableContract.ts        # Contrato de dados para mesas
```

## Schema Congelado

O schema do Core está congelado e documentado em:
- `docker-core/schema/` (se existir)
- `docs/CORE_FROZEN_STATUS.md`

## RPCs Validados

Todos os RPCs validados estão documentados e não podem ser modificados sem aprovação explícita.

## Uso

```typescript
// ✅ CORRETO: UI usa Core via boundary
import { createOrder } from '@/core-boundary/rpcs/create_order_atomic';
import type { OrderContract } from '@/core-boundary/contracts/OrderContract';

// ❌ ERRADO: UI acessa PostgREST diretamente sem boundary
import { supabase } from '@/core/supabase';
supabase.from('gm_orders').insert(...);
```
