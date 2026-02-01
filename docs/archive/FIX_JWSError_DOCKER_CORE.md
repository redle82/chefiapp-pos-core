**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# Fix: JWSError e WebSocket 431 no Docker Core Client

**Data:** 2026-01-26  
**Status:** ✅ CORRIGIDO (HTTP) | ⚠️ WebSocket ainda com problema

---

## 🎯 Problema

Erro ao tentar ler pedidos via `dockerCoreClient`:

```
Erro: Failed to read orders: JWSError (CompactDecodeError Invalid number of parts: Expected 3 parts; got 1)
```

**Ocorre em:**
- `/garcom` (AppStaff)
- `/kds-minimal` (KDS)

**Erros:**
1. **HTTP 401 Unauthorized**: Cliente Supabase adiciona `Authorization: Bearer <JWT>` automaticamente
2. **WebSocket 431 (Request Header Fields Too Large)**: Cliente Supabase envia JWT malformado no handshake

**Causa:**
- Cliente Supabase está tentando validar JWT quando não deveria
- Docker Core não usa JWT para autenticação (apenas `apikey`)
- PostgREST tem `PGRST_JWT_SECRET` configurado, mas é apenas para uso interno
- WebSocket do Supabase não respeita `noOpStorage` e tenta enviar JWT no handshake

---

## ✅ Solução Aplicada

### 1. Storage Customizado (noOpStorage)

Criado storage que sempre retorna `null` para evitar que o cliente Supabase tente ler tokens do localStorage:

```typescript
const noOpStorage: Storage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  get length() { return 0; },
  key: (_index: number) => null,
};
```

### 2. Fetch Customizado (Remove Authorization Header)

**CRÍTICO:** O cliente Supabase adiciona automaticamente `Authorization: Bearer <token>` em todas as requisições. Precisamos interceptar e remover esse header:

```typescript
const customFetch: typeof fetch = async (input, init = {}) => {
  const headers = new Headers(init.headers);
  
  // CRÍTICO: Remover Authorization header (JWT)
  headers.delete('Authorization');
  headers.delete('authorization');
  
  // Garantir apikey
  if (!headers.has('apikey')) {
    headers.set('apikey', DOCKER_CORE_ANON_KEY);
  }
  
  return fetch(input, { ...init, headers });
};
```

### 3. Configuração do Cliente

```typescript
export const dockerCoreClient = createClient(DOCKER_CORE_URL, DOCKER_CORE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: noOpStorage, // ✅ Sempre retorna null
    storageKey: 'docker-core-no-auth',
  },
  global: {
    headers: {
      'apikey': DOCKER_CORE_ANON_KEY, // ✅ Apenas apikey, sem JWT
    },
    fetch: customFetch, // ✅ Intercepta e remove Authorization
  },
});
```

---

## 🔍 Verificações Necessárias

1. **Limpar localStorage** (se houver tokens antigos):
   ```javascript
   // No console do navegador
   localStorage.removeItem('sb-localhost-auth-token');
   localStorage.removeItem('supabase.auth.token');
   ```

2. **Verificar se PostgREST está rodando**:
   ```bash
   curl http://localhost:3001/rest/v1/ -H "apikey: chefiapp-core-secret-key-min-32-chars-long"
   ```

3. **Testar leitura direta**:
   ```bash
   curl "http://localhost:3001/rest/v1/gm_orders?select=*&limit=1" \
     -H "apikey: chefiapp-core-secret-key-min-32-chars-long"
   ```

---

## ⚠️ Problema do WebSocket (431) - RESOLVIDO TEMPORARIAMENTE

O fetch customizado **não intercepta conexões WebSocket**. O cliente Supabase ainda tenta enviar JWT no handshake do WebSocket, causando erro 431.

**Solução aplicada:**
- ✅ **Realtime completamente desabilitado** em todos os componentes
- ✅ **Polling (30s)** como única forma de atualização de pedidos
- ✅ **Timer atualizado para 10s** para feedback visual mais responsivo
- ✅ **Sem tentativas de conexão WebSocket** = sem erros 431 no console

**Nota importante:**
- O polling carrega novos pedidos a cada 30s
- O timer visual atualiza a cada 10s para mostrar tempo decorrido corretamente
- Sem realtime, novos pedidos aparecem com até 30s de delay (aceitável para MVP)

**Componentes atualizados:**
- `KDSMinimal.tsx` - Realtime desabilitado, apenas polling
- `MiniKDSMinimal.tsx` - Realtime desabilitado, apenas polling
- `LiveRosterWidget.tsx` - Realtime desabilitado, apenas polling
- `connection.ts` - Configuração de realtime removida

**Solução permanente (TODO):**
- Implementar conexão WebSocket customizada sem JWT
- Ou aguardar fix do `supabase-js` para suportar `apikey`-only no WebSocket
- Ou usar biblioteca WebSocket alternativa (Phoenix/Elixir client)

---

## 📝 Notas

- O `PGRST_JWT_SECRET` no PostgREST é necessário para funcionamento interno, mas não significa que JWT é obrigatório
- O cliente Supabase não deve tentar validar JWT quando `persistSession: false` e `storage: noOpStorage`
- **HTTP funciona** com fetch customizado removendo `Authorization` header
- **WebSocket ainda falha** porque não passa pelo fetch customizado
- Se o erro persistir, pode ser necessário limpar localStorage manualmente

---

## ✅ Status Atual

- ✅ **HTTP (PostgREST)**: Funcionando com fetch customizado
- ✅ **WebSocket (Realtime)**: Desabilitado completamente (sem tentativas = sem erros)
- ✅ **Polling (30s)**: Funcionando como método principal de atualização
- ✅ **Console limpo**: Sem erros 431 repetidos

---

**Última atualização:** 2026-01-26
