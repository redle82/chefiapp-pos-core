# 🎯 Porcionamento & Custo Real — Guia de Implementação

**Data**: 2025-01-02  
**Status**: ✅ Schema Pronto | ⏳ UI Pendente  
**Frase-Chave**: "Sem porcionamento matemático, você acha que vende... mas na verdade você está doando comida."

---

## ✅ O Que Já Está Pronto

### 1. Schema SQL
- ✅ Tabela `portioning_base_products` (peças/produtos-base)
- ✅ Tabela `portioning_sessions` (sessões de porcionamento)
- ✅ Tabela `portion_measurements` (medições individuais)
- ✅ Tabela `portioning_alerts` (alertas de variação)
- ✅ Tabela `portioning_config` (configuração global)
- ✅ Funções de cálculo automático (custo por grama, por porção, porções reais)
- ✅ Trigger para auto-calcular campos
- ✅ RLS Policies
- ✅ Indexes
- ✅ Feature Flag `portioning_cost_real_enabled` no GovernManage
- ✅ Novos tipos de evento no Event Bus

### 2. Documentação
- ✅ `PORTIONING_COST_REAL.md` — Conceito e matemática
- ✅ `PORTIONING_COST_REAL_IMPLEMENTATION.md` — Este guia

---

## ⏳ O Que Falta Implementar

### 1. Tela 1: Cadastro da Peça (Admin)

#### Localização
`merchant-portal/src/pages/Portioning/BaseProductForm.tsx`

#### Campos

**Inputs**:
- Nome da peça (text)
- Descrição (text, opcional)
- Categoria (select: meat, fish, vegetable, other)
- Preço da peça (number, R$)
- Peso total (number, gramas)
- Perda estimada (number, %)
- Gramatura alvo da porção (number, gramas)
- Espessura alvo (number, mm, opcional)

**Outputs Automáticos** (calculados em tempo real):
- Custo por grama: `cost_total / weight_total_g`
- Custo por porção: `cost_per_gram × portion_weight_g`
- Porções teóricas: `weight_total_g / portion_weight_g`
- Porções reais: `portions_theoretical × (1 - loss_percent)`

#### Exemplo de UI

```tsx
<Card title="Cadastro de Peça">
  <Input label="Nome" value={name} onChange={setName} />
  <Input label="Preço da Peça (R$)" type="number" value={costTotal} onChange={setCostTotal} />
  <Input label="Peso Total (g)" type="number" value={weightTotal} onChange={setWeightTotal} />
  <Input label="Perda Estimada (%)" type="number" value={lossPercent} onChange={setLossPercent} />
  <Input label="Gramatura Alvo (g)" type="number" value={portionWeight} onChange={setPortionWeight} />
  
  {/* Outputs automáticos */}
  <Card variant="outline">
    <Text>Custo por grama: R$ {costPerGram.toFixed(4)}</Text>
    <Text>Custo por porção: R$ {costPerPortion.toFixed(2)}</Text>
    <Text>Porções teóricas: {portionsTheoretical}</Text>
    <Text>Porções reais: {portionsReal}</Text>
  </Card>
  
  <Button onClick={handleSave}>Salvar Peça</Button>
</Card>
```

---

### 2. Tela 2: Calculadora Automática (Admin)

#### Localização
`merchant-portal/src/pages/Portioning/Calculator.tsx`

#### Funcionalidades

**Simulador de Erro**:
- Input: Vendas mensais (número de porções)
- Sliders: +10g, +20g, +40g de variação
- Outputs:
  - Perda mensal (R$)
  - Perda anual (R$)
  - Alerta visual se > threshold

#### Exemplo de UI

```tsx
<Card title="Simulador de Erro">
  <Input label="Vendas Mensais" type="number" value={monthlySales} onChange={setMonthlySales} />
  
  <Card variant="outline">
    <Text weight="bold">Impacto de Variação</Text>
    
    <div>
      <Text>+10g de erro:</Text>
      <Text color="warning">Perda mensal: R$ {calculateImpact(10, monthlySales)}</Text>
      <Text color="warning">Perda anual: R$ {calculateImpact(10, monthlySales) * 12}</Text>
    </div>
    
    <div>
      <Text>+20g de erro:</Text>
      <Text color="error">Perda mensal: R$ {calculateImpact(20, monthlySales)}</Text>
      <Text color="error">Perda anual: R$ {calculateImpact(20, monthlySales) * 12}</Text>
    </div>
    
    <div>
      <Text>+40g de erro:</Text>
      <Text color="error" weight="bold">Perda mensal: R$ {calculateImpact(40, monthlySales)}</Text>
      <Text color="error" weight="bold">Perda anual: R$ {calculateImpact(40, monthlySales) * 12}</Text>
    </div>
  </Card>
</Card>
```

---

### 3. Tela 3: Modo Cozinha (AppStaff)

#### Localização
`merchant-portal/src/pages/AppStaff/PortioningTask.tsx`

#### Funcionalidades

**Tarefa do Dia**:
- Mostrar peça a porcionar
- Mostrar target: "22 porções de 150g / 12mm"
- Botão grande: "Confirmar Pesagem"
- Modal: Registrar peso de cada porção

**Registro de Medição**:
- Input: Peso real (g)
- Input: Espessura real (mm, opcional)
- Botão: "Adicionar Porção"
- Mostrar variação em tempo real

**Finalizar Sessão**:
- Calcular variação média
- Calcular impacto no custo
- Emitir alerta se > threshold

#### Exemplo de UI

