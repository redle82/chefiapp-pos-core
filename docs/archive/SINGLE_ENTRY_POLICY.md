# 🔒 Single Entry Policy — Política Constitucional

**Status:** `IMMUTABLE`  
**Data de Ratificação:** 2026-01-08  
**Autoridade:** Arquitetura Core  
**Referência:** ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md

---

## 🎯 DECLARAÇÃO CONSTITUCIONAL

**A Landing Page NÃO conhece login, OAuth, onboarding nem estado.**  
**Ela apenas aponta para `/app`.**

**Tudo o que não for `/app` na landing reabre o inferno que acabamos de fechar.**

---

## 📋 REGRA ABSOLUTA

### O Que É Permitido

✅ **Landing Page → `/app`**  
✅ **FlowGate decide tudo**  
✅ **`/login` só é acessado por redirect do FlowGate**

### O Que É Proibido

❌ **Landing Page → `/login`**  
❌ **Landing Page → `/onboarding`**  
❌ **Query strings controlando fluxo** (`?oauth=google`, `?mode=migration`)  
❌ **Auto-redirects fora do FlowGate**  
❌ **Múltiplos pontos de decisão**

---

## 🧠 POR QUE ISSO EXISTE

### O Problema Que Resolve

Antes desta política, existiam **múltiplas autoridades concorrentes**:
1. Landing Page → às vezes decidia login, às vezes onboarding
2. Login Page → às vezes iniciava OAuth, às vezes não
3. FlowGate → tentava ser juiz, mas chegava tarde demais

Isso criava:
- ❌ Loops invisíveis
- ❌ "Às vezes funciona"
- ❌ "Depende de por onde entra"
- ❌ "Essa tela aparece do nada"
- ❌ Sensação de "sistema com vontade própria"

### A Solução

**Uma única regra absoluta e inviolável:**

> Existe UM único ponto de entrada no sistema.  
> Essa peça não é técnica, é constitucional.

**`/app` é o único portal de entrada.**

Tudo o resto (login, onboarding, dashboard, tools) são **consequências, não decisões**.

---

## ✅ IMPLEMENTAÇÃO

### 1. Landing Page (Marketing Puro)

```tsx
// ✅ CORRETO
<Link to="/app">Entrar em operação</Link>
<Link to="/app">Já tenho conta</Link>

// ❌ PROIBIDO
<Link to="/login">...</Link>
<Link to="/onboarding">...</Link>
<a href="/login">...</a>
```

**Regra:** Landing não decide nada. Só aponta.

### 2. `/app` (Portal Único)

```tsx
// ✅ CORRETO
<Route path="/app" element={<FlowGate />} />
<Route path="/app/*" element={<FlowGate />} />
```

**Regra:** `/app` não renderiza UI própria. É interceptado pelo FlowGate.

### 3. FlowGate (Juiz Soberano)

```typescript
// ✅ CORRETO
export function resolveNextRoute(state: UserState): FlowDecision {
  // FlowGate decide tudo
  // Sempre
  // Sem exceção
  // Sem atalhos
}
```

**Regra:** FlowGate é a única autoridade de navegação.

---

## 🛡️ PROTEÇÃO TÉCNICA

### Validação Automática

Execute antes de cada commit:

```bash
npm run validate:single-entry
```

Este script valida que:
- ✅ Nenhum link na landing page aponta para `/login`
- ✅ Nenhum link na landing page aponta para `/onboarding`
- ✅ Todos os links apontam para `/app`
- ✅ `getMerchantPortalUrl` nunca recebe `/login` ou `/onboarding`

### ESLint Rule

Arquivo: `.eslintrc.landing-protection.js`

Bloqueia em tempo de desenvolvimento:
- `to="/login"` ou `to="/onboarding"`
- `href="/login"` ou `href="/onboarding"`
- `getMerchantPortalUrl('/login')` ou `getMerchantPortalUrl('/onboarding')`

### CI/CD Integration

Adicione ao seu pipeline:

```yaml
- name: Validate Single Entry Policy
  run: npm run validate:single-entry
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

Antes de fazer commit, verifique:

- [ ] Nenhum `<a href="/login">` na landing-page
- [ ] Nenhum `<Link to="/login">` na landing-page
- [ ] Nenhum `<a href="/onboarding">` na landing-page
- [ ] Nenhum `<Link to="/onboarding">` na landing-page
- [ ] Footer, CTAs secundários, textos → todos `/app`
- [ ] `/login` só é acessado por redirect do FlowGate
- [ ] `npm run validate:single-entry` passa sem erros

---

## 🚨 VIOLAÇÕES

### O Que Acontece Se Violar

1. **Validação falha** → Commit bloqueado
2. **ESLint erro** → Desenvolvimento bloqueado
3. **Arquitetura quebrada** → Sistema volta ao caos

### Como Corrigir

1. Encontre o link proibido
2. Mude para `/app`
3. Execute `npm run validate:single-entry`
4. Commit apenas quando passar

---

## 🧘‍♂️ POR QUE ISSO É ESSENCIAL

### Não É Estético

Isso não é "melhor prática" ou "boa arquitetura".  
Isso é **fundação de produto escalável**.

### O Que Garante

Quando um sistema tem soberania clara:
- ✅ Bugs ficam óbvios
- ✅ Fluxos param de "dar volta"
- ✅ Decisões ficam previsíveis
- ✅ A cabeça do time silencia

### Quando Aparece

Este problema só aparece quando o produto fica sério:
- ✅ Tem usuário antigo
- ✅ Usuário novo
- ✅ Refresh
- ✅ Deep link
- ✅ Aba nova
- ✅ Bookmark
- ✅ Copy/paste de URL

**Sem soberania, isso implode.**

---

## 📚 REFERÊNCIAS

- **ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md** — Decisão arquitetural formal
- **ARCHITECTURE_FLOW_LOCKED.md** — Implementação técnica
- **CANON.md** — Law 0: Navigation Sovereignty
- **LESSONS_LEARNED_AUTHORITY_CONFLICT.md** — Lições aprendidas

---

## 🎯 STATUS FINAL

**Fluxo selado. Soberania única estabelecida.**

A landing page não conhece login, OAuth, onboarding nem estado.  
Ela apenas aponta para `/app`.  
O FlowGate decide tudo.

**Capítulo encerrado.**

---

**Última Atualização:** 2026-01-08  
**Versão:** 1.0.0 (IMMUTABLE)  
**Mantenedor:** Arquitetura Core
