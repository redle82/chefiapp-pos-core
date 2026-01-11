# Owner Prompt System - Estrutura Conceitual

**Data**: 2025-01-27  
**Status**: 🧠 **CONCEITO DEFINIDO** (Implementação futura)

---

## 🎯 Objetivo

Criar um sistema de "próximos passos recomendados" que fecha o ciclo de soberania do dono, transformando o sistema de reativo para proativo.

---

## 💡 Princípio Fundamental

> **"O sistema não só mostra o que está acontecendo, mas pergunta: 'O que você quer fazer agora com o seu restaurante?'"**

---

## 🧠 Arquitetura Conceitual

### 1. Tipos de Prompts

#### A. Prompts de Oportunidade
**Objetivo**: Mostrar ações que geram valor imediato

**Exemplos**:
- "Você ainda não publicou seu site público. Restaurantes publicados têm em média +18% de pedidos."
- "Seu menu tem apenas 3 itens. Menus com 10+ itens geram 2x mais pedidos."
- "Você ainda não configurou pagamentos online. 60% dos pedidos vêm de clientes que preferem pagar online."

#### B. Prompts de Risco
**Objetivo**: Alertar sobre problemas iminentes

**Exemplos**:
- "Seu certificado HACCP expira em 5 dias. Renove agora para evitar multas."
- "Você tem 3 itens sem foto. Itens com foto vendem 40% mais."
- "Nenhum funcionário foi adicionado. Adicione sua equipe para começar a operar."

#### C. Prompts de Crescimento
**Objetivo**: Sugerir próximos passos estratégicos

**Exemplos**:
- "Você já tem 50 pedidos. Considere ativar automação para economizar tempo."
- "Seu ticket médio é €15. Restaurantes similares alcançam €22 com combos."
- "Você recebeu 5 avaliações positivas. Publique-as no seu site para aumentar confiança."

---

## 📊 Estrutura de Dados

### Interface TypeScript

```typescript
interface OwnerPrompt {
    id: string;
    type: 'opportunity' | 'risk' | 'growth';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    metric?: string; // Ex: "+18% de pedidos"
    action: {
        label: string;
        route: string;
        variant: 'primary' | 'secondary' | 'warning';
    };
    dismissible: boolean;
    shownAt?: string; // Timestamp da última vez que foi mostrado
    dismissedAt?: string; // Timestamp de quando foi dispensado
    conditions: PromptCondition[]; // Quando mostrar este prompt
}

interface PromptCondition {
    field: string; // Ex: 'site_published', 'menu_items_count'
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'is_null';
    value: any;
}
```

### Exemplo de Prompt

```typescript
const siteNotPublishedPrompt: OwnerPrompt = {
    id: 'site_not_published',
    type: 'opportunity',
    priority: 'high',
    title: 'Publique seu site público',
    description: 'Você ainda não publicou seu site público. Restaurantes publicados têm em média +18% de pedidos.',
    metric: '+18% de pedidos',
    action: {
        label: 'Publicar agora',
        route: '/app/setup/publish',
        variant: 'primary'
    },
    dismissible: true,
    conditions: [
        { field: 'site_published', operator: 'equals', value: false }
    ]
};
```

---

## 🎨 Componente Visual

### `OwnerPromptCard.tsx`

```typescript
interface OwnerPromptCardProps {
    prompt: OwnerPrompt;
    onDismiss?: (id: string) => void;
    onAction?: (action: OwnerPrompt['action']) => void;
}

export const OwnerPromptCard: React.FC<OwnerPromptCardProps> = ({ prompt, onDismiss, onAction }) => {
    const getIcon = () => {
        if (prompt.type === 'opportunity') return '💡';
        if (prompt.type === 'risk') return '⚠️';
        if (prompt.type === 'growth') return '📈';
        return '💡';
    };

    const getColor = () => {
        if (prompt.type === 'risk') return colors.destructive.base;
        if (prompt.type === 'opportunity') return colors.success.base;
        return colors.primary.base;
    };

    return (
        <Card 
            surface="layer2" 
            padding="lg"
            style={{ 
                borderLeft: `4px solid ${getColor()}`,
                backgroundColor: `${getColor()}08`
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Text size="lg">{getIcon()}</Text>
                        <Text size="lg" weight="bold" color="primary">{prompt.title}</Text>
                        {prompt.priority === 'high' && (
                            <Badge status="new" variant="outline" label="Importante" />
                        )}
                    </div>
                    <Text size="sm" color="secondary" style={{ marginBottom: 8 }}>
                        {prompt.description}
                    </Text>
                    {prompt.metric && (
                        <Text size="xs" color="success" weight="bold" style={{ marginBottom: 12 }}>
                            {prompt.metric}
                        </Text>
                    )}
                    <Button 
                        variant="solid" 
                        size="sm"
                        onClick={() => onAction?.(prompt.action)}
                    >
                        {prompt.action.label}
                    </Button>
                </div>
                {prompt.dismissible && (
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onDismiss?.(prompt.id)}
                    >
                        ✕
                    </Button>
                )}
            </div>
        </Card>
    );
};
```

