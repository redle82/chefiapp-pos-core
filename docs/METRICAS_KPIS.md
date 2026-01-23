# 📊 Métricas e KPIs - Sistema Nervoso Operacional

**Tracking e monitoramento em produção**

---

## 🎯 KPIs Principais

### Operacionais (P0 - Críticos)

#### 1. Tempo Médio de Pagamento
**Meta:** < 5 segundos  
**Medição:** Tempo entre toque em "Cobrar Tudo" e confirmação  
**Frequência:** Diária  
**Fonte:** Logs de eventos do FastPayButton

```typescript
// Exemplo de tracking
const startTime = Date.now();
await quickPay(orderId, method);
const duration = Date.now() - startTime;
// Log: { event: 'fast_pay', duration, orderId, method }
```

**Dashboard:**
- Média diária
- Percentil 95
- Tendência (gráfico de linha)

---

#### 2. Taxa de Conversão de Reservas
**Meta:** +15% vs. baseline  
**Medição:** (Reservas que viram mesa) / (Total de reservas)  
**Frequência:** Semanal  
**Fonte:** WaitlistBoard → Mesa atribuída

```typescript
// Tracking
const conversionRate = (seatedReservations / totalReservations) * 100;
```

**Dashboard:**
- Taxa semanal
- Comparação com baseline
- Tendência

---

#### 3. Redução de Mesas > 30min
**Meta:** -40% vs. baseline  
**Medição:** % de mesas ocupadas há > 30min  
**Frequência:** Diária  
**Fonte:** Timer do Mapa Vivo

```typescript
// Tracking
const urgentTables = tables.filter(t => t.elapsedMinutes > 30);
const urgentRate = (urgentTables.length / totalOccupied) * 100;
```

**Dashboard:**
- Taxa diária
- Comparação com baseline
- Horários de pico

---

#### 4. Aumento de Vendas de Bebidas Durante Pico
**Meta:** +25% vs. baseline  
**Medição:** Vendas de bebidas quando cozinha saturada  
**Frequência:** Diária  
**Fonte:** useKitchenPressure + vendas

```typescript
// Tracking
if (pressure === 'high') {
  const drinkSales = orders.filter(o => o.items.some(i => i.category === 'drink'));
  // Comparar com baseline
}
```

**Dashboard:**
- Vendas de bebidas durante pico
- Comparação com baseline
- Eficácia do menu inteligente

---

### Financeiros (P1 - Importantes)

#### 5. Receita Adicional por Restaurante
**Meta:** €500-1000/mês  
**Medição:** Receita incremental vs. baseline  
**Frequência:** Mensal  
**Fonte:** Analytics de vendas

**Cálculo:**
- Mais mesas/noite (turnover mais rápido)
- Mais vendas de bebidas (durante picos)
- Menos erros (menos estornos)

---

#### 6. ROI
**Meta:** Positivo em < 30 dias  
**Medição:** (Receita adicional - Custo) / Custo  
**Frequência:** Mensal  
**Fonte:** Financeiro

---

### Adoção (P1 - Importantes)

#### 7. Taxa de Ativação
**Meta:** > 80%  
**Medição:** Usuários que usam após instalar  
**Frequência:** Semanal  
**Fonte:** Analytics de uso

---

#### 8. Taxa de Retenção (30 dias)
**Meta:** > 90%  
**Medição:** Usuários ativos após 30 dias  
**Frequência:** Mensal  
**Fonte:** Analytics de uso

---

#### 9. Tempo de Onboarding
**Meta:** < 10 minutos  
**Medição:** Tempo até primeiro uso completo  
**Frequência:** Semanal  
**Fonte:** Analytics de uso

---

#### 10. NPS (Net Promoter Score)
**Meta:** > 50  
**Medição:** Pesquisa de satisfação  
**Frequência:** Mensal  
**Fonte:** Survey

---

## 📈 Métricas Secundárias

### Operacionais

#### Tempo Médio de Resposta a Mesas Urgentes
**Meta:** < 5 minutos  
**Medição:** Tempo entre mesa fica vermelha e ação do garçom

#### Taxa de Uso do Fast Pay
**Meta:** > 70% dos pagamentos  
**Medição:** % de pagamentos via Fast Pay vs. modal tradicional

