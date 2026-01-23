# 🎯 FASE 2 — Plano de Implementação (Onboarding com Primeira Venda)

**Data:** 2026-01-30  
**Status:** 🔴 **INICIANDO**  
**Duração:** 1-2 semanas  
**Objetivo:** Primeira venda em <10 minutos desde o login

---

## Objetivo Claro

**Primeira venda em <10 minutos desde o login.**

---

## Entregas Necessárias

### 1. Menu de Exemplo ou Pedido Demo ✅ (Já existe parcialmente)

**Componentes:**
- `MenuDemo.tsx` — Criar menu de exemplo baseado no tipo de negócio
- `exampleMenus.ts` — Estrutura de dados para cada tipo
- Integração com `MenuBootstrapService` (já existe)

**Tipos de negócio:**
- Restaurante (Entradas, Principais, Bebidas)
- Café (Cafés, Doces, Salgados)
- Bar (Cervejas, Drinks, Petiscos)

**Opções:**
- "Usar Menu de Exemplo" (recomendado)
- "Criar Manualmente"

---

### 2. Fluxo Guiado até a Venda

**Componente:** `FirstSaleGuide.tsx`

**Tutorial visual passo a passo:**
1. "Abra o TPV"
2. "Selecione uma mesa (ou balcão)"
3. "Adicione itens do menu"
4. "Processe o pagamento"

**Funcionalidades:**
- Botão "Fazer Primeira Venda" (abre TPV em modo demo)
- Indicadores visuais (setas, highlights)
- Pode pular tutorial

---

### 3. Bloqueio de "Finalizar Onboarding" sem Venda

**Verificações:**
- Se menu não criado → mostrar aviso
- Se primeira venda não feita → mostrar aviso
- Não bloquear acesso ao dashboard (usuário pode voltar depois)

**Implementação:**
- Atualizar `FlowGate.tsx` ou criar componente de verificação
- Mostrar banner/alert no dashboard se onboarding incompleto

---

### 4. Modo Demo no TPV

**Funcionalidades:**
- Adicionar modo demo no `TPV.tsx`
- Dados pré-preenchidos (mesa 1, 2-3 itens no carrinho)
- Banner "Modo Demo" visível
- Botão "Processar Pagamento" (não cria pagamento real, só mostra sucesso)

**Parâmetros:**
- `?demo=true` na URL do TPV
- Ou state do router: `{ demo: true }`

---

## Ordem de Implementação

### Dia 1-2: Menu de Exemplo
1. Criar `MenuDemo.tsx`
2. Criar/atualizar `exampleMenus.ts`
3. Integrar com `MenuBootstrapService`
4. Adicionar ao fluxo de onboarding

### Dia 3-4: Tutorial de Primeira Venda
1. Criar `FirstSaleGuide.tsx`
2. Implementar passos do tutorial
3. Integrar com TPV (modo demo)
4. Adicionar ao fluxo de onboarding

### Dia 5-6: Modo Demo no TPV
1. Adicionar modo demo no `TPV.tsx`
2. Dados pré-preenchidos
3. Banner "Modo Demo"
4. Processamento fake de pagamento

### Dia 7-8: Verificações e Bloqueios
1. Verificar menu criado
2. Verificar primeira venda feita
3. Mostrar avisos no dashboard
4. Testes finais

---

## Arquivos a Criar/Modificar

### Novos
- `merchant-portal/src/pages/Onboarding/MenuDemo.tsx`
- `merchant-portal/src/pages/Onboarding/FirstSaleGuide.tsx`
- `merchant-portal/src/pages/Onboarding/exampleMenus.ts`

### Modificar
- `merchant-portal/src/pages/TPV/TPV.tsx` (modo demo)
- `merchant-portal/src/core/flow/FlowGate.tsx` (verificações)
- `merchant-portal/src/pages/Onboarding/OnboardingQuick.tsx` (integrar MenuDemo)
- `merchant-portal/src/App.tsx` (rotas)

---

## Critérios de Sucesso

**FASE 2 está completa quando:**
1. ✅ Menu é criado automaticamente (exemplo) OU manualmente (guiado)
2. ✅ Tutorial de primeira venda é mostrado
3. ✅ Modo demo permite testar sem dados reais
4. ✅ Primeira venda real pode ser feita em <10 minutos desde login
5. ✅ Usuário entende como usar o TPV após tutorial

---

**Próximo passo:** Criar `MenuDemo.tsx` e `exampleMenus.ts`
