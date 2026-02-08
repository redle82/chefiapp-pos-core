# Prompt Completo para Cursor — Teste Massivo Nível 5

**Objetivo:** Implementar todas as fases do Teste Massivo Nível 5 (Stress de Realidade Extrema).

---

## 📋 Contexto

Este teste é o **Nível 5** de uma série de testes massivos:
- **Nível 3:** Teste básico de integração
- **Nível 4:** Teste end-to-end com escala (S, M, L, XL)
- **Nível 5:** **Stress de Realidade Extrema** (1.000 restaurantes, 7 dias simulados)

**Objetivo do Nível 5:** Descobrir onde o motor começa a dobrar, ranger ou revelar potenciais ocultos quando empurrado além do normal.

---

## 🎯 Escala do Teste

- **1.000 restaurantes** (400 ambulantes, 350 pequenos, 200 grandes, 50 enterprise)
- **~27.850 mesas** (distribuição desigual por perfil)
- **~12.000 pessoas** (identidades simuladas com turnos)
- **~500.000 pedidos** (em 7 dias simulados)
- **Multi-dispositivo** (tablet, celular, TPV, QR, Web)
- **Multi-tempo** (simular 7 dias em minutos)

---

## 📁 Estrutura de Arquivos

```
scripts/teste-massivo-nivel-5/
├── types.ts                    ✅ CRIADO
├── db.ts                       ✅ CRIADO
├── logger.ts                   ✅ CRIADO
├── restaurant-profiles.ts      ✅ CRIADO
├── fase-0-preflight.ts         ✅ CRIADO
├── index.ts                    ✅ CRIADO
├── teste-massivo-nivel-5.sh   ✅ CRIADO
│
├── scenario-generator.ts       ❌ IMPLEMENTAR
├── people-simulator.ts         ❌ IMPLEMENTAR
├── order-chaos-engine.ts       ❌ IMPLEMENTAR
├── task-stress-engine.ts       ❌ IMPLEMENTAR
├── inventory-simulator.ts      ❌ IMPLEMENTAR
├── time-warp.ts                ❌ IMPLEMENTAR
│
├── fase-1-setup-massivo.ts     ❌ IMPLEMENTAR
├── fase-2-pedidos-caos.ts      ❌ IMPLEMENTAR
├── fase-3-kds-stress.ts        ❌ IMPLEMENTAR
├── fase-4-task-extreme.ts      ❌ IMPLEMENTAR
├── fase-5-estoque-cascata.ts   ❌ IMPLEMENTAR
├── fase-6-multi-dispositivo.ts ❌ IMPLEMENTAR
├── fase-7-time-warp.ts         ❌ IMPLEMENTAR
├── fase-8-relatorio-final.ts   ❌ IMPLEMENTAR
│
└── abrir-interfaces-nivel-5.sh ❌ IMPLEMENTAR
```

---

## 🔥 Fases a Implementar

### FASE 1: Setup Massivo

**Arquivo:** `fase-1-setup-massivo.ts`

**Objetivo:** Criar 1.000 restaurantes com todas as dependências.

**Pseudocódigo:**
```typescript
// Para cada perfil (400, 350, 200, 50):
//   Para cada restaurante no perfil:
//     - Criar restaurante (gm_restaurants)
//     - Criar mesas (gm_tables) - número aleatório dentro do range
//     - Criar locais (gm_locations) - Cozinha, Bar, Estoque
//     - Criar ingredientes (gm_ingredients) - número aleatório dentro do range
//     - Criar produtos (gm_products) - número aleatório dentro do range
//     - Criar BOM (gm_product_bom) - cada produto precisa de 2-5 ingredientes
//     - Criar estoque inicial (gm_stock_levels) - qty > min_qty
//     - Criar pessoas (gm_identities) - número aleatório dentro do range
//     - Atribuir turnos (manhã, tarde, noite)
//   Validar isolamento (multi-restaurante)
```

**Validações:**
- Todos os restaurantes criados
- Isolamento garantido (tenant_id correto)
- Dados consistentes (produtos têm BOM, estoque tem ingredientes)

---

### FASE 2: Pedidos Caos

**Arquivo:** `fase-2-pedidos-caos.ts`

**Objetivo:** Gerar ~500.000 pedidos em caos controlado.

