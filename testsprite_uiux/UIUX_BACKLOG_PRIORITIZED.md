# UI/UX Backlog Priorizado — ChefIApp POS Core

**Data:** 2025-12-27  
**Baseado em:** Auditoria Estratégica UI/UX

---

## 🔴 S0 — BLOQUEADORES (Semana 1)

### S0-001: Hierarquia Visual no TPV
**Módulo:** TPV (`/app/tpv`)  
**Problema:** Novo pedido, itens e fechar mesa competem visualmente  
**Impacto:** Erro humano, tempo por pedido aumenta  
**Solução:**
- [ ] Um CTA primário dominante por tela
- [ ] Cor exclusiva para "Nova Order" (ex: verde #2a9d3e)
- [ ] Tamanho maior para ação principal
- [ ] Espaçamento que cria hierarquia clara

**Arquivos:**
- `merchant-portal/src/pages/TPV/TPV.tsx`
- `merchant-portal/src/ui/components/Button.tsx`

**Critério de aceite:**
- Em 3s, usuário identifica ação principal sem pensar
- Teste: "O que você faria agora?" → 100% responde corretamente

---

### S0-002: Empty States Sem Instrução
**Módulo:** Transversal (TPV, Staff, Inventory, KDS)  
**Problema:** Estados vazios silenciosos, sem direção  
**Impacto:** Confusão, abandono, falta de confiança  
**Solução:**
- [ ] Todo empty state responde 3 perguntas:
  1. O que é isso? (título claro)
  2. Por que está vazio? (explicação breve)
  3. O que eu faço agora? (CTA explícito)

**Arquivos:**
- Criar componente: `merchant-portal/src/ui/components/EmptyState.tsx`
- Aplicar em: TPV, Staff, Inventory, KDS

**Exemplo:**
```tsx
<EmptyState
  icon="🍽️"
  title="Nenhum pedido ativo"
  description="Quando você criar um pedido, ele aparecerá aqui"
  action={{ label: "Criar primeiro pedido", onClick: handleCreate }}
/>
```

**Critério de aceite:**
- Empty state tem CTA visível
- Texto explica contexto
- Usuário sabe próximo passo

---

### S0-003: KDS Sem Urgência Visual
**Módulo:** KDS (`/app/kds`)  
**Problema:** Falta hierarquia temporal, não fica claro o que é urgente  
**Impacto:** Atrasos na cozinha, pedidos esquecidos  
**Solução:**
- [ ] Código de cores por urgência:
  - 🔴 Vermelho: >15min (crítico)
  - 🟡 Amarelo: 10-15min (atenção)
  - 🟢 Verde: <10min (normal)
- [ ] Agrupamento visual por tempo
- [ ] Animação/som ao concluir pedido

**Arquivos:**
- `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`

**Critério de aceite:**
- Em 2s, cozinheiro identifica pedido mais urgente
- Feedback claro ao marcar como pronto

---

## 🟠 S1 — CRÍTICOS (Semana 2)

### S1-001: CTAs Pouco Óbvios
**Módulo:** Transversal  
**Problema:** Onde clicar nem sempre é óbvio  
**Impacto:** Atrito, hesitação, cliques errados  
**Solução:**
- [ ] Audit de todos os CTAs principais
- [ ] Tamanho mínimo: 44x44px (mobile)
- [ ] Contraste suficiente (WCAG AA)
- [ ] Ícone + texto quando possível

**Arquivos:**
- `merchant-portal/src/ui/components/Button.tsx`
- Todos os módulos com CTAs

**Critério de aceite:**
- 100% dos CTAs principais têm contraste WCAG AA
- Tamanho mínimo respeitado

---

### S1-002: Feedback de Sucesso Fraco
**Módulo:** AppStaff, TPV  
**Problema:** Conclusão de tarefa/pedido sem feedback emocional  
**Impacto:** Falta de confiança, dúvida se funcionou  
**Solução:**
- [ ] Micro-animação ao concluir
- [ ] Som opcional (configurável)
- [ ] XP visível (AppStaff)
- [ ] Mensagem de confirmação clara

**Arquivos:**
- `merchant-portal/src/pages/AppStaff/WorkerTaskStream.tsx`
- `merchant-portal/src/pages/TPV/TPV.tsx`

**Critério de aceite:**
- Feedback imediato (<200ms)
- Usuário sente "sucesso" claramente

---

### S1-003: Onboarding Longo
**Módulo:** Onboarding (`/start/cinematic/*`)  
**Problema:** Carga cognitiva alta, falta progresso claro  
**Impacto:** Abandono, cansaço  
**Solução:**
- [ ] Barra de progresso (ex: 3/7 etapas)
- [ ] Microcopy abaixo de CTAs: "Isso pode ser alterado depois"
- [ ] Reduzir texto em 20-30%
- [ ] Bullets ao invés de parágrafos

**Arquivos:**
- `merchant-portal/src/cinematic/scenes/*.tsx`

**Critério de aceite:**
- Progresso sempre visível
- Texto reduzido em 25%
- Usuário sabe quanto falta

---

### S1-004: Inventory Sem Guidance
**Módulo:** Inventory (`/app/inventory`)  
**Problema:** Informação densa, falta "o que fazer agora"  
**Impacto:** Inação, confusão  
**Solução:**
- [ ] "O que eu faço agora?" explícito
- [ ] CTAs contextuais (Comprar, Ajustar, Ignorar)
- [ ] Narrativa visual (ícones, cores)

**Arquivos:**
- `merchant-portal/src/pages/Inventory/InventoryPage.tsx`

**Critério de aceite:**
- Ação principal sempre visível
- Contexto claro de cada decisão

---

### S1-005: Loading States Genéricos
**Módulo:** Transversal  
**Problema:** Spinner sem contexto  
**Impacto:** Ansiedade, dúvida  
**Solução:**
- [ ] Mensagem contextual: "Reconectando seu restaurante…"
- [ ] Skeleton ao invés de spinner quando possível
- [ ] Tempo estimado quando aplicável

**Arquivos:**
- Criar componente: `merchant-portal/src/ui/components/LoadingState.tsx`

**Critério de aceite:**
- Loading sempre tem mensagem
- Skeleton para conteúdo conhecido

---

## 🟡 S2 — MÉDIOS (Semana 3)

### S2-001: Inconsistência de Botões
**Módulo:** Transversal  
**Problema:** Mesmo CTA com estilos diferentes  
**Impacto:** Confusão visual  
**Solução:**
- [ ] Audit de todos os botões
- [ ] Design system unificado
- [ ] Documentação de uso

**Arquivos:**
- `merchant-portal/src/ui/components/Button.tsx`
- `merchant-portal/src/ui/design-system/Button.tsx`

---

### S2-002: Auth/Bootstrap Loading Genérico
**Módulo:** Auth (`/app/auth`, `/app/bootstrap`)  
**Problema:** Tela de loading sem contexto  
**Impacto:** Ansiedade  
**Solução:**
- [ ] Mensagem contextual
- [ ] Progresso quando possível

**Arquivos:**
- `merchant-portal/src/pages/AuthPage.tsx`
- `merchant-portal/src/pages/BootstrapPage.tsx`

---

### S2-003: Setup Wizard Pesado
**Módulo:** Setup (`/app/setup/*`)  
**Problema:** Muitas decisões seguidas  
**Impacto:** Cansaço  
**Solução:**
- [ ] Pré-preencher opções comuns (80/20)
- [ ] Marcar steps como "opcional"
- [ ] Mostrar impacto de cada decisão

**Arquivos:**
- `merchant-portal/src/pages/steps/*.tsx`

---

## 🟢 S3 — BAIXOS (Polimento)

### S3-001: Pequenos Desalinhamentos Visuais
**Módulo:** Transversal  
**Problema:** Espaçamento inconsistente  
**Impacto:** Polimento  
**Solução:**
- [ ] Audit visual completo
- [ ] Design tokens unificados

---

### S3-002: AppStaff Transições Confusas
**Módulo:** AppStaff (`/app/staff`)  
**Problema:** Transição entre modos pouco clara  
**Impacto:** Confusão  
**Solução:**
- [ ] Indicador visual de modo ativo
- [ ] Animação de transição

---

## 📊 Resumo por Prioridade

| Prioridade | Quantidade | Esforço Estimado |
|------------|------------|------------------|
| S0 (Bloqueadores) | 3 | 3-5 dias |
| S1 (Críticos) | 5 | 5-7 dias |
| S2 (Médios) | 3 | 3-4 dias |
| S3 (Baixos) | 2 | 2-3 dias |
| **Total** | **13** | **13-19 dias** |

---

## 🎯 Critérios de Aceite Global

- [ ] Score UI/UX ≥ 85/100
- [ ] 0 issues S0
- [ ] ≤ 3 issues S1
- [ ] TestSprite passa em 100% das rotas críticas
- [ ] A11y report com ≤ 5 violações críticas

---

**Próximo passo:** Executar correções S0 na Semana 1.

