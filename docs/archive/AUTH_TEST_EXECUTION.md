# ⚡ Execução Rápida: Testes de Autenticação

**Tempo estimado**: 20-30 minutos  
**Modo**: Prático, sem ruído

---

## 🔹 Preparação (2 min)

1. Abrir app em **aba anônima** (sem sessões antigas)
2. Abrir **DevTools**:
   - Console (F12)
   - Network (para ver headers)
   - Application → Local Storage

---

## 1️⃣ Login com Google (5 min)

### O que fazer
1. Acessar `/app/login`
2. Clicar em **"Entrar com Google"**
3. Autorizar no Google

### O que verificar
- ✅ Tela do Google mostra **ChefIApp + logo**
- ✅ Permissões mínimas (email, nome, foto)
- ✅ Redirect correto para `/app/dashboard` ou `/bootstrap`

### Verificação rápida (Console)
```javascript
// Colar no console após login
const { data: { session } } = await supabase.auth.getSession()
console.log('✅ Sessão:', session ? 'VÁLIDA' : 'INVÁLIDA')
console.log('👤 Usuário:', session?.user?.email)
```

### ✅ Passa se
- Usuário entra sem erro
- `supabase.auth.getSession()` retorna sessão válida
- Redireciona corretamente

---

## 2️⃣ Proteção de Rotas (3 min)

### O que fazer
1. **Fazer logout** (se estiver logado)
2. Abrir diretamente: `http://localhost:5175/app/dashboard`
3. Verificar comportamento

### ✅ Passa se
- Redireciona para `/app/login`
- Não renderiza nada protegido
- URL muda para `/app/login`

### Verificação rápida
```javascript
// Verificar se está em login
console.log('📍 URL atual:', window.location.pathname)
console.log('🔒 Deve estar em /app/login:', window.location.pathname.includes('/login'))
```

---

## 3️⃣ Refresh de Página (3 min)

### O que fazer
1. Estar **logado**
2. Dar **⌘R** (Mac) ou **F5** (Windows/Linux)
3. Observar comportamento

### ✅ Passa se
- Continua logado
- Nenhum "flash" de login
- UI consistente (sem piscar)
- Não redireciona para login

### Verificação rápida
```javascript
// Após refresh, verificar sessão
const { data: { session } } = await supabase.auth.getSession()
console.log('✅ Sessão após refresh:', session ? 'MANTIDA' : 'PERDIDA')
```

---

## 4️⃣ Logout (3 min)

### O que fazer
1. Estar logado
2. Clicar em **Logout** (onde estiver disponível)
3. Verificar comportamento

### ✅ Passa se
- Volta para `/app/login`
- `supabase.auth.getSession()` → `null`
- Nenhuma rota protegida acessível

### Verificação rápida
```javascript
// Após logout
const { data: { session } } = await supabase.auth.getSession()
console.log('✅ Sessão após logout:', session ? 'AINDA EXISTE ❌' : 'REMOVIDA ✅')
console.log('📍 URL:', window.location.pathname)
```

---

## 5️⃣ RLS (5 min - CRÍTICO)

### O que fazer
1. **Com usuário A**:
   - Criar/listar dados (ex: tenant, tarefas, configurações)
   - Anotar IDs criados
2. **Fazer logout**
3. **Logar com usuário B** (outra conta Google)
4. **Tentar acessar** os mesmos dados

### ✅ Passa se
- Usuário B **não vê** dados de A
- Queries respeitam `auth.uid()`
- Erro 403 ou lista vazia (não erro 500)

### Verificação rápida
```javascript
// Com usuário B logado, tentar acessar dados
const { data: { session } } = await supabase.auth.getSession()
console.log('👤 Usuário atual:', session?.user?.id)

// Tentar query que deveria retornar dados do usuário A
// Se retornar vazio ou erro 403 → RLS funcionando ✅
```

---

## 🔍 Verificações Técnicas Finais (5 min)

### Local Storage

