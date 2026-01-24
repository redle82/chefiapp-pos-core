# 🔒 ARQUITETURA DE FLUXO — LOCKED

**Status:** `E2E_FLOW = LOCKED`  
**Data de Selamento:** 2026-01-08  
**Autoridade Única:** `FlowGate`  
**Ponto de Entrada:** `/app`

---

## 🎯 REGRA DE OURO (IMUTÁVEL)

**Landing = Marketing**  
**`/app` = Cérebro**  
**FlowGate = Juiz**

---

## 📐 ARQUITETURA CANÔNICA

```
┌─────────────┐
│   Landing   │  ← Marketing puro. Zero lógica de fluxo.
│     (/)     │
└──────┬──────┘
       │
       │ href="/app"
       ↓
┌─────────────┐
│     /app    │  ← Ponto de entrada único. Portal neutro.
└──────┬──────┘
       │
       │ FlowGate intercepta
       ↓
┌─────────────┐
│  FlowGate   │  ← Autoridade única de decisão.
│   (Juiz)    │
└──────┬──────┘
       │
       ├─ !auth → /login
       ├─ !restaurant → /onboarding/identity
       └─ completed → /app/dashboard
```

---

## ✅ IMPLEMENTAÇÃO SELADA

### PASSO 1: Landing (Hero.tsx)

**Arquivos:**
- `merchant-portal/src/pages/Landing/components/Hero.tsx`
- `landing-page/src/components/Hero.tsx` (projeto separado)

**Estado:**
```tsx
// ✅ CORRETO (LOCKED)
<Link to="/app">Entrar em operação</Link>
<Link to="/app">Já tenho conta</Link>

// ❌ NUNCA MAIS FAZER
<Link to="/login">...</Link>
<Link to="/login?oauth=google">...</Link>
<a href={getMerchantPortalUrl('/login')}>...</Link>
```

**Regra:** Landing só redireciona. Não decide.

---

### PASSO 2: `/app` como Portal Neutro

**Arquivo:** `merchant-portal/src/App.tsx`

**Estado:**
```tsx
// ✅ CORRETO (LOCKED)
<Route path="/app" element={
  <OrderProvider>
    <ThemeEngine />
    <AppLayout />
  </OrderProvider>
}>
  <Route index element={<Navigate to="/app/dashboard" replace />} />
  <Route path="dashboard" element={<DashboardZero />} />
  {/* ... outras rotas ... */}
</Route>
```

**Regra:** `/app` não renderiza UI própria. É interceptado pelo FlowGate.

---

### PASSO 3: FlowGate Soberano

**Arquivo:** `merchant-portal/src/core/flow/FlowGate.tsx`  
**Lógica:** `merchant-portal/src/core/flow/CoreFlow.ts`

**Estado:**
```typescript
// ✅ CORRETO (LOCKED)
export function resolveNextRoute(state: UserState): FlowDecision {
    // 1. BARREIRA DE AUTENTICAÇÃO
    if (!isAuthenticated) {
        if (currentPath.startsWith('/public')) return { type: 'ALLOW' };
        if (currentPath === '/login' || currentPath === '/') return { type: 'ALLOW' };
        if (currentPath === '/app') return { type: 'REDIRECT', to: '/login', reason: 'Auth required' };
        return { type: 'REDIRECT', to: '/login', reason: 'Auth required' };
    }

    // 2. BARREIRA DE ORGANIZAÇÃO
    if (!hasOrganization && onboardingStatus !== 'identity' && onboardingStatus !== 'not_started') {
        return { type: 'REDIRECT', to: '/onboarding/identity', reason: 'Organization missing' };
    }

    // 3. REGRA DAS 7 TELAS DOURADAS
    if (onboardingStatus !== 'completed') {
        const targetRoute = onboardingStatus === 'not_started'
            ? '/onboarding/identity'
            : `/onboarding/${onboardingStatus}`;
        
        if (currentPath.startsWith(targetRoute)) {
            return { type: 'ALLOW' };
        }
        
        return { type: 'REDIRECT', to: targetRoute, reason: `Strict Protocol: ${onboardingStatus}` };
    }

    // 4. ESTADO SOBERANO (COMPLETED)
    if (currentPath === '/login' || currentPath === '/' || currentPath === '/app') {
        return { type: 'REDIRECT', to: '/app/dashboard', reason: 'Auth & Setup complete' };
    }

    return { type: 'ALLOW' };
}
```

