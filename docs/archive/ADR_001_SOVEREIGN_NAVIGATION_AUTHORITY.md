# ADR-001: Soberania Única de Navegação

**Status:** ✅ Aprovado e Implementado  
**Data:** 2026-01-08  
**Decisores:** Arquitetura Core  
**Contexto:** Conflito de autoridade em fluxo de navegação  
**Consequência:** Sistema determinístico e auditável

---

## 🎯 DECISÃO

**Estabelecer um único ponto de autoridade para todas as decisões de navegação do sistema.**

```
Landing → /app → FlowGate → Decisão
```

**FlowGate é o juiz único. Nenhum outro componente decide rotas.**

---

## 📋 CONTEXTO

### O Problema

Durante semanas, o sistema apresentava comportamento imprevisível:
- Loops infinitos de redirecionamento
- Telas erradas aparecendo
- "Funciona às vezes"
- Sensação de "sistema amaldiçoado"

### A Causa Raiz

**Não era um bug. Era um conflito de autoridade.**

Múltiplos componentes tentavam decidir o fluxo simultaneamente:
- ❌ Landing decidia (`/login`, `/onboarding`, query strings)
- ❌ Login decidia (auto-redirects, OAuth triggers)
- ❌ Onboarding decidia (validações, pulos de etapa)
- ❌ FlowGate decidia (mas era ignorado)
- ❌ Estado do Supabase "opinava" (sessões, flags)
- ❌ Feature flags "sussurravam" (gates condicionais)

**Cada parte estava correta no seu microcontexto.**  
**Mas o sistema como um todo não tinha soberania.**

---

## 🔍 ANÁLISE

### Por Que Isso Aconteceu?

1. **Tentativa de ser "inteligente" cedo demais**
   - Rotas condicionais
   - Auto-redirects
   - Gates inteligentes
   - Estados derivados
   - Sistemas fail-closed
   
   **Tudo isso é certo — mas sem um ponto de entrada único, vira caos.**

2. **Limite cognitivo humano**
   - O cérebro humano **NÃO consegue** simular sistemas com múltiplos gates implícitos
   - Por isso a sensação de "não tem sentido" e "estamos dando volta"
   - **Não é emocional. É limite cognitivo real.**

3. **Arquitetura de produto, não código**
   - Arquitetura só mostra erro quando:
     - Tudo já está quase pronto
     - Todas as peças existem
     - O sistema começa a se mover sozinho
   - **É o momento mais ingrato do desenvolvimento.**

---

## ✅ DECISÃO ESTRUTURAL

### A Única Decisão Necessária

**"Existe UM ponto de entrada. Todo o resto é consequência."**

```
/app → FlowGate → decisão
```

### Implementação

1. **Landing (Marketing Puro)**
   - Todos os botões → `/app`
   - Zero lógica de fluxo
   - Zero query strings
   - Zero detecção de estado

2. **`/app` (Portal Neutro)**
   - Não renderiza UI própria
   - Apenas interceptado pelo FlowGate
   - Sem lógica condicional

3. **FlowGate (Juiz Único)**
   - Única autoridade de decisão
   - Usa apenas dados essenciais:
     - ✅ `auth.user` (sessão Supabase)
     - ✅ `restaurant_members` (VIEW)
     - ✅ `gm_restaurants.onboarding_completed_at` (flag clara)
   - Ignora dados "nice to have":
     - ❌ `profiles` (opcional)
     - ❌ `system_config` (opcional)

---

## 🎯 CONSEQUÊNCIAS

### Positivas

✅ **Sistema determinístico**
- Mesmo estado → mesma decisão. Sempre.

✅ **Previsibilidade**
- Qualquer desenvolvedor sabe onde procurar
- Um ponto de teste (FlowGate)
- Mudanças de fluxo em um lugar só

✅ **Auditabilidade**
- Fluxo certificável (ISO 27001, SOC2)
- Histórico centralizado
- Compliance-ready

✅ **Escalabilidade**
- Base que não enlouquece com escala
- Nível SaaS sério
- Enterprise-ready

### Negativas

⚠️ **Rigidez inicial**
- Mudanças de fluxo requerem alterar FlowGate
- Mas isso é **intencional** — força decisões explícitas

⚠️ **Complexidade concentrada**
- FlowGate fica mais complexo
- Mas é **melhor** que complexidade difusa

---

## 🔒 PROTEÇÃO CONTRA REGRESSÃO

### Regras Imutáveis

1. **Landing nunca decide rota**
   - ❌ Nunca: `<Link to="/login">`
   - ❌ Nunca: `<Link to="/onboarding">`
   - ❌ Nunca: Query strings (`?oauth=google`)
   - ✅ Sempre: `<Link to="/app">`

2. **FlowGate é a única autoridade**
   - ❌ Nunca: Outro componente redireciona
   - ❌ Nunca: Auto-redirects em componentes
   - ✅ Sempre: FlowGate decide

3. **`/app` é portal neutro**
   - ❌ Nunca: Lógica condicional em `/app`
   - ❌ Nunca: UI própria em `/app`
   - ✅ Sempre: FlowGate intercepta

### Checklist de Code Review

Ver `.flow-protection-checklist.md` para checklist completo.

---

## 📊 VALIDAÇÃO

### Teste E2E

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

## 🏗️ PRÓXIMOS NÍVEIS

1. **🔐 ISO 27001 / SOC2**
   - Mapear FlowGate como "Control Point"
   - Documentar auditoria de acesso

2. **🧭 Formalização**
   - FlowGate como "Sovereign Authority" no código
   - TypeScript strict para decisões de fluxo

3. **📐 Documentação Imutável**
   - Este ADR como referência arquitetural
   - Adicionar ao `CANON.md` do projeto

---

## 📝 NOTAS FINAIS

### Por Que Isso Funciona

- **Soberania única:** Apenas FlowGate decide. Nada mais interfere.
- **Determinismo:** Mesmo estado → mesma decisão. Sempre.
- **Simplicidade:** Landing é marketing. `/app` é portal. FlowGate é juiz.

### Por Que Loops Foram Eliminados

- **Antes:** Múltiplos pontos de decisão competindo.
- **Agora:** Um funil. Uma porta. Uma autoridade.

### Por Que Escala

- **Previsibilidade:** Qualquer desenvolvedor sabe onde procurar.
- **Testabilidade:** Um ponto de teste (FlowGate).
- **Manutenibilidade:** Mudanças de fluxo em um lugar só.

---

## 🔗 REFERÊNCIAS

- `ARCHITECTURE_FLOW_LOCKED.md` — Implementação técnica
- `.flow-protection-checklist.md` — Checklist de code review
- `merchant-portal/src/core/flow/FlowGate.tsx` — Implementação
- `merchant-portal/src/core/flow/CoreFlow.ts` — Lógica de decisão

---

**Última Atualização:** 2026-01-08  
**Versão:** 1.0.0 (LOCKED)  
**Mantenedor:** Arquitetura Core
