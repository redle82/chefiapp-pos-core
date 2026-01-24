# 🧪 Checklist de Testes: Autenticação Unificada

**Objetivo**: Validar que Supabase Auth está funcionando como única fonte de verdade.

**Prioridade**: 🔴 **MÁXIMA** (antes de qualquer limpeza adicional)

---

## ✅ Testes Básicos (Obrigatórios)

### 1. Login com Google

**Passos**:
1. Acessar `/login` ou `/auth`
2. Clicar em "Entrar com Google"
3. Completar OAuth no Google
4. Verificar redirecionamento para `/bootstrap` ou `/app/dashboard`

**Resultado esperado**:
- ✅ Redireciona corretamente após OAuth
- ✅ Sessão criada no Supabase
- ✅ Usuário aparece logado no app

**Como verificar**:
```javascript
// No console do navegador
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('User:', session?.user)
```

---

### 2. Proteção de Rotas (RequireAuth)

**Passos**:
1. Estar logado
2. Acessar rota protegida: `/app/dashboard`
3. Verificar que página carrega normalmente

**Teste negativo**:
1. Fazer logout
2. Tentar acessar `/app/dashboard` diretamente
3. Verificar redirecionamento para `/login`

**Resultado esperado**:
- ✅ Rotas protegidas só acessíveis com sessão válida
- ✅ Redireciona para login quando não autenticado

---

### 3. Refresh de Página (Persistência)

**Passos**:
1. Estar logado
2. Recarregar página (F5)
3. Verificar que usuário continua logado

**Resultado esperado**:
- ✅ Sessão persiste após refresh
- ✅ Não redireciona para login
- ✅ Estado de autenticação mantido

**Como verificar**:
- Abrir DevTools → Application → Local Storage
- Verificar que Supabase mantém sessão automaticamente
- Não deve haver `x-chefiapp-token` (sistema legacy)

---

### 4. Logout

**Passos**:
1. Estar logado
2. Clicar em logout (onde estiver disponível)
3. Verificar redirecionamento

**Resultado esperado**:
- ✅ Sessão removida do Supabase
- ✅ Redireciona para `/login` ou `/`
- ✅ Rotas protegidas não acessíveis

**Como verificar**:
```javascript
// Após logout
const { data: { session } } = await supabase.auth.getSession()
console.log('Session after logout:', session) // Deve ser null
```

---

### 5. Expiração de Sessão (Opcional)

**Passos**:
1. Estar logado
2. Aguardar expiração (ou forçar manualmente)
3. Tentar acessar rota protegida

**Resultado esperado**:
- ✅ Supabase renova token automaticamente
- ✅ Se expirar, redireciona para login
- ✅ Não fica em estado "meio logado"

**Como forçar teste**:
```javascript
// No console
await supabase.auth.signOut()
// Depois tentar acessar rota protegida
```

---

### 6. RLS (Row Level Security)

**Passo crítico**: Verificar que RLS funciona com `auth.uid()`

**Como testar**:
1. Estar logado como usuário A
2. Tentar acessar dados que pertencem a usuário B
3. Verificar que acesso é negado

**Resultado esperado**:
- ✅ RLS bloqueia acesso não autorizado
- ✅ `auth.uid()` retorna ID correto do usuário logado
- ✅ Queries respeitam políticas de segurança

**Query de teste**:
```sql
-- No Supabase SQL Editor
SELECT auth.uid() as current_user_id;
-- Deve retornar o ID do usuário logado
```

---

## 🔍 Verificações Técnicas (DevTools)

### Console do Navegador

**Verificar**:
- ✅ Sem erros de autenticação
- ✅ Sem avisos sobre tokens customizados
- ✅ Logs de `[Auth] User signed in` aparecem (dev mode)

**Comandos úteis**:
```javascript
// Ver sessão atual
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)

// Ver usuário
console.log('Current user:', session?.user)

// Verificar se há tokens legacy
console.log('Legacy token:', localStorage.getItem('x-chefiapp-token')) // Deve ser null
```

---

### Application → Local Storage

**Verificar**:
- ✅ Supabase mantém sessão automaticamente
- ❌ Não deve haver `x-chefiapp-token` (sistema legacy)
- ❌ Não deve haver `chefiapp_session_token` (legacy)
- ✅ Pode haver `chefiapp_demo_mode` (se em modo demo)

---

### Network Tab

**Verificar**:
- ✅ Requisições incluem header `Authorization: Bearer <token>`
- ✅ Token vem do Supabase (não customizado)
- ✅ Sem erros 401/403 em requisições autenticadas

---

## 🚨 Problemas Conhecidos a Verificar

### 1. Conflito de Sessão

**Sintoma**: Usuário logado mas app pensa que não está

**Como verificar**:
```javascript
// No console
const supabaseSession = await supabase.auth.getSession()
const legacyToken = localStorage.getItem('x-chefiapp-token')

console.log('Supabase session:', supabaseSession.data.session)
console.log('Legacy token:', legacyToken)

// Se legacyToken existe mas session não → CONFLITO
```

**Solução**: Remover tokens legacy (Passo 2)

---

### 2. Redirecionamento Loop

**Sintoma**: Fica redirecionando entre `/login` e `/app`

**Causa possível**: `RequireAuth` não detecta sessão corretamente

**Como verificar**:
- Abrir DevTools → Network
- Verificar se há loop de requisições
- Verificar logs no console

---

### 3. Token Não Renovado

**Sintoma**: Sessão expira e não renova automaticamente

**Como verificar**:
```javascript
// Verificar refresh automático
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

---

## ✅ Critérios de Sucesso

### Todos os testes devem passar:

- [ ] Login com Google funciona
- [ ] Rotas protegidas funcionam (RequireAuth)
- [ ] Refresh de página mantém sessão
- [ ] Logout funciona corretamente
- [ ] RLS funciona com auth.uid()
- [ ] Sem tokens legacy no localStorage
- [ ] Sem erros no console
- [ ] Sem loops de redirecionamento

---

## 📋 Template de Relatório

```markdown
## Teste de Autenticação - [DATA]

### Ambiente
- Navegador: [Chrome/Firefox/Safari]
- URL: [local/prod]
- Usuário de teste: [email]

### Resultados

#### Login com Google
- [ ] ✅ Passou
- [ ] ❌ Falhou: [descrição]

#### Proteção de Rotas
- [ ] ✅ Passou
- [ ] ❌ Falhou: [descrição]

#### Refresh de Página
- [ ] ✅ Passou
- [ ] ❌ Falhou: [descrição]

#### Logout
- [ ] ✅ Passou
- [ ] ❌ Falhou: [descrição]

#### RLS
- [ ] ✅ Passou
- [ ] ❌ Falhou: [descrição]

### Problemas Encontrados
1. [descrição do problema]
2. [descrição do problema]

### Observações
[notas adicionais]
```

---

## 🎯 Próximo Passo

**Se todos os testes passarem**:
→ Prosseguir para **Passo 2: Limpeza de Tokens Customizados**

**Se algum teste falhar**:
→ Documentar problema e corrigir antes de continuar

---

**Tempo estimado**: 15-20 minutos  
**Prioridade**: 🔴 MÁXIMA

