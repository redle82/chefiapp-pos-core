# 🟡 FASE 2 - "PENSA COMIGO" - PLANO DE AÇÃO

**Data:** 16 Janeiro 2026  
**Objetivo:** O sistema reduz a "burrice operacional"  
**Duração:** 2-4 meses

---

## 🎯 OBJETIVO

**"O sistema reduz a 'burrice operacional'"**

Não é sobre dashboards bonitos. É sobre o sistema **agir antes que você pense**.

---

## 📋 COMPONENTES

### 4️⃣ AppStaff (Simples e Visível)

**Status Atual:**
- ✅ `AppStaff` module existe
- ✅ `ReflexEngine` implementado
- ✅ Estrutura básica funcionando
- ⚠️ Alertas automáticos precisam validação
- ⚠️ Sugestões contextuais podem ser melhoradas

**O que fazer:**
1. **Alertas Automáticos**
   - [ ] Implementar alerta "Mesa X sem pedido há 20min"
   - [ ] Alertas de estoque baixo
   - [ ] Alertas de tempo de preparo excedido
   - [ ] Notificações não intrusivas

2. **Sugestões Contextuais**
   - [ ] Sugerir ações baseadas em contexto
   - [ ] Detectar padrões e sugerir otimizações
   - [ ] Ajudar em decisões operacionais

3. **Menos Cliques**
   - [ ] Atalhos para ações comuns
   - [ ] Autocomplete inteligente
   - [ ] Ações rápidas no TPV

---

### 5️⃣ Analytics Mínimo

**Status Atual:**
- ✅ `analytics-service.ts` existe (backend)
- ✅ `Analytics.tsx` existe (frontend com mock)
- ✅ `DailySalesProjection.ts` existe
- ⚠️ Precisa conectar frontend com backend real
- ⚠️ Precisa implementar queries reais

**O que fazer:**
1. **Faturação Diária**
   - [ ] Conectar frontend com backend real
   - [ ] Mostrar receita do dia
   - [ ] Comparar com dias anteriores
   - [ ] Formato simples e claro

2. **Produtos Top Vendidos**
   - [ ] Query para produtos mais vendidos
   - [ ] Mostrar quantidade e receita
   - [ ] Período configurável (hoje, semana, mês)

3. **Horários de Pico**
   - [ ] Análise de pedidos por hora
   - [ ] Identificar horários de pico
   - [ ] Sugerir otimizações de staff

---

## 🚀 PRIORIZAÇÃO

### Semana 1-2: AppStaff Alertas
- [ ] Implementar alertas automáticos
- [ ] Testar em ambiente real
- [ ] Ajustar sensibilidade

### Semana 3-4: Analytics Básico
- [ ] Conectar Analytics frontend com backend
- [ ] Implementar queries reais
- [ ] Testar performance

### Semana 5-6: Melhorias UX
- [ ] Menos cliques no TPV
- [ ] Sugestões contextuais
- [ ] Atalhos inteligentes

---

## 📊 CRITÉRIO DE SUCESSO

**Cenário de Teste:**
1. Sistema detecta mesa sem pedido há 20min → Alerta aparece
2. Dono abre Analytics → Vê faturação diária imediatamente
3. Sistema sugere ação → Usuário segue sugestão → Funciona

**Resultado:** "O sistema pensa comigo, não por mim."

---

## 📚 DOCUMENTAÇÃO

- `FASE2_PLANO_ACAO.md` - Este documento
- `MANIFESTO.md` - Filosofia AppStaff
- `PHASE2_SPECIFICATION.md` - Especificação técnica

---

**Última atualização:** 2026-01-16
