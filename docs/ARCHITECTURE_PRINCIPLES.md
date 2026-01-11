# Princípios Arquiteturais ChefIApp

**Data**: 2025-01-27  
**Status**: ✅ **CANÔNICO**

---

## 🎯 Frase Síntese (A Regra de Ouro)

> **Nem tudo precisa parecer produto.**  
> **Tudo precisa saber o que é.**

---

## 📐 Princípios Fundamentais

### 1. Design System é Contexto de Uso

**Regra:**
> Design System é autoridade apenas no domínio do produto.

**Aplicação:**
- **Produto** (`/app/setup/*`, `/app/dashboard`): Design System completo, coeso, vendável
- **Ferramentas DEV** (`/dev/wizard`): Claras, rápidas, seguras — não precisam ser bonitas

**Por quê:**
- Evita refactors desnecessários
- Preserva velocidade de desenvolvimento
- Mantém produto comercialmente defensável

---

### 2. Separação Conceitual Impecável

**Regra:**
> Cada componente precisa ter propósito claro, expectativas corretas e nível de polish adequado.

**Aplicação:**
- `/app/setup/*` → Produto real, merchant-facing
- `/dev/wizard` → Ferramenta interna DEV
- Cada um com seu próprio nível de exigência

**Por quê:**
- Evita bugs de onboarding
- Elimina confusão de UX
- Reduz dívida cognitiva da equipa

---

### 3. Gates e Proteção de Produção

**Regra:**
> Proteger você de você mesmo no futuro, proteger outros devs, proteger o produto comercialmente.

**Aplicação:**
- Gates explícitos no código
- Comentários no router
- `eslint-disable-file` documentado
- Redirects legacy para compatibilidade

**Por quê:**
- Previne regressões conceituais
- Documentação viva no código
- Proteção comercial automática

---

## 🔄 Fluxo Canônico

```
Google OAuth
   ↓
/app/bootstrap
   ↓
if wizard_completed_at:
   → /app/dashboard
else:
   → /app/setup/*
```

**Características:**
- ✅ Simples
- ✅ Legível
- ✅ Auditável
- ✅ SaaS-grade

---

## 🎓 Lições Aprendidas

### O que parecia bug era choque de contexto

**Problema percebido:**
- Design System "não aplicado"
- Inconsistência visual
- Sensação de "quebra"

**Problema real:**
- Dois wizards com naturezas diferentes
- Conflito semântico, não técnico
- Expectativa de produto onde havia ferramenta

**Solução:**
- Mudar enquadramento, não brigar com CSS
- Pensamento de arquiteto, não "front-end apaga-incêndio"

---

### Decisões que evitam problemas daqui a 6 meses

**O que foi feito:**
- ✅ Não refatorar o que não precisa
- ✅ Proteger produção
- ✅ Manter tooling útil
- ✅ Preservar clareza conceitual

**Resultado:**
- Evita bugs caros no futuro
- Evita refactors desnecessários
- Evita confusão de UX
- Evita dívida cognitiva

---

## 🟢 Estado Atual (Veredito Final)

| Área | Estado | Observações |
|------|--------|-------------|
| **Auth** | 🟢 Blindado | OAuth sólido, sessão resiliente |
| **Bootstrap** | 🟢 Idempotente | Gate correto, redirecionamento consistente |
| **Wizard Real** (`/app/setup`) | 🟢 Produto | Onboarding real, Design System aplicado |
| **Wizard DEV** (`/dev/wizard`) | 🟡 Interno, controlado | Ferramenta DEV, bloqueado em produção |
| **Design System** | 🟢 Autoridade visual | Consistente, coeso, aplicado corretamente |
| **Dashboard** | 🟢 Pronto para venda | UX consistente, produto comercial |

**Nada crítico aberto. Nada mal resolvido.**

---

## 🔜 Próximos Passos (Opcionais, Sem Urgência)

Quando quiser avançar:

### 1. Polish do `/app/setup`
- Micro feedbacks
- Loading states
- Copy mais comercial

### 2. Eventos de Onboarding
- `step_started`
- `step_completed`
- `wizard_completed`
- Abandono por passo

### 3. Owner Dashboard v1
- "Estado do negócio"
- Não técnico
- Orientado a decisão

### 4. Feature Flags + Planos
- Base perfeita para monetizar sem refactor
- Gating por plano
- Upsell estratégico

---

## 📝 Documentação Relacionada

- `docs/ARCHITECTURE_LESSON_WIZARD_CONTEXT.md` - Lição arquitetural completa
- `docs/WIZARD_DEV_TOOL_REFINEMENTS.md` - Refinamentos aplicados
- `docs/WIZARD_ONBOARDING.md` - Implementação do wizard real
- `docs/WIZARD_ROUTING_FIX.md` - Correção de rotas e gates

---

## 🎯 Conclusão

**Arquitetura madura, não só correção técnica.**

O sistema demonstra:
- Separação conceitual impecável
- Design System no lugar certo
- Gates e proteção de produção — nível profissional
- Fluxo canônico e auditável

**Nível: SaaS comercial sério.**

---

**Status**: ✅ **CANÔNICO E DOCUMENTADO**

