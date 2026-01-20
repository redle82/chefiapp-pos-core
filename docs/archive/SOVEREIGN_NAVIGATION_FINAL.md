# 🔒 Sovereign Navigation — Documentação Final Consolidada

**Status:** `LOCKED & PROTECTED`  
**Data:** 2026-01-08  
**Versão:** 1.0.0 (IMMUTABLE)

---

## 🎯 RESUMO EXECUTIVO

Este documento consolida **toda a arquitetura de navegação soberana** do ChefIApp, desde a decisão estrutural até as proteções técnicas implementadas.

**O que foi resolvido:**
- ✅ Múltiplas autoridades concorrentes → **Uma única autoridade (FlowGate)**
- ✅ Múltiplos pontos de entrada → **Um único portal (/app)**
- ✅ Decisões difusas → **Lei única e explícita**
- ✅ Loops invisíveis → **Fluxo determinístico**
- ✅ Browser physics ignoradas → **window.open() síncrono, document.title definido**

**O que foi criado:**
- ✅ Single Entry Policy (política constitucional)
- ✅ ADR-001 (decisão arquitetural formal)
- ✅ Validação automática (script Python)
- ✅ Teste E2E (Playwright)
- ✅ CI Gate (proteção pré-commit)
- ✅ Documentação viva (este documento)

---

## 🧭 ARQUITETURA CONSTITUCIONAL

### A Lei Única

> **Existe UM único ponto de entrada no sistema.**  
> **Essa peça não é técnica, é constitucional.**

```
Landing Page (Marketing Puro)
        ↓
       /app (Portal Único)
        ↓
   FlowGate (Juiz Soberano)
        ↓
   Decisão Determinística
```

### Componentes e Responsabilidades

| Componente | Responsabilidade | NUNCA Faz |
|------------|------------------|-----------|
| **Landing Page** | Marketing puro. Aponta para `/app`. | Decide rotas, conhece OAuth, conhece estado |
| **`/app`** | Portal único de entrada. Neutro. | Renderiza UI própria, decide fluxo |
| **FlowGate** | Juiz único. Decide tudo baseado em auth + DB. | Ignora dados opcionais, permite múltiplas autoridades |
| **Login** | Inicia OAuth. Retorna para `/app`. | Decide fluxo, redireciona para `/bootstrap` |
| **Onboarding** | Executa wizard. Conclui → `/app/dashboard`. | É acessado diretamente, decide próximo passo |
| **Dashboard** | Hub central. Abre apps em novas abas. | Depende de apps para funcionar |
| **Apps** | Operacionais. Cada um em sua própria aba. | Dependem do Dashboard para existir |

---

## 📋 REGRAS IMUTÁVEIS

### 1. Single Entry Policy

**Regra:** Landing Page NUNCA pode linkar para `/login` ou `/onboarding`.

**Implementação:**
- Todos os CTAs → `/app`
- Validação automática: `npm run validate:single-entry`
- Script: `scripts/validate-single-entry-policy.py`

**Violação = Quebra Arquitetural**

### 2. FlowGate Soberania

**Regra:** FlowGate é a ÚNICA autoridade de navegação.

**Implementação:**
- `merchant-portal/src/core/flow/FlowGate.tsx`
- `merchant-portal/src/core/flow/CoreFlow.ts`
- Decisões baseadas apenas em:
  - ✅ `auth.user` (sessão Supabase)
  - ✅ `restaurant_members` (VIEW)
  - ✅ `gm_restaurants.onboarding_completed_at` (flag clara)

**Violação = Quebra Arquitetural**

### 3. Apps Multi-Aba

**Regra:** Apps operacionais abrem em novas abas via `window.open()` síncrono.

**Implementação:**
```typescript
// ✅ CORRETO
const handleNavigate = (path: string) => {
    const toolRoutes = ['/app/tpv', '/app/kds', '/app/menu', '/app/orders', '/app/staff'];
    if (toolRoutes.includes(path)) {
        window.open(path, '_blank', 'noopener,noreferrer');
        return;
    }
    navigate(path);
};
```

