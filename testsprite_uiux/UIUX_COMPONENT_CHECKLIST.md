# Checklist Visual por Componente — ChefIApp POS Core

**Objetivo:** Garantir consistência e qualidade em todos os componentes críticos

---

## 🎨 COMPONENTES BASE

### Button (Primário)
- [ ] Tamanho mínimo: 44x44px (mobile)
- [ ] Contraste: WCAG AA (4.5:1)
- [ ] Cor exclusiva para ação principal
- [ ] Ícone + texto quando aplicável
- [ ] Estado hover/active visível
- [ ] Estado disabled claro
- [ ] `data-testid="primary-cta"` ou `data-testid="secondary-cta"`

### Button (Secundário)
- [ ] Visualmente menos proeminente que primário
- [ ] Mesmo tamanho mínimo (44x44px)
- [ ] Contraste suficiente
- [ ] `data-testid="secondary-cta"`

### Input / Form Field
- [ ] Label sempre visível
- [ ] Placeholder como exemplo, não instrução
- [ ] Estado de erro claro (cor + mensagem)
- [ ] Foco visível (outline/keyboard)
- [ ] Tamanho de fonte legível (mínimo 16px mobile)

### Empty State
- [ ] Ícone ou ilustração
- [ ] Título claro: "O que é isso?"
- [ ] Descrição: "Por que está vazio?"
- [ ] CTA explícito: "O que fazer agora?"
- [ ] `data-testid="empty-state"`
- [ ] `data-testid="empty-state-cta"` no botão

### Loading State
- [ ] Mensagem contextual (não genérica)
- [ ] Skeleton quando conteúdo conhecido
- [ ] Spinner apenas quando necessário
- [ ] Tempo estimado quando aplicável
- [ ] `data-testid="loading-state"`

### Error State
- [ ] Mensagem humana (não técnica)
- [ ] Explicação do problema
- [ ] Ação de recuperação clara
- [ ] `data-testid="error-state"`
- [ ] `data-testid="error-state-retry"` no botão

---

## 📱 MÓDULOS ESPECÍFICOS

### TPV (POS)
- [ ] CTA "Novo Pedido" dominante (cor exclusiva, tamanho maior)
- [ ] Hierarquia visual clara (pedido > itens > ações)
- [ ] Empty state com instrução
- [ ] Feedback ao adicionar item
- [ ] Confirmação ao fechar pedido
- [ ] `data-testid="tpv-new-order"`
- [ ] `data-testid="tpv-order-list"`
- [ ] `data-testid="tpv-order-detail"`

### KDS (Kitchen)
- [ ] Código de cores por urgência
- [ ] Agrupamento visual por tempo
- [ ] Feedback ao marcar como pronto
- [ ] Hierarquia temporal clara
- [ ] `data-testid="kds-order-card"`
- [ ] `data-testid="kds-mark-ready"`

### AppStaff
- [ ] CTA "Concluir tarefa" grande e claro
- [ ] Feedback de sucesso emocional
- [ ] Transição entre modos visível
- [ ] Diferença visual Worker/Manager/Owner
- [ ] `data-testid="staff-task-stream"`
- [ ] `data-testid="staff-complete-task"`

### Inventory
- [ ] "O que fazer agora?" explícito
- [ ] CTAs contextuais (Comprar, Ajustar, Ignorar)
- [ ] Hunger signals visíveis
- [ ] Narrativa visual clara

### Onboarding
- [ ] Barra de progresso sempre visível
- [ ] Microcopy abaixo de CTAs
- [ ] Texto reduzido (bullets)
- [ ] Exemplos claros nos inputs

---

## ♿ ACESSIBILIDADE

### Contraste
- [ ] Texto normal: 4.5:1 (WCAG AA)
- [ ] Texto grande: 3:1 (WCAG AA)
- [ ] Botões: 4.5:1
- [ ] Links: 4.5:1 + sublinhado

### Foco
- [ ] Foco visível em todos os inputs
- [ ] Navegação por teclado funcional
- [ ] Tab order lógico

### Tamanho de Toque
- [ ] Mínimo 44x44px (mobile)
- [ ] Espaçamento entre elementos clicáveis

### Labels
- [ ] Todos os inputs têm label
- [ ] Labels associados corretamente (htmlFor/id)
- [ ] Placeholder não substitui label

---

## 📐 CONSISTÊNCIA VISUAL

### Espaçamento
- [ ] Sistema de espaçamento unificado (4px, 8px, 16px, 24px, 32px)
- [ ] Padding consistente em cards
- [ ] Margem consistente entre seções

### Tipografia
- [ ] Hierarquia clara (H1 > H2 > H3 > body)
- [ ] Tamanhos consistentes
- [ ] Pesos consistentes (regular, medium, bold)

### Cores
- [ ] Paleta unificada
- [ ] Semântica clara (sucesso, erro, atenção)
- [ ] Dark mode com contraste suficiente

### Ícones
- [ ] Biblioteca unificada
- [ ] Tamanhos consistentes
- [ ] Alinhamento correto com texto

---

## 🧪 TESTES VISUAIS

### Viewports
- [ ] Mobile small (320px) — funcional
- [ ] Mobile (375px) — ideal
- [ ] Tablet (768px) — layout adaptado
- [ ] Desktop (1024px+) — layout completo

### Estados
- [ ] Default — correto
- [ ] Loading — mensagem contextual
- [ ] Empty — instrução clara
- [ ] Error — recuperação possível
- [ ] Success — feedback claro
- [ ] Offline — modo funcional

---

## ✅ Checklist de Entrega

Antes de marcar componente como "pronto":

- [ ] Todos os estados testados
- [ ] Acessibilidade validada (Axe)
- [ ] Responsividade verificada (4 viewports)
- [ ] `data-testid` adicionados
- [ ] Documentação atualizada
- [ ] Screenshot capturado
- [ ] Teste manual executado

---

**Uso:** Marque cada item ao implementar/corrigir componente.

