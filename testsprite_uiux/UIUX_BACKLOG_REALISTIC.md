# Backlog UI/UX Realista (Corrigido)

**Data:** 2025-12-27  
**Versão:** 2.0.0 (Baseado em Leitura Realista)  
**Score Atual:** ~76/100 (ajustado)

---

## 🔴 S0 — BLOQUEADORES (Semana 1)

### S0-001: Bootstrap Travado (CRÍTICO)

**Módulo:** Bootstrap (`/app/bootstrap`)  
**Problema:** Timeout > 30s sem feedback, bloqueia 19 rotas  
**Impacto:** Sistema inacessível, confiança quebrada  
**Solução:** Ver `UIUX_BOOTSTRAP_FIX_PLAN.md`

**Arquivos:**
- `merchant-portal/src/pages/BootstrapPage.tsx`
- `merchant-portal/src/pages/BootstrapPage.css` (criar)

**Critério de aceite:**
- [ ] Bootstrap não trava por mais de 10s sem feedback
- [ ] Após 2s, mostra mensagem de progresso
- [ ] Após timeout, mostra opções de recuperação
- [ ] TestSprite passa no smoke test
- [ ] 19 rotas desbloqueadas

**Esforço:** 1-2 dias

---

## 🟠 S1 — CRÍTICOS (Semana 2)

### S1-001: Empty States Sem Instrução

**Módulo:** Transversal (TPV, Staff, Inventory, KDS)  
**Problema:** Estados vazios silenciosos, sem direção  
**Impacto:** Confusão, abandono  
**Solução:**
- [ ] Componente `EmptyState` reutilizável
- [ ] Responde 3 perguntas: O que? Por quê? O que fazer?
- [ ] CTA explícito

**Arquivos:**
- Criar: `merchant-portal/src/ui/components/EmptyState.tsx`
- Aplicar em: TPV, Staff, Inventory, KDS

**Critério de aceite:**
- [ ] Empty state tem CTA visível
- [ ] Texto explica contexto
- [ ] Usuário sabe próximo passo

**Esforço:** 2-3 dias

---

### S1-002: Hierarquia Visual no TPV

**Módulo:** TPV (`/app/tpv`)  
**Problema:** CTAs competem visualmente  
**Impacto:** Erro humano, tempo por pedido  
**Solução:**
- [ ] CTA primário dominante (cor exclusiva, tamanho maior)
- [ ] Hierarquia clara (pedido > itens > ações)

**Arquivos:**
- `merchant-portal/src/pages/TPV/TPV.tsx`
- `merchant-portal/src/ui/components/Button.tsx`

**Critério de aceite:**
- [ ] Em 3s, usuário identifica ação principal
- [ ] Teste: "O que você faria agora?" → 100% responde corretamente

**Esforço:** 1-2 dias

---

### S1-003: KDS Sem Urgência Visual

**Módulo:** KDS (`/app/kds`)  
**Problema:** Falta hierarquia temporal  
**Impacto:** Atrasos na cozinha  
**Solução:**
- [ ] Código de cores por urgência (vermelho/amarelo/verde)
- [ ] Agrupamento visual por tempo
- [ ] Feedback ao marcar como pronto

**Arquivos:**
- `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`

**Critério de aceite:**
- [ ] Em 2s, cozinheiro identifica pedido mais urgente
- [ ] Feedback claro ao marcar como pronto

**Esforço:** 2-3 dias

---

### S1-004: CTAs Pouco Óbvios

**Módulo:** Transversal  
**Problema:** Onde clicar nem sempre é óbvio  
**Impacto:** Atrito, hesitação  
**Solução:**
- [ ] Audit de todos os CTAs principais
- [ ] Tamanho mínimo: 44x44px (mobile)
- [ ] Contraste WCAG AA

**Arquivos:**
- `merchant-portal/src/ui/components/Button.tsx`
- Todos os módulos com CTAs

**Critério de aceite:**
- [ ] 100% dos CTAs principais têm contraste WCAG AA
- [ ] Tamanho mínimo respeitado

**Esforço:** 2-3 dias

---

### S1-005: Feedback de Sucesso Fraco

**Módulo:** AppStaff, TPV  
**Problema:** Conclusão sem feedback emocional  
**Impacto:** Falta de confiança  
**Solução:**
- [ ] Micro-animação ao concluir
- [ ] Som opcional (configurável)
- [ ] XP visível (AppStaff)