```tsx
<Card title="Porcionamento do Dia">
  <Text size="xl" weight="bold">Picanha Premium</Text>
  <Text>Fazer 22 porções de 150g / 12mm</Text>
  
  <Button size="large" onClick={openMeasurementModal}>
    Confirmar Pesagem
  </Button>
  
  {/* Lista de porções já medidas */}
  <div>
    {measurements.map((m, i) => (
      <Card key={i}>
        <Text>Porção {i + 1}: {m.actualWeight}g</Text>
        <Text color={m.variation > 0 ? 'error' : 'success'}>
          Variação: {m.variation > 0 ? '+' : ''}{m.variation}g
        </Text>
      </Card>
    ))}
  </div>
  
  <Button onClick={finalizeSession}>Finalizar Sessão</Button>
</Card>
```

---

### 4. Backend (API)

#### Endpoints Necessários

**GET `/api/portioning/base-products`**
- Lista peças cadastradas
- Filtros: restaurant_id, is_active

**POST `/api/portioning/base-products`**
- Cria nova peça
- Body: `{ name, cost_total, weight_total_g, loss_percent, portion_weight_g, ... }`

**GET `/api/portioning/base-products/:id`**
- Detalhes da peça
- Inclui cálculos automáticos

**POST `/api/portioning/sessions`**
- Cria nova sessão de porcionamento
- Body: `{ base_product_id, target_portions, target_weight_g, ... }`

**POST `/api/portioning/sessions/:id/measurements`**
- Adiciona medição individual
- Body: `{ portion_number, actual_weight_g, actual_thickness_mm }`

**POST `/api/portioning/sessions/:id/finalize`**
- Finaliza sessão
- Calcula variação média
- Calcula impacto no custo
- Emite alerta se necessário

**GET `/api/portioning/calculator/simulate`**
- Simula impacto de variação
- Query: `?variation_g=10&monthly_sales=3000&cost_per_gram=0.069`
- Response: `{ monthly_impact, annual_impact }`

---

### 5. Event Bus Integration

#### Emitir Eventos

**Localização**: `server/operational-event-bus/event-bus.ts`

**Quando detectar variação alta**:
```typescript
await emitEvent({
  event_type: 'portion_drift_detected',
  source_module: 'portioning',
  context: {
    base_product_id: '...',
    session_id: '...',
    variation_avg_g: 12,
    variation_percent: 8,
    cost_impact_per_month: 1200,
    cost_impact_per_year: 14400
  },
  priority: 'P1'
});
```

---

### 6. GovernManage Integration

#### Decision History

**Exemplo de entrada**:
```json
{
  "decision_type": "create_task",
  "trigger_event": {
    "type": "portion_drift_detected",
    "variation_avg_g": 12,
    "cost_impact_per_month": 1200
  },
  "rule_applied": "Portion Drift → Create Task",
  "action_taken": {
    "type": "create_task",
    "task_id": "task_789",
    "target": "appstaff",
    "priority": "P1",
    "title": "Re-treinamento de porcionamento - Picanha Premium"
  },
  "reasoning": "Variação média de +12g detectada. Impacto: R$ 1.200/mês. Necessário re-treinamento."
}
```

#### Toggle de Regra

**Adicionar no GovernManage UI**:
```tsx
<RuleCard
  ruleName="Portion Drift → Create Task"
  enabled={true}
  onToggle={handleToggle}
  description="Se variação média > 8g, criar tarefa de re-treinamento"
/>
```

---

## 🧭 Ordem de Implementação Recomendada

### Fase 1: Backend (Base)
1. ✅ Schema SQL
2. ⏳ Endpoints API
3. ⏳ Funções de cálculo
4. ⏳ Integração com Event Bus

### Fase 2: UI Admin
5. ⏳ Tela 1: Cadastro de Peça
6. ⏳ Tela 2: Calculadora Automática

### Fase 3: UI AppStaff
7. ⏳ Tela 3: Modo Cozinha
8. ⏳ Modal de medição
9. ⏳ Finalização de sessão

### Fase 4: Integração
10. ⏳ Event Bus
11. ⏳ GovernManage
12. ⏳ Alertas automáticos

---

## 🚦 Feature Flag

### Ativação

**Via GovernManage UI**: `/app/govern-manage`

**Feature Key**: `portioning_cost_real_enabled`

**Default**: `false` (desabilitado)

**Quando ativar**:
- Restaurantes com produtos de alto custo
- Operações que precisam de padronização
- Cozinhas que já usam porcionamento manual

---

## 🧪 Testes

### Cenários de Teste

1. **Cadastrar peça → Cálculos automáticos**
   - Cadastrar peça com preço e peso
   - Verificar cálculos automáticos (custo por grama, por porção, porções)

2. **Simular erro → Calcular impacto**
   - Input: Vendas mensais = 3.000
   - Variação: +20g
   - Verificar impacto mensal e anual

3. **Sessão de porcionamento → Registrar medições**
   - Criar sessão
   - Adicionar medições
   - Finalizar sessão
   - Verificar cálculo de variação média

4. **Variação alta → Alerta automático**
   - Variação média > threshold
   - Verificar evento emitido
   - Verificar tarefa criada
   - Verificar entrada no Decision History

---

## 📊 Métricas

### O Que Medir

- % de sessões dentro da tolerância
- Variação média por produto
- Impacto no custo mensal/anual
- Taxa de alertas gerados

---

**Mensagem**: "Porcionamento matemático = comida não doada sem perceber."

