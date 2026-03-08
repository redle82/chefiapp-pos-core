# 🔐 Correção OAuth Google — Guia Completo

**Data**: 2025-01-03  
**Status**: ⚠️ Correção Necessária  
**Objetivo**: OAuth profissional, confiável e sem expor Supabase

---

## 🔴 Problemas Identificados

### 1. Domínio do Supabase Exposto
- ❌ Usuário vê: `qonfbtwsxeggxbkhqnxl.supabase.co wants to access your Google Account`
- ❌ Quebra confiança imediata
- ❌ Parece app genérico/inacabado

### 2. Permissões Amplas Demais
- ❌ Atualmente pede permissões genéricas
- ❌ Para login, só precisa: email, nome, avatar

### 3. Logo Não Aparece
- ❌ Tela de consentimento sem identidade visual
- ❌ Passa sensação de "side project"

---

## ✅ Solução: Passo a Passo

### PASSO 1 — Configurar OAuth Consent Screen no Google Cloud

**Acesso**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent)

#### 1.1 App Information

```
App name: ChefIApp
User support email: contact@goldmonkey.studio
Developer contact: contact@goldmonkey.studio
```

#### 1.2 App Logo

- **Formato**: PNG ou SVG
- **Tamanho mínimo**: 120x120px
- **Fundo**: Transparente
- **Arquivo**: `chefiapp-logo.png`

**Upload**: Fazer upload do logo no campo "App logo"

#### 1.3 Authorized Domains

**Adicionar APENAS**:
- ✅ `chefiapp.com`
- ✅ `goldmonkey.studio`

**NUNCA adicionar**:
- ❌ `supabase.co`
- ❌ Subdomínios do Supabase
- ❌ Domínios de desenvolvimento

**Nota**: O Supabase é backend, não identidade pública.

---

### PASSO 2 — Limitar Scopes (Essencial)

**Em "Scopes"**, deixar APENAS:

```
openid
email
profile
```

**Remover**:
- ❌ Acesso a contatos
- ❌ Dados estendidos
- ❌ Permissões sensíveis
- ❌ Qualquer coisa além do mínimo necessário

**Por quê?**
- ✅ Evita revisão longa do Google
- ✅ Transmite confiança ao usuário
- ✅ Minimiza fricção psicológica

---

### PASSO 3 — Configurar OAuth no Supabase

**Acesso**: [Supabase Dashboard](https://supabase.com/dashboard) → Authentication → Providers → Google

#### 3.1 Credenciais

```
Client ID: [do Google Cloud Console]
Client Secret: [do Google Cloud Console]
```

#### 3.2 Redirect URLs

**Adicionar APENAS**:

```
https://chefiapp.com/auth/callback
http://localhost:5173/auth/callback
```

**NUNCA expor**:
- ❌ URLs do Supabase ao usuário
- ❌ `*.supabase.co/auth/v1/callback`

**Nota**: O Supabase gerencia internamente, mas o usuário não deve ver.

---

### PASSO 4 — Ajustar Frontend (UX Crítico)

#### 4.1 Botão de Login

**Texto do botão**:
```
Entrar com Google
```

**Texto auxiliar** (abaixo do botão):
```
"Usamos apenas seu email para criar sua conta. Nada é publicado."
```

**Por quê?**
- ✅ Reduz fricção psicológica
- ✅ Explica claramente o que será usado
- ✅ Transmite transparência

#### 4.2 Scopes no Código

**Garantir que o código use apenas**:
```typescript
scopes: 'openid email profile'
```

---

## 🎯 Resultado Esperado

### Tela do Google (Ideal)

O usuário deve ver:

```
┌─────────────────────────────────┐
│  [Logo ChefIApp]                │
│                                 │
│  ChefIApp quer acessar sua      │
│  conta Google                   │
│                                 │
│  Permissões:                    │
│  • Ver seu email                │
│  • Ver seu nome e foto          │
│                                 │
│  [Continuar] [Cancelar]         │
└─────────────────────────────────┘
```

**Nada de**:
- ❌ Supabase
- ❌ Domínios estranhos
- ❌ Permissões assustadoras

---

## 📋 Checklist de Validação

### Google Cloud Console
- [ ] App name: "ChefIApp"
- [ ] Logo carregado (120x120px mínimo)
- [ ] User support email configurado
- [ ] Authorized domains: apenas `chefiapp.com` e `goldmonkey.studio`
- [ ] Scopes: apenas `openid`, `email`, `profile`

### Supabase Dashboard
- [ ] Google Provider habilitado
- [ ] Client ID e Secret configurados
- [ ] Redirect URLs: apenas domínios públicos (não Supabase)

### Frontend
- [ ] Botão: "Entrar com Google"
- [ ] Texto auxiliar sobre privacidade
- [ ] Scopes limitados no código

### Teste Manual
- [ ] Fazer login com Google
- [ ] Verificar que aparece "ChefIApp" (não Supabase)
- [ ] Verificar que logo aparece
- [ ] Verificar que permissões são mínimas
- [ ] Verificar que redirect funciona

---

## 🚨 Importante

### O Que NÃO Fazer

1. ❌ **Nunca adicionar `supabase.co` em Authorized Domains**
   - O Supabase é infraestrutura, não marca

2. ❌ **Nunca pedir permissões desnecessárias**
   - Isso quebra confiança e pode causar rejeição do Google

3. ❌ **Nunca expor URLs do Supabase ao usuário**
   - O callback do Supabase é interno

### O Que Fazer

1. ✅ **Sempre usar domínios próprios**
   - `chefiapp.com` é a identidade pública

2. ✅ **Sempre limitar scopes ao mínimo**
   - Email, nome, avatar são suficientes

3. ✅ **Sempre comunicar transparência**
   - "Usamos apenas seu email" reduz fricção

---

## 🔧 Ajustes no Código

### Frontend (LoginPage.tsx)

```typescript
const handleOAuth = async (provider: 'google' | 'apple') => {
  const { data, error: authErr } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: appUrl('/bootstrap'),
      scopes: 'openid email profile', // ← Adicionar isso
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
};
```

### Texto Auxiliar

Adicionar abaixo do botão:
```tsx
<p style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>
  Usamos apenas seu email para criar sua conta. Nada é publicado.
</p>
```

---

## 📊 Impacto Esperado

### Antes
- ❌ "supabase.co wants to access..."
- ❌ Sem logo
- ❌ Permissões genéricas
- ❌ Desconfiança imediata

### Depois
- ✅ "ChefIApp quer acessar..."
- ✅ Logo visível
- ✅ Permissões mínimas e claras
- ✅ Confiança profissional

---

## 🎯 Visão Estratégica

O login é o **primeiro contrato emocional** com o restaurante.

**Se isso falha**:
- ❌ Dono desconfia
- ❌ Gerente evita
- ❌ Funcionário abandona

**Corrigindo isso**, o ChefIApp passa de:
- "app promissor"
- para
- **"sistema profissional de operação"**

---

**Mensagem Final**:  
"Sem drama, só engenharia. OAuth profissional é base de confiança."