**Regra de Ouro:**
- ❌ Sem `await`
- ❌ Sem `navigate()` antes
- ❌ Sem lógica assíncrona no handler

**Violação = Popup Bloqueado**

### 4. Document Title

**Regra:** Cada app tem `document.title` único.

**Implementação:**
```typescript
useEffect(() => {
    document.title = 'ChefIApp POS — TPV'; // ou KDS, Menu, Orders, Staff
    return () => { document.title = 'ChefIApp POS'; };
}, []);
```

**Violação = Abas Indistinguíveis**

---

## 🛡️ PROTEÇÕES TÉCNICAS

### 1. Validação Automática

**Script:** `scripts/validate-single-entry-policy.py`

**Uso:**
```bash
npm run validate:single-entry
```

**Valida:**
- ✅ Nenhum link na landing aponta para `/login`
- ✅ Nenhum link na landing aponta para `/onboarding`
- ✅ Todos os links apontam para `/app`
- ✅ `getMerchantPortalUrl` nunca recebe `/login` ou `/onboarding`

### 2. Teste E2E

**Arquivo:** `merchant-portal/tests/e2e/sovereign-navigation.spec.ts`

**Uso:**
```bash
cd merchant-portal
npx playwright test tests/e2e/sovereign-navigation.spec.ts
```

**Valida:**
- ✅ Landing → `/app` → FlowGate → `/login`
- ✅ OAuth redireciona para `/app`
- ✅ Apps abrem em novas abas
- ✅ Refresh funciona em qualquer `/app/*`
- ✅ Página pública não requer auth
- ✅ `document.title` definido para cada app

### 3. CI Gate

**Script:** `scripts/ci-gate-sovereign-navigation.sh`

**Uso:**
```bash
./scripts/ci-gate-sovereign-navigation.sh
```

**Valida:**
- ✅ Single Entry Policy
- ✅ E2E Navigation Flow
- ✅ Lint Rules

**Integração CI/CD:**
```yaml
- name: Validate Sovereign Navigation
  run: ./scripts/ci-gate-sovereign-navigation.sh
```

### 4. ESLint Rule (Opcional)

**Arquivo:** `.eslintrc.landing-protection.js`

**Bloqueia:**
- `to="/login"` ou `to="/onboarding"`
- `href="/login"` ou `href="/onboarding"`
- `getMerchantPortalUrl('/login')` ou `getMerchantPortalUrl('/onboarding')`

---

## 🧪 FLUXO E2E COMPLETO

### Cenário 1: Novo Usuário

```
1. Landing Page (/) → Clica "Entrar em operação"
2. Navega para /app
3. FlowGate intercepta → Detecta !auth
4. Redireciona para /login
5. Usuário clica "Google OAuth"
6. OAuth redireciona para /app
7. FlowGate intercepta → Detecta auth + !restaurant
8. Redireciona para /onboarding/identity
9. Usuário completa onboarding
10. FlowGate intercepta → Detecta auth + restaurant + completed
11. Redireciona para /app/dashboard
12. Usuário clica em "TPV"
13. TPV abre em nova aba (/app/tpv)
```

### Cenário 2: Usuário Existente

```
1. Landing Page (/) → Clica "Já tenho conta"
2. Navega para /app
3. FlowGate intercepta → Detecta !auth
4. Redireciona para /login
5. Usuário clica "Google OAuth"
6. OAuth redireciona para /app
7. FlowGate intercepta → Detecta auth + restaurant + completed
8. Redireciona para /app/dashboard
```

### Cenário 3: Refresh Direto

