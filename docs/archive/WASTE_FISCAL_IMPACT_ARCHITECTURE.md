# 🏗️ Waste & Fiscal Impact — Arquitetura Técnica

**Data**: 2025-01-02  
**Status**: 📋 Conceitual (Aguardando Implementação)

---

## 📐 Estrutura de Dados

### 1. `operational_waste_records`

Registros individuais de perda operacional.

```sql
CREATE TABLE operational_waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
  
  -- Product Reference
  product_id UUID REFERENCES portioning_base_products(id),
  product_name TEXT, -- Cached for export
  
  -- Waste Details
  waste_type TEXT NOT NULL CHECK (waste_type IN ('apara', 'vencido', 'erro', 'sobra', 'quebra')),
  weight_g INTEGER NOT NULL,
  
  -- Cost Calculation
  cost_per_gram_cents INTEGER NOT NULL, -- From portioning_base_products
  estimated_value_cents INTEGER NOT NULL, -- weight_g * cost_per_gram_cents
  
  -- Evidence
  photo_url TEXT NOT NULL, -- S3/Storage URL
  photo_metadata JSONB DEFAULT '{}'::jsonb, -- {width, height, timestamp, device}
  
  -- Audit
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Fiscal Period
  fiscal_period TEXT NOT NULL, -- YYYY-MM format
  
  -- Export Status
  exported_at TIMESTAMPTZ,
  exported_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  notes TEXT, -- Optional, structured notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. `fiscal_waste_summary`

Resumo mensal para cálculo fiscal.

```sql
CREATE TABLE fiscal_waste_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
  
  -- Period
  fiscal_period TEXT NOT NULL, -- YYYY-MM format
  UNIQUE(restaurant_id, fiscal_period),
  
  -- Financial Totals
  total_purchases_cents INTEGER NOT NULL DEFAULT 0,
  total_waste_cents INTEGER NOT NULL DEFAULT 0,
  waste_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_purchases_cents > 0 
      THEN (total_waste_cents::DECIMAL / total_purchases_cents) * 100
      ELSE 0
    END
  ) STORED,
  
  -- Tax Impact (Estimated)
  estimated_tax_rate DECIMAL(5,2) DEFAULT 24.00, -- IRPJ + CSLL combined
  estimated_tax_savings_cents INTEGER GENERATED ALWAYS AS (
    ROUND(total_waste_cents * (estimated_tax_rate / 100))
  ) STORED,
  
  -- Records
  records_count INTEGER NOT NULL DEFAULT 0,
  
  -- Breakdown by Type
  breakdown_by_type JSONB DEFAULT '{}'::jsonb, -- {apara: 5000, vencido: 3000, ...}
  
  -- Audit
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. `waste_alert_thresholds`

Configuração de alertas por restaurante.

```sql
CREATE TABLE waste_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
  UNIQUE(restaurant_id),
  
  -- Thresholds
  max_waste_percentage DECIMAL(5,2) DEFAULT 20.00, -- Alert if > 20%
  max_daily_waste_cents INTEGER, -- Alert if daily waste > X
  max_single_record_cents INTEGER, -- Alert if single record > X
  
  -- Alert Actions
  alert_priority TEXT DEFAULT 'P1' CHECK (alert_priority IN ('P0', 'P1', 'P2', 'P3')),
  alert_target_roles TEXT[] DEFAULT ARRAY['manager', 'owner'],
  
  -- Enabled
  enabled BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🔄 Fluxo de Eventos

### 1. Registro de Perda (AppStaff)

```
User Action: "Registrar perda"
  ↓
1. Seleciona tipo (apara/vencido/erro/sobra/quebra)
2. Pesa (ou digita peso)
3. Tira foto (obrigatório)
4. Seleciona produto (do portioning_base_products)
5. Confirma
  ↓
POST /api/waste/records
  ↓
Server:
  - Calcula estimated_value_cents
  - Upload foto → S3/Storage
  - Insere operational_waste_records
  - Atualiza fiscal_waste_summary (upsert)
  - Emite evento: operational_waste_recorded
```

### 2. Event Bus Processing

```typescript
Event: operational_waste_recorded
Priority: P2
Context: {
  record_id: string,
  product_id: string,
  waste_type: string,
  weight_g: number,
  estimated_value_cents: number,
  fiscal_period: string
}
  ↓
Event Bus → GovernManage
  ↓
GovernManage:
  - Verifica thresholds
  - Se exceder → cria alerta P1
  - Loga no Decision History
  - Atualiza analytics
```

### 3. Alerta Automático

```
If waste_percentage > threshold:
  ↓
Emit: operational_waste_alert
Priority: P1
  ↓
Event Bus → AppStaff
  ↓
Cria task para Manager:
  - "Perda operacional acima do normal"
  - Mostra breakdown
  - Link para evidências
