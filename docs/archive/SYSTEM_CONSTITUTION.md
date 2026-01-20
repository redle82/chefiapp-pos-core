# 🏛️ CHEFIAPP – SYSTEM CONSTITUTION

**Status:** `EXECUTIVE`  
**Data de Ratificação:** 2026-01-08  
**Autoridade:** Sistema Core  
**Versão:** 1.0.0

---

## ⚠️ AVISO CRÍTICO

**Este arquivo não é informativo. É EXECUTIVO.**

**Violar estas regras = BUILD FALHA.**

**O script `validate-constitution.js` executa estas regras antes de cada build.**

---

## 📐 ÚNICA VERDADE DE ENTRADA

### Landing Page

**ÚNICO ARQUIVO PERMITIDO:**
- `merchant-portal/src/pages/Landing/LandingPage.tsx`

**❌ PROIBIDO:**
- `landing-page/` (qualquer arquivo neste diretório)
- `merchant-portal/src/pages/OldLanding.tsx`
- `merchant-portal/src/pages/LandingOld.tsx`
- Qualquer outro componente de landing

**REGRA:** Landing redireciona APENAS para `/auth`. Nada mais.

---

### Autenticação

**ÚNICO ARQUIVO PERMITIDO:**
- `merchant-portal/src/pages/AuthPage.tsx`

**❌ PROIBIDO:**
- `merchant-portal/src/pages/LoginPage.tsx`
- Qualquer outro componente de autenticação
- Flags técnicas (`isLocal`, `technicalLogin`, etc)

**REGRA:** Auth apenas inicia OAuth. Redireciona para `/app`. FlowGate decide o resto.

---

### FlowGate (Autoridade Suprema)

**ÚNICO ARQUIVO PERMITIDO:**
- `merchant-portal/src/core/flow/FlowGate.tsx`
- `merchant-portal/src/core/flow/CoreFlow.ts` (lógica pura)

**❌ PROIBIDO:**
- `merchant-portal/src/core/flow/OldFlowGate.tsx`
- `merchant-portal/src/core/flow/FlowGateOld.tsx`
- Qualquer outro componente que decide fluxo

**REGRA:** FlowGate é o ÚNICO juiz. Nenhum outro componente pode decidir navegação.

---

## 🔥 PROIBIÇÕES ABSOLUTAS

### Arquivos Proibidos (Build Falha Se Existirem)

1. ❌ `landing-page/src` (qualquer arquivo)
2. ❌ `merchant-portal/src/pages/LoginPage.tsx`
3. ❌ `merchant-portal/src/pages/OldLanding.tsx`
4. ❌ `merchant-portal/src/pages/LandingOld.tsx`
5. ❌ `merchant-portal/src/core/flow/OldFlowGate.tsx`
6. ❌ `merchant-portal/src/core/flow/FlowGateOld.tsx`

### Imports Proibidos (Build Falha Se Encontrados)

1. ❌ `import ... from './pages/LoginPage'`
2. ❌ `import ... from './pages/OldLanding'`
3. ❌ Qualquer import de arquivo proibido

### Padrões Proibidos

1. ❌ Múltiplos FlowGates
2. ❌ Landing fora de `merchant-portal/src/pages/Landing/`
3. ❌ Auth fora de `merchant-portal/src/pages/AuthPage.tsx`

---

## ✅ ARQUIVOS OBRIGATÓRIOS (Build Falha Se Não Existirem)

1. ✅ `merchant-portal/src/pages/AuthPage.tsx`
2. ✅ `merchant-portal/src/core/flow/FlowGate.tsx`
3. ✅ `merchant-portal/src/pages/Landing/LandingPage.tsx`

---

## 🧹 REGRA DE MORTE AUTOMÁTICA

**Toda vez que algo novo é criado, algo velho DEVE morrer.**

**Se um arquivo novo substitui um antigo, o antigo é deletado na mesma sessão.**

**Sem exceção.**

**Se não sabe se pode deletar:**
- O sistema não está pronto
- A regra nova não é confiável ainda

---

## 🎯 FLUXO CANÔNICO (IMUTÁVEL)

```
Landing (/) 
  ↓
/auth (AuthPage)
  ↓
OAuth → /app
  ↓
FlowGate decide:
  - !auth → /auth
  - !restaurant → /onboarding/identity
  - !complete → /onboarding/{status}
  - complete → /app/dashboard
```

**Nenhum outro fluxo é permitido.**

---

## 🚨 EXECUÇÃO

**Este arquivo é validado antes de cada build.**

**Script:** `scripts/validate-constitution.js`

**Comando:** `npm run validate:constitution`

**Se falhar:** Build bloqueado.

---

## 📌 STATUS OFICIAL

**CONSTITUIÇÃO = EXECUTIVA**  
**VALIDAÇÃO = OBRIGATÓRIA**  
**BUILD = BLOQUEADO SE VIOLAR**

---

**Esta constituição é imutável.**  
**Violar = Quebrar o sistema.**