**Pseudocódigo:**
```typescript
// Para cada restaurante:
//   Para cada dia simulado (7 dias):
//     Para cada hora (0-23):
//       Se hora está em peakHours:
//         - Gerar pedidos com alta frequência
//       Senão:
//         - Gerar pedidos com baixa frequência
//   
//   Tipos de pedidos:
//     - Pedidos multi-origem simultânea (QR, Web, TPV, APPSTAFF)
//     - Pedidos concorrentes (mesma mesa, 3-6 autores)
//     - Pedidos longos (30+ itens)
//     - Pedidos curtos repetitivos (mesa pede 10x o mesmo item)
//     - Pedidos cancelados (10% dos pedidos)
//     - Pedidos modificados (5% dos pedidos durante produção)
//   
//   Validar:
//     - Isolamento (pedidos não vazam entre restaurantes)
//     - Autoria (authors corretos)
//     - Estado consistente (status correto)
```

**Validações:**
- Pedidos criados corretamente
- Isolamento garantido
- Autoria preservada
- Estado consistente

---

### FASE 3: KDS Stress

**Arquivo:** `fase-3-kds-stress.ts`

**Objetivo:** Simular produção realista com gargalos artificiais.

**Pseudocódigo:**
```typescript
// Para cada restaurante:
//   - Simular produção realista
//     - Itens rápidos (30s-2min) + longos (15-30min) no mesmo pedido
//     - Gargalos artificiais:
//       - "Bar atrasado" (simular sobrecarga)
//       - "Cozinha sobrecarregada" (simular pico)
//     - Herança de estado (pedido crítico por 1 item)
//   
//   Validar:
//     - Agrupamento correto por estação (BAR, COZINHA)
//     - Timers precisos (tempo real vs. estimado)
//     - Alertas de atraso corretos (>120% do tempo)
//     - Estado consistente (ready_at correto)
```

**Validações:**
- Agrupamento por estação correto
- Timers precisos
- Alertas corretos
- Estado consistente

---

### FASE 4: Task Extreme

**Arquivo:** `fase-4-task-extreme.ts`

**Objetivo:** Gerar tarefas em extremo e validar que nenhuma é absurda/duplicada.

**Pseudocódigo:**
```typescript
// Para cada restaurante:
//   - Gerar tarefas por atraso:
//     - Item >120% do tempo (ATRASO_ITEM)
//     - Item >150% do tempo (ATRASO_ITEM)
//     - Item >200% do tempo (ATRASO_ITEM)
//   
//   - Gerar tarefas por acúmulo:
//     - 3+ itens de BAR pendentes >2min (ACUMULO_BAR)
//     - 5+ itens de COZINHA pendentes >5min (ACUMULO_KITCHEN)
//   
//   - Gerar tarefas por estoque:
//     - Ingrediente abaixo do mínimo (ESTOQUE_CRITICO)
//     - Ingrediente zerado (ESTOQUE_CRITICO)
//   
//   - Gerar tarefas por inatividade:
//     - Sem pedidos por 30min (verificar equipamentos)
//     - Sem pedidos por 2h (verificar sistema)
//     - Sem pedidos por 1 dia (verificar operação)
//   
//   - Gerar tarefas rotina:
//     - Limpeza (diária, semanal)
//     - Conferência de estoque (semanal)
//     - Abertura/fechamento (diária)
//   
//   Validar:
//     - Nenhuma tarefa absurda (contexto válido)
//     - Nenhuma tarefa duplicada (mesma condição, mesma tarefa)
//     - Nenhuma tarefa sem contexto (context preenchido)
//     - Fechamento automático quando condição some
```

**Validações:**
- Tarefas geradas corretamente
- Nenhuma absurda/duplicada/sem contexto
- Fechamento automático funciona

---

### FASE 5: Estoque Cascata

**Arquivo:** `fase-5-estoque-cascata.ts`

**Objetivo:** Simular consumo automático e quebra de estoque em cascata.