```

---

## 🎨 UI Components

### 1. AppStaff: Waste Recording Screen

**Layout** (Dedo único):

```
┌─────────────────────────────┐
│  Registrar Perda            │
├─────────────────────────────┤
│                             │
│  [Tipo de Perda]            │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │Apara│ │Venc.│ │Erro │  │
│  └─────┘ └─────┘ └─────┘  │
│  ┌─────┐ ┌─────┐           │
│  │Sobra│ │Queb.│           │
│  └─────┘ └─────┘           │
│                             │
│  [Produto]                  │
│  ┌─────────────────────┐   │
│  │ Picanha Premium  ▼  │   │
│  └─────────────────────┘   │
│                             │
│  [Peso]                     │
│  ┌─────────────────────┐   │
│  │    150 g            │   │
│  └─────────────────────┘   │
│                             │
│  [Foto]                     │
│  ┌─────────────────────┐   │
│  │   📸 Tirar Foto     │   │
│  │   [Preview aqui]    │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │   CONFIRMAR         │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

**Interação**:
- Botões grandes (min 80px height)
- Câmera nativa (navigator.mediaDevices)
- Preview antes de confirmar
- Validação: foto obrigatória

---

### 2. GovernManage: Fiscal Panel

**Layout**:

```
┌─────────────────────────────────────┐
│  Impacto Fiscal - Janeiro 2025     │
├─────────────────────────────────────┤
│                                     │
│  Compras Totais                     │
│  € 100.000                          │
│                                     │
│  Perdas Registradas                 │
│  € 20.000 (20%)                     │
│                                     │
│  Redução Base IRPJ/CSLL             │
│  € 20.000                           │
│                                     │
│  Economia Estimada de Imposto       │
│  € 4.800                            │
│                                     │
│  ⚠️ Valores estimados.              │
│     Consulte seu contador.          │
│                                     │
│  [Exportar Perdas (CSV + Fotos)]    │
│                                     │
│  [Ver Detalhes]                     │
└─────────────────────────────────────┘
```

**Breakdown Tab**:
- Gráfico por tipo (apara, vencido, erro, etc.)
- Lista de registros
- Filtros por período

---

### 3. Export Format (CSV + ZIP)

**CSV** (`waste_records_2025-01.csv`):

```csv
data,produto,tipo,peso_g,valor_euros,evidencia
2025-01-15,Picanha Premium,apara,150,7.50,photo_001.jpg
2025-01-16,Salmão Inteiro,vencido,200,12.00,photo_002.jpg
```

**ZIP** (`waste_evidence_2025-01.zip`):
- Todas as fotos nomeadas por ID
- CSV incluído
- README.txt com instruções

---

## 🔗 Integrações

### Com Porcionamento & Custo Real

```typescript
// Ao registrar perda
const product = await getBaseProduct(product_id);
const costPerGram = product.cost_per_gram_cents;
const estimatedValue = weight_g * costPerGram;
```

### Com Event Bus

```typescript
await emitEvent({
  event_type: 'operational_waste_recorded',
  priority: 'P2',
  context: {
    record_id,
    product_id,
    waste_type,
    weight_g,
    estimated_value_cents,
    fiscal_period
  }
});
```

### Com GovernManage

```typescript
// Threshold check
if (waste_percentage > threshold.max_waste_percentage) {
  await emitEvent({
    event_type: 'operational_waste_alert',
    priority: threshold.alert_priority,
    context: {
      fiscal_period,
      waste_percentage,
      threshold_exceeded: true
    }
  });
}
```

---

## 📊 Métricas e Analytics

### KPIs no Dashboard

1. **Waste Rate** (% do custo total)
2. **Estimated Tax Savings** (EUR/mês)
3. **Records Count** (quantidade de registros)
4. **Breakdown by Type** (gráfico)

### Alertas Automáticos

- Perda > 20% do custo mensal → P1
- Registro único > € 100 → P2
- Perda diária > € 500 → P1

---

## 🔒 Segurança e Compliance

### RLS Policies

```sql
-- Users can only see their restaurant's records
CREATE POLICY "restaurant_waste_records" ON operational_waste_records
  FOR SELECT USING (
    restaurant_id IN (
      SELECT id FROM gm_restaurants 
      WHERE owner_id = auth.uid()
    )
  );

-- Only kitchen/staff can create records
CREATE POLICY "staff_can_create_waste" ON operational_waste_records
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM restaurant_members
      WHERE restaurant_id = operational_waste_records.restaurant_id
    )
  );
```

### Photo Storage

- S3 bucket com acesso restrito
- URLs assinadas (expiração 7 dias)
- Export gera URLs permanentes (30 dias)

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP
- [ ] Schema SQL
- [ ] API endpoints básicos
- [ ] Tela AppStaff (registro)
- [ ] Event Bus integration

### Fase 2: Governança
- [ ] Painel Fiscal no GovernManage
- [ ] Alertas automáticos
- [ ] Thresholds configuráveis

### Fase 3: Export
- [ ] Export CSV + ZIP
- [ ] Integração com storage (S3)
- [ ] Template para contador

### Fase 4: Analytics
- [ ] Gráficos de tendência
- [ ] Comparação período a período
- [ ] Benchmarking (opcional)

---

**Status**: Arquitetura definida. Aguardando aprovação para implementação.