```
1. Usuário acessa /app/tpv diretamente (refresh ou bookmark)
2. FlowGate intercepta → Detecta auth + restaurant + completed
3. Permite acesso (ALLOW)
4. TPV carrega normalmente
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Antes de Commit

- [ ] `npm run validate:single-entry` passa
- [ ] Nenhum link na landing aponta para `/login`
- [ ] Nenhum link na landing aponta para `/onboarding`
- [ ] Todos os CTAs apontam para `/app`
- [ ] OAuth redireciona para `/app` (não `/bootstrap`)
- [ ] Apps usam `window.open()` síncrono
- [ ] Cada app tem `document.title` definido

### Antes de Merge

- [ ] `./scripts/ci-gate-sovereign-navigation.sh` passa
- [ ] Teste E2E passa (se servidor estiver rodando)
- [ ] Lint passa (se configurado)
- [ ] Documentação atualizada

---

## 🚨 VIOLAÇÕES E CORREÇÕES

### Violação 1: Link Direto para `/login`

**Sintoma:** Landing tem `<Link to="/login">`

**Correção:**
```tsx
// ❌ ERRADO
<Link to="/login">Entrar</Link>

// ✅ CORRETO
<Link to="/app">Entrar</Link>
```

### Violação 2: OAuth Redireciona para `/bootstrap`

**Sintoma:** Após OAuth, usuário vai para `/bootstrap` em vez de `/app`

**Correção:**
```typescript
// ❌ ERRADO
const redirectUrl = `${baseUrl}/bootstrap`;

// ✅ CORRETO
const redirectUrl = `${baseUrl}/app`;
```

### Violação 3: App Não Abre em Nova Aba

**Sintoma:** Clicar em app não abre nova aba

**Correção:**
```typescript
// ❌ ERRADO
await navigate(path);
window.open(path, '_blank');

// ✅ CORRETO
window.open(path, '_blank', 'noopener,noreferrer');
```

### Violação 4: App Sem `document.title`

**Sintoma:** Aba não tem título identificável

**Correção:**
```typescript
// ✅ ADICIONAR
useEffect(() => {
    document.title = 'ChefIApp POS — TPV'; // ou KDS, Menu, Orders, Staff
    return () => { document.title = 'ChefIApp POS'; };
}, []);
```

---

## 📚 REFERÊNCIAS

### Documentos Principais

1. **ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md**
   - Decisão arquitetural formal
   - Contexto, análise, consequências

2. **SINGLE_ENTRY_POLICY.md**
   - Política constitucional
   - Regras imutáveis
   - Checklist de validação

3. **E2E_SOVEREIGN_NAVIGATION_VALIDATION.md**
   - Validação completa do fluxo
   - Status de implementação
   - Ações necessárias

4. **ARCHITECTURE_FLOW_LOCKED.md**
   - Implementação técnica
   - Código de referência
   - Proteções contra regressão

5. **CANON.md**
   - Law 0: Navigation Sovereignty
   - Leis imutáveis do sistema

### Scripts

- `scripts/validate-single-entry-policy.py` — Validação automática
- `scripts/ci-gate-sovereign-navigation.sh` — CI Gate
- `merchant-portal/tests/e2e/sovereign-navigation.spec.ts` — Teste E2E

---

## ✅ STATUS FINAL

**Progresso:** 100% completo

**Proteções Implementadas:**
- ✅ Single Entry Policy (validação automática)
- ✅ FlowGate Soberania (código + documentação)
- ✅ Apps Multi-Aba (window.open síncrono)
- ✅ Document Title (todos os apps)
- ✅ Teste E2E (Playwright)
- ✅ CI Gate (proteção pré-commit)
- ✅ Documentação Consolidada (este documento)

**Sistema Status:** 🔒 **LOCKED & PROTECTED**

---

## 🎯 PRÓXIMOS PASSOS (OPCIONAL)

1. **Integrar CI Gate ao GitHub Actions**
   ```yaml
   - name: Validate Sovereign Navigation
     run: ./scripts/ci-gate-sovereign-navigation.sh
   ```

2. **Adicionar ESLint Rule ao projeto**
   - Configurar `.eslintrc.landing-protection.js`
   - Adicionar ao `merchant-portal/eslint.config.js`

3. **Expandir Teste E2E**
   - Adicionar testes de OAuth real
   - Adicionar testes de onboarding completo
   - Adicionar testes de refresh em todos os apps

---

**Última Atualização:** 2026-01-08  
**Versão:** 1.0.0 (IMMUTABLE)  
**Mantenedor:** Arquitetura Core

---

> **"Quando um sistema dói demais, não é porque falta código. É porque falta soberania. Agora tem."**
