# ✅ Checklist: OAuth Google Profissional

**Data**: 2025-01-03  
**Objetivo**: Validar que o OAuth está configurado corretamente

---

## 🔧 Google Cloud Console

### OAuth Consent Screen

- [ ] **App Information**
  - [ ] App name: `ChefIApp`
  - [ ] User support email: `contact@goldmonkey.studio`
  - [ ] Developer contact: `contact@goldmonkey.studio`

- [ ] **App Logo**
  - [ ] Logo carregado (PNG/SVG, mínimo 120x120px)
  - [ ] Fundo transparente
  - [ ] Nome do arquivo: `chefiapp-logo.png`

- [ ] **Authorized Domains**
  - [ ] `chefiapp.com` adicionado
  - [ ] `goldmonkey.studio` adicionado
  - [ ] **NENHUM** domínio `supabase.co` adicionado

- [ ] **Scopes**
  - [ ] Apenas `openid` selecionado
  - [ ] Apenas `email` selecionado
  - [ ] Apenas `profile` selecionado
  - [ ] **NENHUMA** permissão adicional

---

## 🔧 Supabase Dashboard

### Authentication → Providers → Google

- [ ] **Provider Enabled**
  - [ ] Google provider está habilitado

- [ ] **Credentials**
  - [ ] Client ID configurado (do Google Cloud)
  - [ ] Client Secret configurado (do Google Cloud)

- [ ] **Redirect URLs**
  - [ ] `https://chefiapp.com/auth/callback` adicionado
  - [ ] `http://localhost:5173/auth/callback` adicionado (dev)
  - [ ] URLs do Supabase **NÃO** expostas ao usuário

---

## 💻 Frontend (Código)

### LoginPage.tsx

- [ ] **Scopes Limitados**
  ```typescript
  scopes: 'openid email profile'
  ```

- [ ] **Texto do Botão**
  - [ ] Botão: "Entrar com Google" (não "Continuar com Google")

- [ ] **Texto Auxiliar**
  - [ ] Texto: "Usamos apenas seu email para criar sua conta. Nada é publicado."

### AuthPage.tsx

- [ ] **Scopes Limitados**
  ```typescript
  scopes: 'openid email profile'
  ```

### SignupPage.tsx

- [ ] **Scopes Limitados**
  ```typescript
  scopes: 'openid email profile'
  ```

---

## 🧪 Teste Manual

### Teste 1: Login com Google

1. [ ] Navegar para `/login`
2. [ ] Clicar em "Entrar com Google"
3. [ ] **Verificar tela do Google**:
   - [ ] Aparece "ChefIApp" (não Supabase)
   - [ ] Logo do ChefIApp visível
   - [ ] Permissões: apenas email, nome e foto
   - [ ] **NENHUM** domínio `supabase.co` visível
4. [ ] Autorizar
5. [ ] **Verificar redirect**: volta para `/app/bootstrap` ou `/app/dashboard`

### Teste 2: Signup com Google

1. [ ] Navegar para `/signup`
2. [ ] Clicar em "Criar com Google"
3. [ ] **Verificar tela do Google** (mesmo que Teste 1)
4. [ ] Autorizar
5. [ ] **Verificar redirect**: volta para `/onboarding`

---

## ✅ Critérios de Sucesso

### O Que DEVE Aparecer

- ✅ "ChefIApp quer acessar sua conta Google"
- ✅ Logo do ChefIApp
- ✅ Permissões: "Ver seu email", "Ver seu nome e foto"
- ✅ Domínio: `chefiapp.com` (não Supabase)

### O Que NÃO DEVE Aparecer

- ❌ `supabase.co` em qualquer lugar
- ❌ Permissões genéricas ou assustadoras
- ❌ Tela sem logo
- ❌ Domínios estranhos

---

## 🚨 Se Algo Estiver Errado

### Problema: Ainda aparece Supabase

**Solução**:
1. Verificar Authorized Domains no Google Cloud
2. Remover qualquer `supabase.co`
3. Aguardar 5-10 minutos (cache do Google)
4. Testar novamente

### Problema: Logo não aparece

**Solução**:
1. Verificar se logo foi carregado no Google Cloud
2. Verificar formato (PNG/SVG, mínimo 120x120px)
3. Aguardar 5-10 minutos (cache do Google)
4. Testar novamente

### Problema: Permissões ainda amplas

**Solução**:
1. Verificar Scopes no Google Cloud
2. Remover tudo exceto `openid`, `email`, `profile`
3. Verificar código frontend (deve ter `scopes: 'openid email profile'`)
4. Testar novamente

---

**Status**: ⚠️ Aguardando configuração no Google Cloud Console