#### Eficácia do Menu Inteligente
**Meta:** Redução de 30% em pratos lentos vendidos durante pico  
**Medição:** Vendas de pratos lentos quando cozinha saturada

### Técnicas

#### Performance
- Tempo de carregamento inicial
- Tempo de atualização do mapa
- Uso de memória
- Uso de bateria (timers)

#### Qualidade
- Taxa de erros
- Taxa de crashes
- Taxa de sincronização offline

---

## 📊 Dashboard Sugerido

### Visão Geral (Dono)
```
┌─────────────────────────────────────┐
│  HOJE                                │
├─────────────────────────────────────┤
│  ⏱️  Tempo Pagamento: 4.2s          │
│  🗺️  Mesas Urgentes: 2 (5%)        │
│  🍽️  Pressão Cozinha: Medium       │
│  📋  Reservas: 8 (12 convertidas)   │
└─────────────────────────────────────┘
```

### Detalhado (Gerente)
- Gráfico de tempo de pagamento (ao longo do dia)
- Gráfico de mesas por estado (verde/amarelo/vermelho)
- Gráfico de pressão da cozinha
- Lista de reservas e conversão

---

## 🔍 Como Coletar

### Eventos a Trackear

```typescript
// Fast Pay
trackEvent('fast_pay_started', { orderId, tableId });
trackEvent('fast_pay_completed', { orderId, duration, method });

// Mapa Vivo
trackEvent('table_urgent', { tableId, elapsedMinutes });
trackEvent('table_action', { tableId, action });

// KDS Inteligente
trackEvent('kitchen_pressure', { pressure, preparingCount });
trackEvent('menu_filtered', { hiddenItems, reason });

// Reservas
trackEvent('waitlist_added', { name, time });
trackEvent('waitlist_seated', { entryId, tableId });
```

### Onde Implementar

1. **FastPayButton.tsx**
   - Início e fim do pagamento
   - Duração total

2. **tables.tsx (TableCard)**
   - Mudança de cor (verde → amarelo → vermelho)
   - Ações do garçom

3. **useKitchenPressure.ts**
   - Mudança de pressão
   - Filtro do menu

4. **WaitlistBoard.tsx**
   - Adição de reserva
   - Conversão para mesa

---

## 📱 Ferramentas Sugeridas

### Analytics
- **Supabase Analytics** (built-in)
- **Mixpanel** (eventos customizados)
- **Amplitude** (análise de comportamento)
- **Google Analytics** (básico)

### Monitoring
- **Sentry** (erros e crashes)
- **LogRocket** (sessões e debug)
- **Supabase Logs** (queries e performance)

---

## 📅 Frequência de Revisão

### Diária
- Tempo médio de pagamento
- Mesas urgentes
- Pressão da cozinha

### Semanal
- Taxa de conversão de reservas
- Taxa de ativação
- Tempo de onboarding

### Mensal
- Receita adicional
- ROI
- Taxa de retenção
- NPS

---

## 🎯 Metas por Fase

### Fase 1: Validação (Semana 1-2)
- [ ] Tempo pagamento < 5s em 80% dos casos
- [ ] 0 crashes críticos
- [ ] 100% dos testes passando

### Fase 2: Beta (Semana 3-4)
- [ ] Tempo pagamento < 5s em 95% dos casos
- [ ] Taxa de ativação > 70%
- [ ] NPS > 40

### Fase 3: Produção (Semana 5+)
- [ ] Todas as metas principais atingidas
- [ ] Taxa de retenção > 90%
- [ ] ROI positivo

---

## 📝 Template de Relatório Semanal

```markdown
# Relatório Semanal - Sistema Nervoso Operacional

## Semana: [Data]

### KPIs Principais
- Tempo médio pagamento: [X]s (meta: < 5s) ✅/❌
- Taxa conversão reservas: [X]% (meta: +15%) ✅/❌
- Redução mesas urgentes: [X]% (meta: -40%) ✅/❌
- Vendas bebidas pico: [X]% (meta: +25%) ✅/❌

### Adoção
- Taxa ativação: [X]%
- Taxa retenção: [X]%
- NPS: [X]

### Issues
- [Lista de problemas encontrados]

### Próximos Passos
- [Ações para próxima semana]
```

---

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