**Arquivos:**
- `merchant-portal/src/pages/AppStaff/WorkerTaskStream.tsx`
- `merchant-portal/src/pages/TPV/TPV.tsx`

**Critério de aceite:**
- [ ] Feedback imediato (<200ms)
- [ ] Usuário sente "sucesso" claramente

**Esforço:** 2-3 dias

---

## 🟡 S2 — MÉDIOS (Semana 3)

### S2-001: Onboarding Longo

**Módulo:** Onboarding (`/start/cinematic/*`)  
**Problema:** Carga cognitiva alta  
**Impacto:** Abandono  
**Solução:**
- [ ] Barra de progresso (ex: 3/7 etapas)
- [ ] Microcopy abaixo de CTAs
- [ ] Reduzir texto 20-30%

**Arquivos:**
- `merchant-portal/src/cinematic/scenes/*.tsx`

**Esforço:** 2-3 dias

---

### S2-002: Inventory Sem Guidance

**Módulo:** Inventory (`/app/inventory`)  
**Problema:** Informação densa, falta "o que fazer agora"  
**Impacto:** Inação  
**Solução:**
- [ ] "O que eu faço agora?" explícito
- [ ] CTAs contextuais (Comprar, Ajustar, Ignorar)

**Arquivos:**
- `merchant-portal/src/pages/Inventory/InventoryPage.tsx`

**Esforço:** 2-3 dias

---

### S2-003: Loading States Genéricos

**Módulo:** Transversal  
**Problema:** Spinner sem contexto  
**Impacto:** Ansiedade  
**Solução:**
- [ ] Mensagem contextual
- [ ] Skeleton quando possível

**Arquivos:**
- Criar: `merchant-portal/src/ui/components/LoadingState.tsx`

**Esforço:** 1-2 dias

---

## 🟢 S3 — BAIXOS (Semana 4)

### S3-001: Inconsistência de Botões

**Módulo:** Transversal  
**Problema:** Mesmo CTA com estilos diferentes  
**Impacto:** Confusão visual  
**Solução:**
- [ ] Audit de todos os botões
- [ ] Design system unificado

**Esforço:** 2-3 dias

---

### S3-002: Acessibilidade (A11y)

**Módulo:** Transversal  
**Problema:** Contraste, foco, tap targets  
**Impacto:** Inclusividade  
**Solução:**
- [ ] Contraste WCAG AA
- [ ] Foco visível
- [ ] Tap targets 44x44px

**Esforço:** 3-4 dias

---

## 📊 Resumo por Prioridade

| Prioridade | Quantidade | Esforço Estimado | Impacto |
|------------|------------|-----------------|---------|
| **S0 (Bloqueadores)** | 1 | 1-2 dias | 🔴 Crítico (19 rotas) |
| **S1 (Críticos)** | 5 | 10-14 dias | 🟠 Alto |
| **S2 (Médios)** | 3 | 5-8 dias | 🟡 Médio |
| **S3 (Baixos)** | 2 | 5-7 dias | 🟢 Baixo |
| **Total** | **11** | **21-31 dias** | |

---

## 🎯 Critérios de Aceite Global

- [ ] Score UI/UX ≥ 85/100 (real, não inflado)
- [ ] 0 issues S0
- [ ] ≤ 3 issues S1
- [ ] TestSprite passa em 100% das rotas críticas
- [ ] Bootstrap resiliente (timeout + feedback + recuperação)

---

## 🚀 Plano de Execução

### Semana 1 (S0)
1. **Bootstrap resiliente** (1-2 dias)
   - Timeout visível
   - Feedback de progresso
   - Opções de recuperação

### Semana 2 (S1 - Prioridade Alta)
2. **Empty states** (2-3 dias)
3. **Hierarquia TPV** (1-2 dias)
4. **KDS urgência** (2-3 dias)

### Semana 3 (S1 - Continuação)
5. **CTAs claros** (2-3 dias)
6. **Feedback de sucesso** (2-3 dias)

### Semana 4 (S2/S3 - Polimento)
7. **Onboarding** (2-3 dias)
8. **Inventory guidance** (2-3 dias)
9. **Loading states** (1-2 dias)
10. **A11y** (3-4 dias)

---

**Próximo passo:** Implementar S0-001 (Bootstrap) primeiro.

