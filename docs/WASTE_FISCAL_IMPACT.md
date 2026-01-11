# 🗑️ Waste & Fiscal Impact — Perda Operacional e Impacto Fiscal

**Data**: 2025-01-02  
**Status**: 📋 Conceitual (Aguardando Implementação)  
**Frase-Chave**: "Desperdício invisível vira prejuízo invisível. Aqui ele vira dado."

---

## 🧠 O Problema Real

### O Que Acontece Hoje (Informal)

1. **Perda Real de Insumo**:
   - Aparas
   - Gordura
   - Cortes fora do padrão
   - Validade vencida
   - Erro operacional

2. **Impacto Financeiro Direto**:
   - 20% de perda em compras de R$ 100.000 = R$ 20.000
   - Reduz lucro tributável, **se registrado corretamente**

3. **Impacto Fiscal Ignorado**:
   - IRPJ + CSLL incidem sobre o lucro
   - Perda registrada = redução da base de cálculo
   - Economia estimada: ~R$ 4.800/mês

### O Erro do Mercado

❌ **Joga fora, mas não registra → perde duas vezes**  
(produto + imposto)

---

## ✅ Por Que Isso É Legítimo

### Contabilidade Correta (Não "Jeitinho")

Isso é **100% legítimo** quando feito com método:

- ✅ Pesagem
- ✅ Evidência fotográfica
- ✅ Motivo classificado
- ✅ Registro por período
- ✅ Rastreabilidade

### O Que Falta?

👉 **Sistema operacional que torne isso automático e auditável.**

---

## 🏗️ Arquitetura do Módulo

### 1️⃣ Registro de Perda Operacional (AppStaff – Cozinha)

**Fluxo simples, dedo único**:

- Botão: "Registrar perda"
- Campos:
  - Tipo: `apara` / `vencido` / `erro` / `sobra` / `quebra`
  - Peso (balança)
  - Produto base (já vem do porcionamento)
  - Foto obrigatória 📸
  - Confirmar

**Princípios**:
- ✅ Zero texto livre
- ✅ Zero interpretação humana
- ✅ Só fato

---

### 2️⃣ Evento Automático no Event Bus

**Ao registrar**:

```typescript
event_type: 'operational_waste_recorded'
priority: P2
context: {
  product_id: string,
  weight_g: number,
  cost_per_g_cents: number,
  estimated_value_cents: number,
  reason: 'apara' | 'vencido' | 'erro' | 'sobra' | 'quebra',
  photo_url: string,
  recorded_by: string,
  recorded_at: timestamp
}
```

**Esse evento alimenta**:
- GovernManage
- Decision History
- Analytics
- Fiscal Summary

---

### 3️⃣ Integração com Porcionamento & Custo Real

**Conexão**:

```
Perda registrada real → Impacto fiscal real
```

**Dados já disponíveis**:
- Custo por grama
- Impacto mensal
- Perda invisível

**Agora conecta**:
- Perda registrada → Impacto fiscal calculado

---

### 4️⃣ Painel Fiscal no GovernManage (Para o Dono)

**Sem juridiquês, sem planilha**:

```
"Este mês:"
• Compras: R$ 100.000
• Perdas registradas: R$ 20.000
• Redução base IRPJ/CSLL: R$ 20.000
• Economia estimada de imposto: R$ 4.800
```

⚠️ **Com aviso claro**:

> "Valores estimados. Consulte seu contador."

**Isso é transparência, não risco.**

---

### 5️⃣ Evidência Exportável (Para Contador)

**Botão**: "Exportar Perdas (CSV + Fotos)"

**Sai**:
- Data
- Produto
- Peso
- Valor
- Motivo
- Link da evidência

📌 **Isso é ouro para contabilidade séria.**

---

## 🔐 Por Que Isso É Defensável

### Juridicamente e Moralmente

Você **não está criando incentivo para desperdício**.

Pelo contrário:
- ✅ O sistema mede
- ✅ Mostra impacto
- ✅ Cria alerta se perda passar do normal
- ✅ Gera tarefa de correção

**Ou seja**: Quanto mais perda, mais visível fica.

**Isso é o oposto de fraude.**

---

## 🧩 Como Isso Se Encaixa na Tese do Produto

### "O ChefIApp governa decisões operacionais."

Porque agora ele governa:
- ✅ Custo real
- ✅ Perda real
- ✅ Impacto fiscal real
- ✅ Decisão consciente do dono

**Nada é invisível.**

---

## 💬 Frases Comerciais

### Opção 1 (Explicativa)
> "Se você joga comida fora sem registrar, você perde duas vezes.  
> O ChefIApp registra, calcula e te devolve controle."

### Opção 2 (Direta)
> "Desperdício invisível vira prejuízo invisível.  
> Aqui ele vira dado."

---

## 🟢 Veredito

### O Que Isso É

- ✅ Operação madura
- ✅ Contabilidade correta
- ✅ Sistema de governo real
- ✅ Dinheiro recuperado sem vender mais

### O Que Isso NÃO É

- ❌ Gambiarra
- ❌ Risco
- ❌ Jeitinho

**E pouquíssimos sistemas no mundo fazem isso direito.**

---

## 🚀 Próximos Passos (Quando Quiser)

1. **Desenhar a tela de registro de perda no AppStaff**
   - Botões grandes, dedo único
   - Câmera integrada
   - Seleção de tipo (chips grandes)
   - Integração com balança (futuro)

2. **Definir limites de alerta no GovernManage**
   - Perda acima de X% do custo mensal → Alerta P1
   - Tarefa automática para Manager
   - Decision History com evidências

3. **Painel Fiscal no GovernManage**
   - Cards com números principais
   - Gráfico de tendência
   - Export CSV + Fotos
   - Aviso legal claro

4. **Integração com Event Bus**
   - `operational_waste_recorded` → GovernManage
   - Routing rules para alertas
   - Decision History completo

---

## 📊 Estrutura de Dados (Conceitual)

### Tabela: `operational_waste_records`

```sql
- id UUID
- restaurant_id UUID
- product_id UUID (FK portioning_base_products)
- waste_type TEXT ('apara', 'vencido', 'erro', 'sobra', 'quebra')
- weight_g INTEGER
- cost_per_gram_cents INTEGER
- estimated_value_cents INTEGER
- photo_url TEXT
- recorded_by UUID
- recorded_at TIMESTAMPTZ
- fiscal_period TEXT (YYYY-MM)
- exported_at TIMESTAMPTZ
```

### Tabela: `fiscal_waste_summary`

```sql
- id UUID
- restaurant_id UUID
- fiscal_period TEXT (YYYY-MM)
- total_purchases_cents INTEGER
- total_waste_cents INTEGER
- estimated_tax_savings_cents INTEGER
- records_count INTEGER
- last_updated TIMESTAMPTZ
```

---

## 🎯 Integração com Módulos Existentes

### Porcionamento & Custo Real
- Usa `cost_per_gram_cents` já calculado
- Usa `product_id` já cadastrado
- Conecta perda real com impacto calculado

### GovernManage
- Recebe `operational_waste_recorded` events
- Gera alertas se perda > threshold
- Mostra painel fiscal
- Exporta evidências

### Event Bus
- Emite `operational_waste_recorded` (P2)
- Routing rules para alertas
- Decision History completo

### AppStaff
- Tela de registro (dedo único)
- Task automática se perda alta
- Badge "Por quê?" com evidências

---

**Mensagem Final**:  
"A ideia é sólida, legítima e poderosa.  
Pode dormir tranquilo."