**Verificar**:
```javascript
// Colar no console
const keys = Object.keys(localStorage)
const supabaseKeys = keys.filter(k => k.startsWith('sb-'))
const legacyKeys = keys.filter(k => 
  k.includes('token') || 
  k.includes('session') || 
  k === 'x-chefiapp-token'
)

console.log('✅ Chaves Supabase:', supabaseKeys.length > 0 ? 'SIM' : 'NÃO')
console.log('❌ Chaves legacy:', legacyKeys.length > 0 ? legacyKeys : 'NENHUMA ✅')
```

**✅ Passa se**:
- Apenas chaves do Supabase (`sb-*`)
- Nenhum token customizado

---

### Network Tab

**Verificar**:
1. Abrir Network tab
2. Fazer uma requisição autenticada (ex: carregar dashboard)
3. Verificar headers da requisição

**✅ Passa se**:
- Header `Authorization: Bearer <supabase_jwt>` presente
- Token não é customizado

---

### Console

**Verificar**:
- ✅ Zero erros de auth
- ✅ Nenhum warning de "session mismatch"
- ✅ Nenhum erro 401/403 inesperado

**Script de verificação**:
```javascript
// Verificar erros no console
const errors = console.error.toString()
console.log('🔍 Verifique manualmente se há erros de auth no console')
```

---

## 🟢 Critério Final de Sucesso

### Checklist Mínima

- [ ] Login com Google funciona
- [ ] Rotas protegidas redirecionam quando não logado
- [ ] Refresh mantém sessão
- [ ] Logout remove sessão
- [ ] RLS funciona (usuário B não vê dados de A)
- [ ] Local Storage limpo (sem tokens legacy)
- [ ] Network requests usam token Supabase
- [ ] Console sem erros de auth

**Se todos passarem**:
- ✅ Autenticação está 100% correta
- ✅ Supabase é única fonte de verdade
- ✅ Não há conflito de sessão
- ✅ Sistema pronto para limpeza final

---

## 📋 Template de Relatório Mínimo

```markdown
## Teste de Autenticação - [DATA]

### Resultados

1. Login Google: [✅ PASSOU / ❌ FALHOU]
2. Proteção Rotas: [✅ PASSOU / ❌ FALHOU]
3. Refresh: [✅ PASSOU / ❌ FALHOU]
4. Logout: [✅ PASSOU / ❌ FALHOU]
5. RLS: [✅ PASSOU / ❌ FALHOU]
6. Local Storage: [✅ LIMPO / ❌ TEM LEGACY]
7. Network: [✅ TOKEN SUPABASE / ❌ TOKEN CUSTOM]
8. Console: [✅ SEM ERROS / ❌ TEM ERROS]

### Problemas Encontrados
[lista de problemas, se houver]

### Veredito
[✅ APROVADO / ❌ REQUER CORREÇÕES]
```

---

## 🔧 Próximo Passo (Após Testes)

**Se todos passarem**:
→ Prosseguir para **Limpeza Final de Tokens Customizados**

**Se algum falhar**:
→ Documentar problema e corrigir antes de continuar

---

## ⚡ Scripts Rápidos (Copiar/Colar)

### Verificar Sessão Atual
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Sessão:', session ? '✅ VÁLIDA' : '❌ INVÁLIDA')
console.log('Usuário:', session?.user?.email || 'Nenhum')
console.log('User ID:', session?.user?.id || 'Nenhum')
```

### Verificar Local Storage
```javascript
const legacy = ['x-chefiapp-token', 'chefiapp_session_token', 'chefiapp_internal_token']
const found = legacy.filter(k => localStorage.getItem(k))
console.log('Tokens legacy:', found.length > 0 ? `❌ ${found.join(', ')}` : '✅ NENHUM')
```

### Verificar Auth State
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session ? '✅ ATIVA' : '❌ INATIVA')
})
```

---

**Tempo total**: 20-30 minutos  
**Foco**: Execução prática, sem teoria

