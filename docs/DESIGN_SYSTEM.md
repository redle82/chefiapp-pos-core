# 🎨 Design System - ChefIApp

**Status:** 📋 **DESIGN SYSTEM DEFINIDO**  
**Objetivo:** Componentes reutilizáveis e hierarquia visual consistente

---

## 🧠 FILOSOFIA VISUAL

### Princípios

1. **Clareza sobre Beleza**
   - Informação clara > Design bonito
   - Hierarquia visual clara
   - Contraste adequado

2. **Verdade Visual**
   - Cores refletem estado real (verde = OK, vermelho = problema)
   - Nunca mascarar problemas com cores neutras
   - Estados ilegais são claramente visíveis

3. **Ação sobre Informação**
   - Botões de ação são claros e visíveis
   - Informação secundária é discreta
   - Hierarquia: Ação > Informação > Dados brutos

---

## 🎨 PALETA DE CORES

### Status
- 🟢 **Verde (#28a745)**: OK, saudável, dentro do esperado
- 🟡 **Amarelo (#ffc107)**: Atenção, risco médio
- 🔴 **Vermelho (#dc3545)**: Crítico, ação imediata
- ⚪ **Cinza (#6c757d)**: Neutro, informativo

### Ações
- 🔵 **Azul (#667eea)**: Ação primária
- ⚫ **Preto (#000)**: Ação secundária
- ⚪ **Branco (#fff)**: Fundo, contraste

### Backgrounds
- **Branco (#fff)**: Fundo principal
- **Cinza claro (#f8f9fa)**: Cards, seções
- **Cinza médio (#e0e0e0)**: Bordas, separadores

---

## 📐 HIERARQUIA VISUAL

### Níveis de Importância

1. **Crítico (Nível 1)**
   - Tamanho: Grande (18-24px)
   - Peso: Bold (600-700)
   - Cor: Vermelho ou Amarelo
   - Uso: Alertas, ações urgentes

2. **Importante (Nível 2)**
   - Tamanho: Médio (16-18px)
   - Peso: Semi-bold (500-600)
   - Cor: Preto ou Azul
   - Uso: Títulos, ações principais

3. **Informativo (Nível 3)**
   - Tamanho: Pequeno (14-16px)
   - Peso: Regular (400)
   - Cor: Cinza escuro (#333)
   - Uso: Descrições, informações secundárias

4. **Secundário (Nível 4)**
   - Tamanho: Muito pequeno (12-14px)
   - Peso: Regular (400)
   - Cor: Cinza (#666)
   - Uso: Metadados, timestamps

---

## 🧩 COMPONENTES REUTILIZÁVEIS

### 1. StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info';
  label: string;
  size?: 'small' | 'medium';
}

// Uso:
<StatusBadge status="danger" label="Crítico" />
<StatusBadge status="warning" label="Atenção" />
<StatusBadge status="success" label="OK" />
```

**Visual:**
```
┌─────────┐
│ 🔴 Crítico │
└─────────┘
```

---

### 2. AlertCard

```typescript
interface AlertCardProps {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Uso:
<AlertCard
  severity="critical"
  title="Estoque crítico: Tomate (0kg)"
  message="Ação: Comprar agora"
  action={{ label: "Comprar", onPress: () => {} }}
/>
```

**Visual:**
```
┌─────────────────────────────────┐
│ 🔴 Estoque crítico: Tomate (0kg) │
│    Ação: Comprar agora           │
│    [Comprar]                     │
└─────────────────────────────────┘
```

---

### 3. MetricCard

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  variation?: {
    value: number;
    isPositive: boolean;
  };
  trend?: 'up' | 'down' | 'stable';
}

// Uso:
<MetricCard
  title="Pedidos Hoje"
  value={156}
  variation={{ value: 12, isPositive: true }}
  trend="up"
/>
```

**Visual:**
```
┌─────────────────────┐
│ Pedidos Hoje        │
│ 156                 │
│ +12% vs ontem ↑     │
└─────────────────────┘
```

---

### 4. ActionButton

```typescript
interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

// Uso:
<ActionButton
  label="Comprar agora"
  onPress={() => {}}
  variant="primary"
  size="medium"
/>
```

**Visual:**
```
┌──────────────────┐
│  Comprar agora   │
└──────────────────┘
```

---

### 5. TimelineItem

```typescript
interface TimelineItemProps {
  time: string;
  event: string;
  severity?: 'critical' | 'warning' | 'info';
}

// Uso:
<TimelineItem
  time="14:30"
  event="Estoque crítico: Tomate"
  severity="critical"
/>
```

**Visual:**
```
14:30 █ Estoque crítico: Tomate
```

---

### 6. ProgressBar

```typescript
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

// Uso:
<ProgressBar
  current={23}
  total={50}
  label="Pedidos"
  showPercentage
/>
```

**Visual:**
```
Pedidos: 23/50 (46%)
████████████░░░░░░░░░░
```

---

### 7. EmptyState

```typescript
interface EmptyStateProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

// Uso:
<EmptyState
  title="Nenhuma reserva hoje"
  message="Crie reservas para organizar a agenda"
  action={{ label: "Nova reserva", onPress: () => {} }}
/>
```

**Visual:**
```
     📭
     
Nenhuma reserva hoje

Crie reservas para organizar a agenda

[Nova reserva]
```

---

### 8. FilterTabs

```typescript
interface FilterTabsProps {
  options: Array<{ id: string; label: string }>;
  selected: string;
  onSelect: (id: string) => void;
}

// Uso:
<FilterTabs
  options={[
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendentes' }
  ]}
  selected="all"
  onSelect={(id) => {}}
/>
```

**Visual:**
```
┌──────┐ ┌──────────┐
│ Todas│ │ Pendentes│
└──────┘ └──────────┘
```

---

### 9. Card

```typescript
interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'highlighted' | 'alert';
}

// Uso:
<Card
  title="Pedido #123"
  variant="alert"
  onPress={() => {}}
>
  <div>Mesa 5 - Em preparo</div>
</Card>
```

**Visual:**
```
┌─────────────────────┐
│ Pedido #123         │
│ Mesa 5 - Em preparo  │
└─────────────────────┘
```

---

### 10. MentorMessage

```typescript
interface MentorMessageProps {
  title: string;
  message: string;
  action?: {
    what: string;
    why: string;
    how: string;
  };
  context?: string;
  onFeedback?: (helpful: boolean) => void;
}

// Uso:
<MentorMessage
  title="O que fazer agora"
  message="Adicionar 1 pessoa no turno das 20h"
  action={{
    what: "Adicionar pessoa",
    why: "Previsão: 12 reservas",
    how: "Ver escala e adicionar"
  }}
  context="Baseado em: 3 atrasos hoje"
  onFeedback={(helpful) => {}}
/>
```

**Visual:**
```
┌─────────────────────────────────┐
│ O que fazer agora               │
│                                 │
│ Adicionar 1 pessoa no turno    │
│ das 20h. Previsão: 12 reservas  │
│                                 │
│ Contexto: Baseado em: 3 atrasos│
│                                 │
│ Ação Sugerida:                  │
│ O que: Adicionar pessoa         │
│ Por quê: Previsão: 12 reservas  │
│ Como: Ver escala e adicionar    │
│                                 │
│ [Aplicar] [Ver detalhes]       │
│                                 │
│ [Foi útil] [Não foi útil]      │
└─────────────────────────────────┘
```

---

## 📱 LAYOUTS

### Layout Principal

```
┌─────────────────────────────────────┐
│ Header                               │
├─────────────────────────────────────┤
│                                     │
│  Content (scrollable)               │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Bottom Tabs                         │
└─────────────────────────────────────┘
```

### Layout de Detalhes

```
┌─────────────────────────────────────┐
│ Header (com back)                    │
├─────────────────────────────────────┤
│                                     │
│  Content (scrollable)               │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 PADRÕES DE INTERAÇÃO

### 1. Navegação
- **Bottom Tabs**: Navegação principal por perfil
- **Back Button**: Sempre visível em telas de detalhes
- **Breadcrumbs**: Opcional em telas profundas

### 2. Ações
- **Botão Primário**: Ação principal (azul, grande)
- **Botão Secundário**: Ação alternativa (cinza, médio)
- **Botão Perigoso**: Ação destrutiva (vermelho, médio)

### 3. Feedback
- **Toast**: Feedback rápido (sucesso, erro)
- **Loading**: Estado de carregamento
- **Empty State**: Quando não há dados

### 4. Estados
- **Loading**: Skeleton ou spinner
- **Error**: Mensagem clara + ação
- **Empty**: EmptyState component
- **Success**: Confirmação visual

---

## 📏 ESPAÇAMENTO

### Grid
- **Padding**: 16px (padrão), 24px (grande)
- **Gap**: 8px (pequeno), 12px (médio), 16px (grande)
- **Margin**: 16px (padrão), 24px (seções)

### Tamanhos
- **Card**: Padding 16px, Border radius 12px
- **Button**: Padding 12px vertical, 24px horizontal
- **Input**: Padding 12px, Border radius 8px

---

## 🔤 TIPOGRAFIA

### Fontes
- **Título**: 18-24px, Bold (600-700)
- **Subtítulo**: 16-18px, Semi-bold (500-600)
- **Corpo**: 14-16px, Regular (400)
- **Pequeno**: 12-14px, Regular (400)

### Hierarquia
1. **H1**: Título principal (24px, Bold)
2. **H2**: Título de seção (18px, Semi-bold)
3. **H3**: Título de card (16px, Semi-bold)
4. **Body**: Texto normal (14px, Regular)
5. **Small**: Texto secundário (12px, Regular)

---

## 🎨 ESTADOS VISUAIS

### Hover
- **Card**: Sombra leve, cursor pointer
- **Button**: Escurecer 10%
- **Link**: Sublinhar

### Active
- **Button**: Escurecer 20%
- **Tab**: Destaque visual

### Disabled
- **Button**: Opacidade 50%, cursor not-allowed
- **Input**: Background cinza claro

### Focus
- **Input**: Borda azul, outline visível
- **Button**: Outline visível

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Componentes Base
- [ ] StatusBadge
- [ ] AlertCard
- [ ] MetricCard
- [ ] ActionButton
- [ ] TimelineItem
- [ ] ProgressBar
- [ ] EmptyState
- [ ] FilterTabs
- [ ] Card
- [ ] MentorMessage

### Layouts
- [ ] Layout Principal
- [ ] Layout de Detalhes
- [ ] Header
- [ ] Bottom Tabs

### Estados
- [ ] Loading
- [ ] Error
- [ ] Empty
- [ ] Success

---

**Última atualização:** 2026-01-27