**Regra:** FlowGate só usa:
- ✅ `auth.user` (sessão Supabase)
- ✅ `restaurant_members` (VIEW)
- ✅ `gm_restaurants.onboarding_completed_at` (flag clara)

**Não usa:**
- ❌ `profiles` (opcional)
- ❌ `system_config` (opcional)
- ❌ Dados "nice to have"

---

## 🧪 TESTE E2E VALIDADO

**Cenário:** Aba anônima → Landing → Clica botão

**Fluxo Esperado:**
1. ✅ `/` → Landing page renderiza
2. ✅ Clica "Entrar em operação" → Navega para `/app`
3. ✅ FlowGate intercepta → Detecta `!auth`
4. ✅ Redireciona para `/login`
5. ✅ Tela de login Google OAuth disponível
6. ✅ **Sem loop. Sem confusão.**

**Console Esperado:**
```
[FlowGate] ✅ Allowed: /
[FlowGate] 🛑 Blocked: Auth required -> Go to /login
[FlowGate] ✅ Allowed: /login
```

---

## ⚠️ ALERTAS CRÍTICOS (NUNCA QUEBRAR)

### 🚫 REGRESSÃO ARQUITETURAL

**NUNCA mais fazer:**
- ❌ Landing decidir rota (`/login`, `/onboarding`, etc.)
- ❌ Botão apontar para `/login` diretamente
- ❌ Query string controlando fluxo (`?oauth=google`, `?mode=migration`, etc.)
- ❌ Landing com lógica de "detectar usuário existente"
- ❌ Múltiplos pontos de decisão de fluxo

**Se alguém sugerir isso → É REGRESSÃO ARQUITETURAL.**

---

### 🔐 NOVOS APPS (Mobile, Staff, Kiosk)

**Regra Universal:**
```
Todos os apps → /app → FlowGate → Decisão
```

**Sem exceção.**

Isso garante:
- ✅ Auditoria centralizada
- ✅ Segurança única
- ✅ Previsibilidade
- ✅ Certificações (ISO 27001, SOC2)

---

## 📊 STATUS OFICIAL

| Componente | Status | Autoridade |
|-------------|--------|------------|
| Landing | `PURE` | Marketing apenas |
| `/app` | `NEUTRAL` | Portal de entrada |
| FlowGate | `SOVEREIGN` | Juiz único |
| Loops | `ELIMINATED` | Zero loops |
| E2E Flow | `LOCKED` | Imutável |

---

## 🏗️ PRÓXIMOS NÍVEIS (Opcional)

1. **🔐 ISO 27001 / SOC2**
   - Mapear FlowGate como "Control Point"
   - Documentar auditoria de acesso

2. **🧭 Formalização**
   - FlowGate como "Sovereign Authority" no código
   - TypeScript strict para decisões de fluxo

3. **📐 Documentação Imutável**
   - Este documento como referência arquitetural
   - Adicionar ao `CANON.md` do projeto

---

## 📝 NOTAS TÉCNICAS

**Por que isso funciona:**
- **Soberania única:** Apenas FlowGate decide. Nada mais interfere.
- **Determinismo:** Mesmo estado → mesma decisão. Sempre.
- **Simplicidade:** Landing é marketing. `/app` é portal. FlowGate é juiz.

**Por que loops foram eliminados:**
- Antes: Múltiplos pontos de decisão competindo.
- Agora: Um funil. Uma porta. Uma autoridade.

**Por que escala:**
- Previsibilidade: Qualquer desenvolvedor sabe onde procurar.
- Testabilidade: Um ponto de teste (FlowGate).
- Manutenibilidade: Mudanças de fluxo em um lugar só.

---

**Última Atualização:** 2026-01-08  
**Versão:** 1.0.0 (LOCKED)  
**Mantenedor:** Arquitetura Core

