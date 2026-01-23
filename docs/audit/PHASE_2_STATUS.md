# 📊 FASE 2 — Status de Implementação (Onboarding com Primeira Venda)

**Data:** 2026-01-30  
**Status:** 🟢 **60% COMPLETO**  
**Progresso:** Componentes principais implementados

---

## ✅ Componentes Criados

### 1. MenuDemo.tsx ✅
- **Arquivo:** `merchant-portal/src/pages/Onboarding/MenuDemo.tsx`
- **Status:** Criado
- **Funcionalidades:**
  - Oferece menu de exemplo baseado no tipo de negócio
  - Opção "Usar Menu de Exemplo" (recomendado)
  - Opção "Criar Manualmente" (redireciona para MenuManager)
  - Integração com MenuBootstrapService
  - Cria categorias e itens diretamente no banco

### 2. FirstSaleGuide.tsx ✅
- **Arquivo:** `merchant-portal/src/pages/Onboarding/FirstSaleGuide.tsx`
- **Status:** Criado
- **Funcionalidades:**
  - Tutorial visual passo a passo (4 passos)
  - Navegação entre passos
  - Botão "Fazer Primeira Venda" (abre TPV em modo demo)
  - Pode pular tutorial

### 3. useOnboardingStatus.ts ✅
- **Arquivo:** `merchant-portal/src/hooks/useOnboardingStatus.ts`
- **Status:** Criado
- **Funcionalidades:**
  - Verifica se menu foi criado (contar itens em gm_products)
  - Verifica se primeira venda foi feita (contar pedidos em gm_orders)
  - Polling a cada 30 segundos

### 4. OnboardingReminder.tsx ✅
- **Arquivo:** `merchant-portal/src/components/OnboardingReminder.tsx`
- **Status:** Criado
- **Funcionalidades:**
  - Mostra banner se menu não criado
  - Mostra banner se primeira venda não feita
  - Botões para completar onboarding
  - Não bloqueia acesso (usuário pode voltar depois)

---

## ✅ Atualizações Realizadas

### 1. TrialStart.tsx ✅
- **Mudança:** Redireciona para `/onboarding/menu-demo` após trial
- **Status:** Atualizado

### 2. App.tsx ✅
- **Mudança:** Adicionadas rotas `/onboarding/menu-demo` e `/onboarding/first-sale-guide`
- **Status:** Atualizado

### 3. DashboardZero.tsx ✅
- **Mudança:** Integrado `OnboardingReminder` no dashboard
- **Status:** Atualizado

### 4. TPV.tsx ✅
- **Mudança:** 
  - Detecção de modo demo via URL (`?demo=true`)
  - Banner "Modo Demo" quando ativo
  - Pré-preenchimento de dados em modo demo
  - Simulação de pagamento em modo demo
- **Status:** Atualizado

### 5. PaymentModal.tsx ✅
- **Mudança:** Suporte para modo demo (simula pagamento)
- **Status:** Atualizado

---

## 🔴 Pendências

### 1. Verificação de Menu no FlowGate (Opcional)
- [ ] Adicionar verificação opcional em `FlowGate.tsx`
- **Status:** 🟡 Opcional (OnboardingReminder já faz isso)

### 2. Testes do Fluxo Completo
- [ ] Testar fluxo: Trial → MenuDemo → FirstSaleGuide → TPV Demo → Venda Real
- [ ] Medir tempo: Login → Primeira Venda Real
- [ ] Verificar se usuário entende após tutorial

### 3. Melhorias no Modo Demo
- [ ] Adicionar mais dados pré-preenchidos (se necessário)
- [ ] Melhorar feedback visual no modo demo

---

## 📋 Checklist Técnico

### Frontend (Criar/Atualizar)
- [x] `MenuDemo.tsx` (NOVO) ✅
- [x] `FirstSaleGuide.tsx` (NOVO) ✅
- [x] `useOnboardingStatus.ts` (NOVO) ✅
- [x] `OnboardingReminder.tsx` (NOVO) ✅
- [x] Rotas adicionadas no App.tsx ✅
- [x] TrialStart atualizado (redireciona para MenuDemo) ✅
- [x] TPV atualizado (modo demo) ✅
- [x] PaymentModal atualizado (simula pagamento) ✅
- [x] DashboardZero integrado (OnboardingReminder) ✅
- [ ] Atualizar `FlowGate.tsx` (verificar menu criado - opcional) 🟡
- [ ] Testes do fluxo completo 🔴

---

## 🧪 Testes Necessários

### Teste 1: Fluxo Completo
- [ ] Criar novo usuário
- [ ] Completar OnboardingQuick
- [ ] Escolher plano (trial)
- [ ] Criar menu de exemplo
- [ ] Ver tutorial de primeira venda
- [ ] Fazer primeira venda em modo demo
- [ ] Fazer primeira venda real
- [ ] Medir tempo total

### Teste 2: OnboardingReminder
- [ ] Verificar banner aparece se menu não criado
- [ ] Verificar banner aparece se primeira venda não feita
- [ ] Verificar botões funcionam corretamente

### Teste 3: Modo Demo
- [ ] Verificar TPV abre em modo demo com `?demo=true`
- [ ] Verificar banner "Modo Demo" aparece
- [ ] Verificar dados pré-preenchidos
- [ ] Verificar pagamento simulado funciona

---

## 📊 Progresso Atual

**60% completo**

- ✅ Componentes principais criados (MenuDemo, FirstSaleGuide)
- ✅ Hooks criados (useOnboardingStatus)
- ✅ Integração no dashboard (OnboardingReminder)
- ✅ Modo demo no TPV
- ✅ Rotas configuradas
- 🔴 Testes não executados
- 🟡 FlowGate (opcional)

---

## 🎯 Critérios de Pronto

**FASE 2 está completa quando:**
1. ✅ Menu é criado automaticamente (exemplo) OU manualmente (guiado) — **IMPLEMENTADO**
2. ✅ Tutorial de primeira venda é mostrado — **IMPLEMENTADO**
3. ✅ Modo demo permite testar sem dados reais — **IMPLEMENTADO**
4. ⏳ Primeira venda real pode ser feita em <10 minutos desde login — **PENDENTE TESTE**
5. ⏳ Usuário entende como usar o TPV após tutorial — **PENDENTE TESTE**

**Meta:** <10 minutos do login até primeira venda real

---

**Próximo passo:** Testar fluxo completo e medir tempo
