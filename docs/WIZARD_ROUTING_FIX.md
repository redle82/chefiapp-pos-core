# Wizard Routing Fix — Bloqueio de Rota Legacy

**Data**: 2025-01-27  
**Status**: ✅ **APLICADO**

---

## 🎯 Problema Identificado

O sistema tinha **dois wizards vivos**:

| Rota | Página | Estado | Uso |
|------|--------|--------|-----|
| `/app/wizard` | `WizardPage.tsx` | ⚠️ **LEGACY / DEV TOOL** | Ferramenta interna |
| `/app/setup/*` | `SetupLayout + Steps` | ✅ **ONBOARDING REAL** | Usuário final |

**Problema**: Usuários podiam acessar `/app/wizard` e ver a ferramenta interna (CSS legado, visual antigo).

---

## ✅ Solução Aplicada

### Blindagem Defensiva

**Arquivo**: `merchant-portal/src/pages/WizardPage.tsx`

**Mudança**:
```typescript
// BLOCKING: Redirect to real wizard in production
// This is a DEV-only internal tool
if (!import.meta.env.DEV) {
    return <Navigate to="/app/setup" replace />
}
```

**Comportamento**:
- ✅ **DEV**: WizardPage acessível (ferramenta interna)
- ✅ **PRODUCTION**: Redireciona automaticamente para `/app/setup`
- ✅ **Zero regressões**: Lógica preservada, apenas bloqueio de rota

---

## 📋 Fluxo Correto (Confirmado)

### Onboarding Real (Usuário Final)

```
Login
 → /app/bootstrap
   → Verifica wizard_completed_at
     → Se completo: /app/dashboard
     → Se incompleto: /app/setup
       → /app/setup/identity (Design System ✅)
       → /app/setup/menu (Design System ✅)
       → /app/setup/payments (Design System ✅)
       → /app/setup/design (Design System ✅)
       → /app/setup/publish (Design System ✅)
 → /app/dashboard
```

### Ferramenta Interna (DEV Only)

```
/app/wizard (DEV only)
 → WizardPage.tsx
   → Seed manual
   → Debug
   → Testes internos
   → Simular estados
```

---

## 🎯 Por Que Isso É Importante

### Antes
- ❌ Usuário podia acessar `/app/wizard` manualmente
- ❌ Via ferramenta interna (CSS legado, visual antigo)
- ❌ Confusão sobre qual é o wizard "certo"
- ❌ Possível uso acidental em produção

### Depois
- ✅ `/app/wizard` bloqueado em produção
- ✅ Redireciona automaticamente para wizard real
- ✅ Ferramenta interna só acessível em DEV
- ✅ Zero chance de confusão

---

## 📝 Notas Técnicas

### Por Que Dois Wizards?

**WizardPage.tsx** (Legacy):
- Ferramenta de desenvolvimento
- Seed manual de dados
- Debug de estados
- Testes internos
- **NÃO é produto**

**SetupLayout + Steps** (Real):
- Onboarding do usuário final
- Design System completo
- Fluxo guiado
- Persistência no banco
- **É o produto**

### Decisão Arquitetural

Mantivemos o WizardPage porque:
- ✅ Útil para desenvolvimento
- ✅ Testes internos
- ✅ Seed de dados
- ✅ Debug rápido

Mas bloqueamos em produção porque:
- ✅ Não é produto
- ✅ Visual não alinhado
- ✅ Pode confundir usuários
- ✅ Não segue Design System

---

## ✅ Validação

### Teste 1: Produção
1. Build de produção (`npm run build`)
2. Acessar `/app/wizard`
3. ✅ Deve redirecionar para `/app/setup`

### Teste 2: DEV
1. Modo desenvolvimento (`npm run dev`)
2. Acessar `/app/wizard`
3. ✅ Deve mostrar WizardPage (ferramenta interna)

### Teste 3: Onboarding Real
1. Novo usuário
2. Login → Bootstrap
3. ✅ Deve ir para `/app/setup` (não `/app/wizard`)

---

## 🔗 Arquivos Relacionados

- `merchant-portal/src/pages/WizardPage.tsx` - Ferramenta interna (DEV only)
- `merchant-portal/src/pages/SetupLayout.tsx` - Wizard real (usuário final)
- `merchant-portal/src/pages/steps/*` - Steps do wizard real
- `merchant-portal/src/pages/BootstrapPage.tsx` - Gate de redirecionamento

---

**Status**: ✅ **BLOQUEIO APLICADO**

**Resultado**: Usuários nunca mais verão a ferramenta interna em produção.

