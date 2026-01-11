# 🏛️ CONSTITUIÇÃO DO CHEFIAPP — LEIS IMUTÁVEIS

**Status:** `RATIFIED`  
**Data de Ratificação:** 2026-01-08  
**Autoridade:** Arquitetura Core  
**Versão:** 1.0.0

---

## 🎯 DECLARAÇÃO CONSTITUCIONAL

Este documento define as **Leis Imutáveis** do sistema ChefIApp.  
Estas regras não são técnicas, são **constitucionais**.

**Violar estas leis = Quebrar o sistema.**

---

## 📐 LEI SUPREMA: UMA ENTRADA, UM DESTINO

### Artigo 1: Landing Page

**A Landing Page é puramente marketing.**

✅ **Permitido:**
- Explicar o produto
- Mostrar confiança
- CTA para entrar

❌ **Proibido:**
- Autenticar usuários
- Decidir fluxo
- Criar estado
- Redirecionar para qualquer lugar que não seja `/auth`

**Regra:** Landing → `/auth`. Fim.

---

### Artigo 2: Autenticação

**Auth é um Gate, não uma página.**

✅ **Permitido:**
- Iniciar OAuth (Google, Apple)
- Verificar se usuário existe

❌ **Proibido:**
- Decidir onboarding
- Decidir dashboard
- Redirecionar após OAuth (OAuth já redireciona para `/app`)
- Usar flags técnicas (`isLocal`, `technicalLogin`, etc)

**Regra:** Auth → OAuth → `/app`. FlowGate decide o resto.

---

### Artigo 3: FlowGate (Autoridade Suprema)

**FlowGate é o ÚNICO juiz do sistema.**

**Ordem de decisão (imutável):**

1. `!auth` → `/auth`
2. `!restaurant` → `/onboarding/identity`
3. `!setup_complete` → `/onboarding/{status}`
4. `completed` → `/app/dashboard`

✅ **Permitido:**
- Decidir destino baseado em estado real (DB)
- Redirecionar quando necessário

❌ **Proibido:**
- Criar lógica de decisão fora daqui
- Depender de dados opcionais
- Permitir múltiplas autoridades

**Regra:** FlowGate decide. Ninguém mais.

---

### Artigo 4: Onboarding

**Onboarding é um ritual, não uma opção.**

✅ **Permitido:**
- Acessar via FlowGate
- Completar etapas sequenciais

❌ **Proibido:**
- Acessar diretamente (sem FlowGate)
- Pular etapas
- Duplicar lógica

**Regra:** Onboarding só existe via FlowGate.

---

### Artigo 5: App Real

**App só existe se tudo estiver completo.**

✅ **Permitido:**
- Acessar `/app/*` se:
  - User existe
  - Restaurant existe
  - Onboarding completo

❌ **Proibido:**
- Acessar sem autenticação
- Acessar sem restaurante
- Acessar sem onboarding completo

**Regra:** App = Sistema completo.

---

## 🔥 PROIBIÇÕES ABSOLUTAS

### ❌ Landing duplicada
- Não pode existir mais de uma landing page
- Não pode existir landing standalone separada

### ❌ Login que decide fluxo
- Login/Auth não pode redirecionar para onboarding
- Login/Auth não pode decidir dashboard

### ❌ Página que redireciona sem autoridade
- Nenhuma página pode redirecionar sem passar pelo FlowGate
- Nenhum `useEffect` pode fazer `navigate()` sem autoridade

### ❌ Onboarding opcional
- Onboarding não pode ser pulado
- Onboarding não pode ser acessado diretamente

### ❌ Flags técnicas
- Não pode usar `isLocalhost`
- Não pode usar `technicalLogin`
- Não pode usar `autoOpen`

### ❌ Rotas órfãs
- Não pode existir rota não usada
- Não pode existir redirect morto

---

## ✅ IMPLEMENTAÇÃO CANÔNICA

### 1. Landing Page

```tsx
// ✅ CORRETO
<Link to="/auth">Entrar em operação</Link>
<Link to="/auth">Já tenho conta</Link>

// ❌ PROIBIDO
<Link to="/login">...</Link>
<Link to="/app">...</Link>
<Link to="/onboarding">...</Link>
```

### 2. Auth Page

```tsx
// ✅ CORRETO
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: '/app' }
});

// ❌ PROIBIDO
navigate('/onboarding');
navigate('/dashboard');
if (isLocal) { ... }
```

### 3. FlowGate

```tsx
// ✅ CORRETO
if (!isAuthenticated) {
  if (currentPath === '/' || currentPath === '/auth') return ALLOW;
  return REDIRECT('/auth');
}

if (!hasOrganization) {
  return REDIRECT('/onboarding/identity');
}

if (onboardingStatus !== 'completed') {
  return REDIRECT(`/onboarding/${onboardingStatus}`);
}

return REDIRECT('/app/dashboard');
```

---

## 🧹 LIMPEZA OBRIGATÓRIA

### O que DEVE ser deletado (sem dó):

1. ❌ Landing antiga (qualquer `/landing`, `/home`, `/start`)
2. ❌ LoginPage que:
   - Redireciona
   - Decide onboarding
   - Tem lógica de localhost
3. ❌ Qualquer `useEffect` que faz `navigate('/alguma-coisa')`
4. ❌ Flags tipo `isLocalhost`, `technicalLogin`, `autoOpen`
5. ❌ Rotas órfãs não usadas

**Regra:** Deletar, não comentar.

---

## 📌 SOBRE O "SISTEMA SUJO"

**Seu sistema não está sujo. Ele está jovem.**

Mas agora ele:
- Já tem identidade
- Já tem peso
- Já tem ambição de SaaS real

**Isso exige limpeza estrutural, não patch.**

---

## 🎯 STATUS OFICIAL

**CONSTITUIÇÃO = RATIFICADA**  
**FLOWGATE = SOBERANO**  
**LANDING = PURA**  
**AUTH = GATE**  
**ONBOARDING = RITUAL**  
**APP = COMPLETO**

---

**Esta constituição é imutável.**  
**Violar = Quebrar o sistema.**
