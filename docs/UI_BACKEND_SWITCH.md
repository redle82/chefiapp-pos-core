# Como a UI Troca de Backend (Supabase → Docker Core)

**Objetivo:** Documentar como a UI troca de Supabase para Docker Core sem mudar código.

---

## 🎯 Princípio Fundamental

**A UI não sabe se o backend é Supabase, Docker ou Marte.**

Ela só fala com:
- ✅ RPCs (`create_order_atomic`)
- ✅ Eventos (Realtime)
- ✅ Estado do restaurante

---

## 🔧 Configuração Atual

### Merchant Portal

**Arquivo:** `merchant-portal/src/core/supabase/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../../config'

export const supabase = createClient<Database>(
  CONFIG.SUPABASE_URL, 
  CONFIG.SUPABASE_ANON_KEY
)
```

**Arquivo:** `merchant-portal/src/config.ts`

```typescript
export const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '...',
  // ...
}
```

---

## 🔄 Como Trocar de Backend

### Opção 1: Trocar Variáveis de Ambiente (Recomendado)

**Antes (Supabase local):**
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Depois (Docker Core):**
```env
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

**Isso é tudo.** A UI continua funcionando porque:
- ✅ PostgREST expõe RPCs da mesma forma
- ✅ Realtime funciona igual
- ✅ Contratos são os mesmos

---

### Opção 2: Criar Adapter (Se Necessário)

Se PostgREST precisar de ajustes, criar adapter:

**Arquivo:** `merchant-portal/src/core/backend/BackendAdapter.ts`

```typescript
interface BackendAdapter {
  rpc(functionName: string, params: any): Promise<any>;
  from(table: string): QueryBuilder;
  channel(channel: string): RealtimeChannel;
}

class PostgRESTAdapter implements BackendAdapter {
  // Implementação usando PostgREST diretamente
}

class SupabaseAdapter implements BackendAdapter {
  // Implementação usando Supabase client
}

// Factory
export function createBackendAdapter(): BackendAdapter {
  const url = CONFIG.SUPABASE_URL;
  
  if (url.includes('localhost:3001')) {
    return new PostgRESTAdapter();
  } else {
    return new SupabaseAdapter();
  }
}
```

**Nota:** Isso só é necessário se houver diferenças significativas. Na prática, PostgREST e Supabase são compatíveis.

---

## 📊 Compatibilidade

### O Que Funciona Igual

| Funcionalidade | Supabase | Docker Core | Compatível? |
|----------------|----------|-------------|-------------|
| RPC `create_order_atomic` | ✅ | ✅ | ✅ Sim |
| Realtime subscriptions | ✅ | ✅ | ✅ Sim |
| Queries `.from()` | ✅ | ✅ | ✅ Sim |
| `.insert()`, `.update()` | ✅ | ✅ | ✅ Sim |

### O Que Pode Diferir

| Funcionalidade | Supabase | Docker Core | Nota |
|----------------|----------|-------------|------|
| Auth (OAuth) | ✅ | ❌ | Core Docker não tem auth (por enquanto) |
| RLS Policies | ✅ | ❌ | Core é authoritative, não precisa RLS |
| Storage | ✅ | ❌ | Não usado pelo Core |

---

## 🧪 Teste de Troca

### 1. Subir Docker Core

```bash
cd docker-core
docker compose -f docker-compose.core.yml up -d
```

### 2. Atualizar `.env`

```env
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long
```

### 3. Reiniciar Merchant Portal

```bash
cd merchant-portal
npm run dev
```

### 4. Validar

- ✅ TPV cria pedidos
- ✅ KDS recebe via Realtime
- ✅ Dashboard mostra estado
- ✅ Constraints funcionam

---

## 🚨 Troubleshooting

### Erro: "Cannot connect to Supabase"

**Causa:** URL errada ou PostgREST não está rodando

**Solução:**
```bash
# Verificar PostgREST
docker compose -f docker-core/docker-compose.core.yml ps

# Ver logs
docker compose -f docker-core/docker-compose.core.yml logs postgrest

# Testar endpoint
curl http://localhost:3001
```

### Erro: "RPC not found"

**Causa:** Schema não foi aplicado

**Solução:**
```bash
# Resetar e aplicar schema
docker compose -f docker-core/docker-compose.core.yml down -v
docker compose -f docker-core/docker-compose.core.yml up -d
```

### Realtime não funciona

**Causa:** Realtime não está rodando ou URL errada

**Solução:**
```bash
# Verificar Realtime
docker compose -f docker-core/docker-compose.core.yml logs realtime

# Verificar se porta 4000 está aberta
curl http://localhost:4000/health
```

---

## ✅ Checklist de Migração

- [ ] Docker Core rodando (`docker compose ps`)
- [ ] PostgREST respondendo (`curl http://localhost:3000`)
- [ ] Realtime respondendo (`curl http://localhost:4000/health`)
- [ ] `.env` atualizado com URLs corretas
- [ ] Merchant Portal reiniciado
- [ ] TPV cria pedidos
- [ ] KDS recebe pedidos
- [ ] Dashboard mostra estado
- [ ] Constraints funcionam

---

*"A UI não precisa saber. Ela só precisa da URL correta."*