**Pseudocódigo:**
```typescript
// Para cada restaurante:
//   - Simular consumo automático:
//     - Via pedidos (usar RPC simulate_order_stock_impact)
//     - Consumo parcial (item não finalizado)
//     - Consumo em cascata (múltiplos itens)
//   
//   - Forçar quebra de estoque:
//     - Em cascata (ingrediente A → produto B → produto C)
//     - Múltiplos ingredientes simultaneamente
//     - Ingrediente crítico (usado em muitos produtos)
//   
//   - Gerar alertas/tarefas/lista de compras:
//     - Alertas (estoque abaixo do mínimo)
//     - Tarefas (ESTOQUE_CRITICO)
//     - Lista de compras (via RPC generate_shopping_list)
//   
//   - Simular compras:
//     - Múltiplos mercados (A, B, C)
//     - Comparação de preços simulada
//     - Reposição parcial e total
//     - Confirmação de compra (via RPC confirm_purchase)
//     - Atualização de estoque → fechamento de tarefas
//   
//   Validar:
//     - Consumo correto (qty reduzida corretamente)
//     - Alertas precisos (quando qty < min_qty)
//     - Lista de compras coerente (sugestão > déficit)
//     - Loop fechado (compra → estoque → produção → compra)
```

**Validações:**
- Consumo correto
- Alertas precisos
- Lista de compras coerente
- Loop fechado funciona

---

### FASE 6: Multi-Dispositivo

**Arquivo:** `fase-6-multi-dispositivo.ts`

**Objetivo:** Simular acesso concorrente de múltiplos dispositivos.

**Pseudocódigo:**
```typescript
// Para cada restaurante:
//   - Simular acesso concorrente:
//     - Tablet KDS (cozinha)
//     - Celular cozinha (cozinheiro)
//     - Celular garçom (garçom)
//     - TPV (caixa)
//     - Cliente QR (mesa)
//     - Cliente Web (delivery)
//   
//   - Simular condições de rede:
//     - Latência variável (50ms-2s)
//     - Queda de conexão (5s-30s)
//     - Realtime vs Polling (fallback)
//   
//   - Simular ações concorrentes:
//     - Mesma mesa, múltiplos autores
//     - Mesmo item, múltiplos dispositivos
//     - Modificação simultânea
//   
//   Validar:
//     - Nenhuma inconsistência de estado
//     - Nenhum "pedido fantasma"
//     - Nenhum "pedido duplicado"
//     - Estado final correto após reconexão
```

**Validações:**
- Nenhuma inconsistência
- Nenhum pedido fantasma/duplicado
- Estado correto após reconexão

---

### FASE 7: Time Warp

**Arquivo:** `fase-7-time-warp.ts`

**Objetivo:** Simular 7 dias de operação (comprimido em minutos).

**Pseudocódigo:**
```typescript
// Para cada restaurante:
//   - Simular 7 dias de operação:
//     - Picos (almoço 12h-14h, jantar 19h-22h)
//     - Horas mortas (15h-18h, 23h-11h)
//     - Abertura (8h-9h)
//     - Fechamento (23h-24h)
//   
//   - Tasks agendadas:
//     - Depois de horas (limpeza diária)
//     - Depois de dias (conferência semanal)
//     - Depois de semanas (manutenção mensal)
//   
//   Validar:
//     - Sistema não "acumula lixo" lógico
//     - Tarefas agendadas aparecem no momento correto
//     - Tarefas antigas são fechadas automaticamente
//     - Estado não "drift" ao longo do tempo
```

**Validações:**
- Sistema não acumula lixo
- Tarefas agendadas corretas
- Estado não drift

---

### FASE 8: Relatório Final

**Arquivo:** `fase-8-relatorio-final.ts`

**Objetivo:** Coletar todas as métricas e gerar relatórios.

**Pseudocódigo:**
```typescript
// Coletar métricas técnicas:
//   - Latência (média, P95, P99, P99.9)
//   - Erros (total, por tipo, por milhão de eventos)
//   - Estado (drift, inconsistências, pedidos fantasma)
// 
// Coletar métricas operacionais:
//   - Tarefas (úteis vs. irrelevantes, timing)
//   - Alertas (timing, falsos positivos/negativos)
// 
// Coletar métricas de produto:
//   - Onde fica inteligente
//   - Onde fica chato
//   - Onde surpreende
//   - Onde exige UI clara
// 
// Gerar relatórios:
//   - RELATORIO_FINAL_NIVEL_5.md
//   - MAPA_POTENCIAL.md
//   - MAPA_RISCO.md
//   - LISTA_UI_CRITICA.md
//   - LISTA_UI_RUIDO.md
//   - METRICAS_TECNICAS.md
//   - METRICAS_OPERACIONAIS.md
//   - METRICAS_PRODUTO.md
```

