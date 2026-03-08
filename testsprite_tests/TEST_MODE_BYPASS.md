# 🧪 TEST_MODE Bypass - Documentação de Segurança

**Data:** 2026-01-13  
**Status:** ✅ Implementado e Seguro

---

## 🎯 Objetivo

Permitir que ferramentas de teste automatizado (TestSprite) exercitem o core do sistema sem implementar o fluxo completo de Magic Link, mantendo segurança total em produção.

---

## 🔒 Garantias de Segurança

O bypass **NÃO funciona** se:
- ❌ `NODE_ENV=production` (desabilitado em produção)
- ❌ `TEST_MODE` não está explicitamente definido como `'true'`
- ❌ Token real está presente (sempre prioriza token real)

O bypass **SÓ funciona** quando:
- ✅ `TEST_MODE=true` explicitamente
- ✅ `NODE_ENV !== 'production'`
- ✅ Header `x-chefiapp-token` ausente

---

## 🚀 Como Ativar (Apenas para Testes)

### Opção 1: Variável de Ambiente

```bash
export TEST_MODE=true
npm run server:web-module
```

### Opção 2: Arquivo .env (Desenvolvimento)

```bash
# .env (NUNCA commitar em produção)
TEST_MODE=true
NODE_ENV=development
```

### Opção 3: Inline (Temporário)

```bash
TEST_MODE=true npm run server:web-module
```

---

## 📋 Comportamento

Quando ativo:
- ✅ Requisições sem `x-chefiapp-token` são aceitas
- ✅ Token de teste `TEST_SESSION_BYPASS` é injetado automaticamente
- ✅ Logs indicam `[TEST MODE] Authentication bypass active`
- ✅ Core pode ser testado sem implementar Magic Link

Quando inativo (padrão):
- ❌ Requisições sem token retornam `401 SESSION_REQUIRED`
- ✅ Comportamento de produção normal

---

## ⚠️ Avisos Importantes

1. **NUNCA** commitar `.env` com `TEST_MODE=true` em produção
2. **NUNCA** definir `TEST_MODE=true` em `NODE_ENV=production`
3. **SEMPRE** verificar que o bypass está desabilitado antes de deploy

---

## 🧪 Validação

Para verificar se o bypass está funcionando:

```bash
# Com TEST_MODE=true
curl -X POST http://localhost:4320/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[]}'
# Deve retornar 201 (não 401)

# Sem TEST_MODE
curl -X POST http://localhost:4320/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[]}'
# Deve retornar 401 SESSION_REQUIRED
```

---

## 📄 Código Fonte

Implementação: `server/web-module-api-server.ts` (linha 171-186)

```typescript
function isSessionAuthorized(req: http.IncomingMessage): string | null {
  const token = String(req.headers['x-chefiapp-token'] || '').trim();
  
  // TEST MODE BYPASS: Only active when TEST_MODE=true explicitly set
  if (!token && process.env.TEST_MODE === 'true' && process.env.NODE_ENV !== 'production') {
    const testToken = 'TEST_SESSION_BYPASS';
    console.log('[TEST MODE] Authentication bypass active for automated testing');
    return testToken;
  }
  
  if (!token) return null;
  return token;
}
```

---

**Última Atualização:** 2026-01-13  
**Autor:** Core Team  
**Status:** ✅ Pronto para uso em desenvolvimento/testes
