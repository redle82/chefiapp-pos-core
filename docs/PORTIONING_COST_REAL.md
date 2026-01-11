# 🎯 Porcionamento & Custo Real — Industrialização Artesanal

**Data**: 2025-01-02  
**Status**: ✅ Schema Implementado  
**Frase-Chave**: "Sem porcionamento matemático, você acha que vende... mas na verdade você está doando comida."

---

## 🧠 O Problema Real

### O Trauma

> "Quase 100 mil perdidos com 'produto vegetal/insumo'"

### Por Que Acontece

O rombo nasce quando o time faz isso no caos:
- "15g... não, 20g... não, 40g..."
- Porção "no olho"
- Espessura variando
- Cada prato sai com uma "bondade" diferente

### A Conta do Desastre

**Se você vende 3.000 unidades, e erra só 20g por unidade:**

- 20g × 3.000 = 60.000g = **60 kg de produto indo embora**

**Se o custo real do grama for R$ 0,069:**
- 60.000 × 0,069 = **R$ 4.140 de prejuízo invisível**

**Agora imagina o erro real sendo 40g, e o custo do grama ser mais alto, e isso repetindo mês a mês.**

**Aí sim você chega rápido em dezenas de milhares.**

---

## 💡 A Solução

### A Técnica que Salvou

✅ **Dividir a peça**  
✅ **Plastificar** (protege padrão e perda)  
✅ **Medir espessura** (padroniza cocção e percepção)  
✅ **Converter "peça inteira" em "número de porções"**  
✅ **Criar um produto a R$ 34,99 com previsibilidade**

**Isso é literalmente industrialização artesanal.**

---

## 🧮 A Conta Certa (Modelo Universal)

### A) Custo por Grama

```
custo_por_grama = preço_da_peça / peso_total_em_gramas
```

**Exemplo**: Peça custa R$ 345 e tem 5.000g
- 345 / 5.000 = **R$ 0,069 por grama**

---

### B) Custo por Porção

```
custo_por_porção = custo_por_grama × gramatura_da_porção
```

**Exemplo**: Porção 150g
- 0,069 × 150 = **R$ 10,35**

---

### C) Quantas Porções a Peça Rende

```
porções = peso_total_em_gramas / gramatura_da_porção
```

**Exemplo**: 5.000 / 150 = **33 porções** (na teoria)

**Na prática você aplica perda** (gordura, osso, aparo, cocção).

---

### D) Ajuste de Perda Real

```
rendimento_real = rendimento_teórico × (1 - perda%)
```

**Exemplo**: Se perda total = 18%
- 33 × 0,82 = **27 porções reais**

---

## 🎯 O Que o Módulo Faz

### Três Telas, Dedo Único

#### 1. Cadastro da Peça (Admin)

- Preço da peça
- Peso total (g)
- Perda estimada (%)
- Gramatura alvo (g)
- Espessura alvo (mm)

**Outputs automáticos**:
- Custo por grama
- Custo por porção
- Porções teóricas
- Porções reais

---

#### 2. Calculadora Automática (Admin)

**Simulador de erro**:
- +10g → perda mensal/anual
- +20g → perda mensal/anual
- +40g → perda mensal/anual

**Input**: Vendas mensais

**Alerta**: "Se variar +10g você perde X por mês"

---

#### 3. Modo Cozinha (AppStaff)

**Tarefa fixa do dia**:
> "Cortar peça X em 22 porções de 150g / 12mm"

**Botão**: "Confirmar pesagem"

**Registrar**: Variação real (aprendizado)

---

## 🔗 Integração com Event Bus

### Alerta Automático

**Se variação média > limite configurável**:
- Emitir evento P1: `portion_drift_detected`
- Criar tarefa: "Re-treinamento de porcionamento"
- Notificar gerente

---

## 🧠 Integração com GovernManage

### Decision History

**Exemplo de entrada**:
> "Variação média detectada: +12g  
> Regra: Portion Drift → Create Task  
> Ação: Criar tarefa de re-treinamento  
> Impacto: R$ 1.200/mês se mantiver"

### Toggle de Regra

**Permitir ativar/desativar** alerta de variação via GovernManage UI.

---

## 💰 Comercialmente

### Narrativa

> "Eu perdi quase 100 mil.  
> Hoje eu uso porcionamento matemático e nunca mais doei comida sem perceber."

### Argumento de Venda

> "Outros restaurantes doam comida sem perceber.  
> O ChefIApp transforma porcionamento em matemática previsível."

---

## 🎯 Diferenciação

### Outros Sistemas

- ❌ Porcionamento "no olho"
- ❌ Sem rastreabilidade
- ❌ Sem alertas de variação
- ❌ Sem cálculo de impacto real

### ChefIApp

- ✅ Porcionamento matemático
- ✅ Rastreabilidade total
- ✅ Alertas automáticos
- ✅ Cálculo de impacto em tempo real

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

## 🧮 Exemplo Real

### Input (4 números)

1. Preço da peça: **R$ 345**
2. Peso total: **5.000g**
3. Gramatura desejada: **150g**
4. Vendas mensais: **3.000 porções**

### Output (Verdade em 10 segundos)

- **Custo real por prato**: R$ 10,35
- **Margem real por prato**: (depende do preço de venda)
- **Perda com 10g de erro**: R$ 2.070/mês | R$ 24.840/ano
- **Perda com 20g de erro**: R$ 4.140/mês | R$ 49.680/ano
- **Perda com 40g de erro**: R$ 8.280/mês | R$ 99.360/ano

**Prejuízo invisível anual**: Até R$ 99.360 (com erro de 40g)

---

**Mensagem**: "Porcionamento matemático = comida não doada sem perceber."