**Validações:**
- Todas as métricas coletadas
- Todos os relatórios gerados

---

## 🛠️ Utilitários a Implementar

### scenario-generator.ts

**Objetivo:** Gerar cenários realistas baseados em perfis de restaurantes.

**Funções:**
- `generateRestaurantScenario(profile: RestaurantProfileConfig): Scenario`
- `generateOrderScenario(restaurant: RestaurantData, hour: number): OrderScenario`
- `generateTaskScenario(restaurant: RestaurantData): TaskScenario`

---

### people-simulator.ts

**Objetivo:** Simular pessoas com turnos, sobreposição, ausência.

**Funções:**
- `generatePeople(restaurant: RestaurantData, count: number): PersonData[]`
- `assignShifts(people: PersonData[]): void`
- `simulateAbsence(people: PersonData[], day: number): PersonData[]`

---

### order-chaos-engine.ts

**Objetivo:** Gerar pedidos em caos controlado.

**Funções:**
- `generateConcurrentOrders(restaurant: RestaurantData, table: TableData, authors: PersonData[]): OrderData[]`
- `generateLongOrder(restaurant: RestaurantData, table: TableData, itemCount: number): OrderData`
- `generateRepetitiveOrder(restaurant: RestaurantData, table: TableData, item: ProductData, count: number): OrderData`

---

### task-stress-engine.ts

**Objetivo:** Gerar tarefas em extremo e validar.

**Funções:**
- `generateDelayTasks(restaurant: RestaurantData): TaskData[]`
- `generateAccumulationTasks(restaurant: RestaurantData): TaskData[]`
- `generateStockTasks(restaurant: RestaurantData): TaskData[]`
- `validateTasks(tasks: TaskData[]): ValidationResult`

---

### inventory-simulator.ts

**Objetivo:** Simular consumo e quebra de estoque.

**Funções:**
- `simulateConsumption(restaurant: RestaurantData, orders: OrderData[]): void`
- `forceStockBreak(restaurant: RestaurantData, ingredient: IngredientData): void`
- `simulatePurchase(restaurant: RestaurantData, ingredient: IngredientData, qty: number): void`

---

### time-warp.ts

**Objetivo:** Simular tempo comprimido (7 dias em minutos).

**Funções:**
- `warpTime(restaurant: RestaurantData, days: number): void`
- `simulatePeakHours(restaurant: RestaurantData, hour: number): void`
- `simulateDeadHours(restaurant: RestaurantData, hour: number): void`

---

## 📊 Critérios de Parada

### Parada por Erro Fatal
- Erro que quebra isolamento (multi-restaurante)
- Erro que corrompe estado (pedido fantasma)
- Erro que impede continuidade

### Parada por Performance
- Latência P99 >10s
- Taxa de erro >1%
- Drift de estado >0

### Parada por Validação
- Tarefas duplicadas >0
- Tarefas sem contexto >0
- Tarefas absurdas >0

### Parada Normal
- Todas as fases completadas
- Todas as validações passaram
- Relatórios gerados

---

## 🚨 Regra de Ouro

**Nenhuma UI nova.**  
**Nenhum ajuste cosmético.**  
**Nenhuma feature nova.**

**Somente:**
- Observar
- Medir
- Aprender

---

## ✅ Checklist de Implementação

- [ ] FASE 1: Setup Massivo
- [ ] FASE 2: Pedidos Caos
- [ ] FASE 3: KDS Stress
- [ ] FASE 4: Task Extreme
- [ ] FASE 5: Estoque Cascata
- [ ] FASE 6: Multi-Dispositivo
- [ ] FASE 7: Time Warp
- [ ] FASE 8: Relatório Final
- [ ] Utilitários (scenario-generator, people-simulator, etc.)
- [ ] Script de abertura de interfaces

---

**Conclusão:** Prompt completo para implementar Teste Massivo Nível 5. Todas as fases, utilitários e validações definidos. Pronto para implementação.