---

## 🔄 Sistema de Avaliação

### Engine de Prompts

```typescript
class PromptEngine {
    private prompts: OwnerPrompt[] = [];
    private restaurantState: RestaurantState;

    constructor(restaurantState: RestaurantState) {
        this.restaurantState = restaurantState;
        this.loadPrompts();
    }

    evaluate(): OwnerPrompt[] {
        return this.prompts
            .filter(prompt => this.matchesConditions(prompt))
            .filter(prompt => !this.isDismissed(prompt))
            .sort((a, b) => this.getPriorityWeight(b) - this.getPriorityWeight(a))
            .slice(0, 3); // Máximo 3 prompts por vez
    }

    private matchesConditions(prompt: OwnerPrompt): boolean {
        return prompt.conditions.every(condition => {
            const value = this.restaurantState[condition.field];
            
            switch (condition.operator) {
                case 'equals':
                    return value === condition.value;
                case 'not_equals':
                    return value !== condition.value;
                case 'greater_than':
                    return value > condition.value;
                case 'less_than':
                    return value < condition.value;
                case 'is_null':
                    return value === null || value === undefined;
                default:
                    return false;
            }
        });
    }

    private getPriorityWeight(prompt: OwnerPrompt): number {
        const typeWeight = {
            'risk': 3,
            'opportunity': 2,
            'growth': 1
        };
        const priorityWeight = {
            'high': 3,
            'medium': 2,
            'low': 1
        };
        return typeWeight[prompt.type] * priorityWeight[prompt.priority];
    }
}
```

---

## 📍 Posicionamento no Dashboard

### Opção A: Seção Dedicada (Recomendado)

```
Comando Central
├── KPIs
├── Owner Hub (3 cards)
├── 💡 Próximos Passos Recomendados ⭐ NOVO
│   ├── Prompt 1 (alta prioridade)
│   ├── Prompt 2 (média prioridade)
│   └── Prompt 3 (baixa prioridade)
├── Visibilidade do Menu
└── Ações Imediatas
```

### Opção B: Integrado no Owner Hub

Adicionar um 4º card no Owner Hub:
- "💡 Próximos Passos" (colapsável)

---

## 🎯 Regras de Negócio

### Quando Mostrar

1. **Primeira visita**: Sempre mostrar pelo menos 1 prompt de oportunidade
2. **Após ação**: Não mostrar o mesmo prompt por 7 dias
3. **Prioridade**: Máximo 3 prompts simultâneos
4. **Dispensável**: Usuário pode dispensar, mas prompt pode reaparecer após 30 dias se condição persistir

### Quando Não Mostrar

1. **Wizard ativo**: Não mostrar durante onboarding
2. **Muitos prompts**: Se já há 3 prompts, não adicionar mais
3. **Dispensado recentemente**: Não mostrar por 7 dias após dispensar

---

## 🚀 Próximos Passos (Quando Implementar)

1. **Definir prompts iniciais** (5-10 prompts de alta qualidade)
2. **Criar `PromptEngine`** com lógica de avaliação
3. **Criar componente `OwnerPromptCard`**
4. **Integrar no Dashboard** (seção dedicada ou card no Owner Hub)
5. **Adicionar tracking** (quais prompts são clicados, dispensados, etc.)
6. **A/B testing** (testar diferentes textos, posicionamentos, etc.)

---

## 📊 Métricas de Sucesso

- **Taxa de clique**: % de prompts que resultam em ação
- **Taxa de dispensa**: % de prompts dispensados
- **Conversão**: % de prompts que resultam em conclusão da ação sugerida
- **Tempo até ação**: Quanto tempo leva do prompt até a ação

---

## 🧠 Notas Estratégicas

### Por que isso importa

1. **Fechar o ciclo**: Sistema não só mostra, mas guia
2. **Reduzir fricção**: Dono não precisa descobrir o que fazer
3. **Aumentar engajamento**: Prompts geram ações que geram valor
4. **Diferencial competitivo**: Poucos TPVs fazem isso bem

### Riscos a Evitar

1. **Sobrecarregar**: Máximo 3 prompts por vez
2. **Ser intrusivo**: Prompts devem ser úteis, não irritantes
3. **Ser genérico**: Prompts devem ser específicos e acionáveis
4. **Ignorar contexto**: Prompts devem respeitar o estado atual do restaurante

---

**Status**: 🧠 **CONCEITO DEFINIDO - PRONTO PARA IMPLEMENTAÇÃO FUTURA**

