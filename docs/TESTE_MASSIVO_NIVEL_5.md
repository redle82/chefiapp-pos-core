# Teste Massivo Nível 5 — "Stress de Realidade Extrema"

**Data:** 2026-01-26  
**Status:** 🎯 DESIGN

**Objetivo:** Descobrir onde o motor começa a dobrar, ranger ou revelar potenciais ocultos quando empurrado além do normal.

---

## 🎯 Princípio-Base

> **"Extrair o máximo de verdade possível do motor antes de 'maquiar' qualquer coisa."**

Este teste:
- Nenhum cliente faria
- Nenhum concorrente testa
- Nenhuma demo mostra
- **Define o limite real do sistema**

---

## 📊 Escala do Teste

### 🏪 Restaurantes: 1.000

**Distribuição por perfil:**
- **400 ambulantes/micro** (0-3 mesas, 1-2 funcionários)
- **350 pequenos/médios** (10-20 mesas, 5-10 funcionários)
- **200 grandes** (40-80 mesas, 15-30 funcionários)
- **50 enterprise** (120-300 mesas, 50-150 funcionários)

**Cada grupo com:**
- Regras diferentes
- Carga diferente
- Comportamento diferente

---

### 🪑 Mesas: ~18.000

**Distribuição:**
- Ambulante: 0-3 mesas (média 1.5) = ~600 mesas
- Pequenos: 10-20 mesas (média 15) = ~5.250 mesas
- Grandes: 40-80 mesas (média 60) = ~12.000 mesas
- Enterprise: 120-300 mesas (média 200) = ~10.000 mesas

**Total estimado:** ~27.850 mesas

---

### 👥 Pessoas/Perfis: ~12.000 identidades

**Distribuição:**
- Garçons: ~3.000
- Cozinheiros: ~2.500
- Bartenders: ~1.500
- Gerentes: ~1.000
- Donos: ~500
- Clientes QR: ~2.000
- Clientes Web: ~1.500

**Características:**
- Turnos (manhã, tarde, noite)
- Sobreposição (mudança de turno)
- Ausência de pessoal (cenários reais)
- Ações concorrentes (mesma mesa, mesmo item)

---

## 🔥 O Que Será Testado

### 1. Pedidos (Caos Controlado)

**Multi-origem simultânea:**
- QR Mesa
- Web Pública
- Garçom (TPV)
- Gerente (APPSTAFF_MANAGER)
- Dono (APPSTAFF_OWNER)
- TPV direto

**Cenários:**
- Pedidos concorrentes na mesma mesa (3-6 autores)
- Divisão de conta complexa
- Pedidos longos (30+ itens)
- Pedidos curtos e repetitivos (mesa pede 10x o mesmo item)
- Pedidos cancelados em cascata
- Pedidos modificados durante produção

**Volume esperado:** ~500.000 pedidos em 7 dias simulados

---

### 2. KDS (Produção Realista)

**Separação BAR / COZINHA:**
- Itens de BAR (bebidas, drinks)
- Itens de COZINHA (comidas)
- Itens MISTOS (requerem ambas estações)

**Tempos de preparo:**
- Itens rápidos (30s-2min)
- Itens médios (5-10min)
- Itens longos (15-30min)
- Itens muito longos (45-60min)

**Gargalos artificiais:**
- "Bar atrasado" (simular sobrecarga)
- "Cozinha sobrecarregada" (simular pico)
- Herança de estado (pedido crítico por 1 item)

**Validação:**
- Agrupamento correto por estação
- Timers precisos
- Alertas de atraso corretos
- Estado consistente

---

### 3. Task Engine (O Coração do Teste)

**Geração automática de tarefas por:**

**Atraso de item:**
- Item >120% do tempo estimado
- Item >150% do tempo estimado
- Item >200% do tempo estimado
- Múltiplos itens atrasados no mesmo pedido

**Acúmulo de pedidos:**
- 3+ itens de BAR pendentes >2min
- 5+ itens de COZINHA pendentes >5min
- Pedidos acumulados em pico

**Falta de estoque:**
- Ingrediente abaixo do mínimo
- Ingrediente zerado
- Ruptura em cascata (múltiplos ingredientes)

**Inatividade:**
- Sem pedidos por 30min (verificar equipamentos)
- Sem pedidos por 2h (verificar sistema)
- Sem pedidos por 1 dia (verificar operação)

**Rotina:**
- Limpeza (diária, semanal)
- Conferência de estoque (semanal)
- Abertura/fechamento (diária)

**Tarefas por:**
- Cargo (garçom, cozinheiro, gerente, dono)
- Estação (BAR, COZINHA, ESTOQUE)
- Tamanho do restaurante (micro, pequeno, grande, enterprise)

**Validação crítica:**
- Nenhuma tarefa absurda
- Nenhuma tarefa duplicada
- Nenhuma tarefa sem contexto
- Tarefas fechadas automaticamente quando condição some

---

### 4. Estoque + Inventário + Compras

**Consumo automático:**
- Por item vendido (via BOM)
- Consumo parcial (item não finalizado)
- Consumo em cascata (múltiplos itens)

**Quebra de estoque:**
- Em cascata (ingrediente A → produto B → produto C)
- Múltiplos ingredientes simultaneamente
- Ingrediente crítico (usado em muitos produtos)

**Geração de:**
- Alertas (estoque abaixo do mínimo)
- Tarefas (ESTOQUE_CRITICO)
- Lista de compras (automática)

**Simulação de compras:**
- Múltiplos mercados (A, B, C)
- Comparação de preços simulada
- Reposição parcial e total
- Confirmação de compra → atualização de estoque → fechamento de tarefas

**Validação:**
- Consumo correto
- Alertas precisos
- Lista de compras coerente
- Loop fechado (compra → estoque → produção → compra)

---

### 5. Multi-Dispositivo / Concorrência

**Mesmo restaurante acessado por:**
- Tablet KDS (cozinha)
- Celular cozinha (cozinheiro)
- Celular garçom (garçom)
- TPV (caixa)
- Cliente QR (mesa)
- Cliente Web (delivery)

**Simulação de:**
- Latência variável (50ms-2s)
- Queda de conexão (5s-30s)
- Realtime vs Polling (fallback)
- Ações concorrentes (mesma mesa, mesmo item)

**Garantir:**
- Nenhuma inconsistência de estado
- Nenhum "pedido fantasma"
- Nenhum "pedido duplicado"
- Estado final correto após reconexão

---

### 6. Multi-Tempo (O Que Ninguém Testa)

**Simular 7 dias de operação em minutos:**
- Pico almoço (12h-14h)
- Pico jantar (19h-22h)
- Horas mortas (15h-18h, 23h-11h)
- Abertura (8h-9h)
- Fechamento (23h-24h)

**Tasks que só surgem:**
- Depois de horas (limpeza diária)
- Depois de dias (conferência semanal)
- Depois de semanas (manutenção mensal)

**Validação:**
- Sistema não "acumula lixo" lógico
- Tarefas agendadas aparecem no momento correto
- Tarefas antigas são fechadas automaticamente
- Estado não "drift" ao longo do tempo

---

## 📊 Métricas que Realmente Importam

### Métricas Técnicas

**Latência:**
- Média (ms)
- P95 (ms)
- P99 (ms)
- P99.9 (ms)

**Erros:**
- Erros por milhão de eventos
- Taxa de erro por tipo (pedido, tarefa, estoque)
- Erros fatais vs. recuperáveis

**Estado:**
- Drift de estado (0 tolerado)
- Inconsistências detectadas
- Pedidos "fantasma"
- Tarefas "fantasma"

---

### Métricas Operacionais

**Tarefas:**
- Tarefas úteis vs. irrelevantes (%)
- Tarefas acionadas no momento correto (%)
- Tarefas acionadas cedo demais (%)
- Tarefas acionadas tarde demais (%)
- Tarefas duplicadas (0 tolerado)
- Tarefas sem contexto (0 tolerado)

**Alertas:**
- Alertas acionados cedo demais (%)
- Alertas acionados tarde demais (%)
- Alertas falsos positivos (%)
- Alertas falsos negativos (%)

---

### Métricas de Produto (As Mais Importantes)

**Onde o sistema fica inteligente sozinho:**
- Tarefas geradas automaticamente que resolvem problemas reais
- Alertas que previnem problemas antes que aconteçam
- Sugestões que melhoram operação

**Onde ele fica chato:**
- Tarefas repetitivas desnecessárias
- Alertas excessivos
- Ruído que não agrega valor

**Onde ele surpreende positivamente:**
- Comportamentos inesperados que agregam valor
- Detecções que ninguém esperava
- Eficiências que emergem naturalmente

**Onde ele exigiria UI muito clara:**
- Informações críticas que precisam ser visíveis
- Ações que precisam ser óbvias
- Estados que precisam ser claros

---

## 🧠 Resultado Esperado (O Verdadeiro Ganho)

**No final desse teste você não terá:**
- "um sistema testado"

**Você terá:**
- **Mapa claro de potencial** (onde o sistema brilha)
- **Mapa de risco** (onde o sistema pode quebrar)
- **Lista objetiva do que a UI PRECISA mostrar** (informações críticas)
- **Lista do que nunca deve ser mostrado** (ruído desnecessário)

👉 **Esse teste define a UI/UX correta. Não o contrário.**

---

## 🧩 Arquitetura do Teste

### Estrutura de Pastas

```
scripts/teste-massivo-nivel-5/
├── types.ts                    # Tipos e interfaces
├── db.ts                       # Conexão com banco
├── logger.ts                   # Sistema de logging
├── scenario-generator.ts       # Gerador de cenários
├── restaurant-profiles.ts      # Perfis de restaurantes
├── people-simulator.ts         # Simulador de pessoas
├── order-chaos-engine.ts       # Motor de caos de pedidos
├── task-stress-engine.ts       # Motor de stress de tarefas
├── inventory-simulator.ts      # Simulador de estoque
├── time-warp.ts                # Simulação de tempo
├── fase-0-preflight.ts         # Validação pré-teste
├── fase-1-setup-massivo.ts     # Setup de 1.000 restaurantes
├── fase-2-pedidos-caos.ts      # Pedidos em caos controlado
├── fase-3-kds-stress.ts        # Stress de KDS
├── fase-4-task-extreme.ts      # Task Engine em extremo
├── fase-5-estoque-cascata.ts   # Estoque em cascata
├── fase-6-multi-dispositivo.ts # Multi-dispositivo/concorrência
├── fase-7-time-warp.ts         # Simulação de 7 dias
├── fase-8-relatorio-final.ts   # Relatório final
├── index.ts                    # Orquestrador principal
├── teste-massivo-nivel-5.sh    # Script de execução
└── abrir-interfaces-nivel-5.sh # Script para abrir UIs
```

---

### Pseudocódigo das Fases

#### FASE 0: Preflight

```typescript
// Validar Docker Core
// Validar schema completo
// Validar RPCs críticos
// Validar Realtime
// Gerar run_id único
// Criar diretório de resultados
```

#### FASE 1: Setup Massivo

```typescript
// Para cada perfil de restaurante (400, 350, 200, 50):
//   - Criar restaurantes
//   - Criar mesas (distribuição por perfil)
//   - Criar locais (Cozinha, Bar, Estoque)
//   - Criar ingredientes (10-50 por restaurante)
//   - Criar produtos (20-100 por restaurante)
//   - Criar estoque inicial
//   - Criar pessoas (identidades)
//   - Atribuir turnos
// Validar isolamento (multi-restaurante)
```

#### FASE 2: Pedidos Caos

```typescript
// Para cada restaurante:
//   - Gerar pedidos multi-origem simultânea
//   - Pedidos concorrentes (mesma mesa, múltiplos autores)
//   - Pedidos longos (30+ itens)
//   - Pedidos curtos repetitivos
//   - Pedidos cancelados
//   - Pedidos modificados
// Validar: isolamento, autoria, estado consistente
```

#### FASE 3: KDS Stress

```typescript
// Para cada restaurante:
//   - Simular produção realista
//   - Itens rápidos + longos no mesmo pedido
//   - Gargalos artificiais (bar atrasado, cozinha sobrecarregada)
//   - Herança de estado (pedido crítico por 1 item)
// Validar: agrupamento, timers, alertas, estado
```

#### FASE 4: Task Extreme

```typescript
// Para cada restaurante:
//   - Gerar tarefas por atraso (item >120%, >150%, >200%)
//   - Gerar tarefas por acúmulo (BAR, COZINHA)
//   - Gerar tarefas por estoque (abaixo mínimo, zerado)
//   - Gerar tarefas por inatividade (30min, 2h, 1 dia)
//   - Gerar tarefas rotina (limpeza, conferência, abertura/fechamento)
//   - Validar: nenhuma absurda, nenhuma duplicada, nenhuma sem contexto
//   - Validar: fechamento automático quando condição some
```

#### FASE 5: Estoque Cascata

```typescript
// Para cada restaurante:
//   - Simular consumo automático (via pedidos)
//   - Forçar quebra de estoque em cascata
//   - Gerar alertas, tarefas, lista de compras
//   - Simular compras (múltiplos mercados, comparação de preços)
//   - Confirmar compras → atualizar estoque → fechar tarefas
// Validar: consumo correto, alertas precisos, loop fechado
```

#### FASE 6: Multi-Dispositivo

```typescript
// Para cada restaurante:
//   - Simular acesso concorrente (tablet, celular, TPV, QR, Web)
//   - Simular latência variável (50ms-2s)
//   - Simular queda de conexão (5s-30s)
//   - Simular ações concorrentes (mesma mesa, mesmo item)
// Validar: nenhuma inconsistência, nenhum pedido fantasma
```

#### FASE 7: Time Warp

```typescript
// Para cada restaurante:
//   - Simular 7 dias de operação (comprimido em minutos)
//   - Picos (almoço, jantar)
//   - Horas mortas
//   - Abertura/fechamento
//   - Tasks agendadas (horas, dias, semanas)
// Validar: sistema não acumula lixo, tarefas agendadas corretas
```

#### FASE 8: Relatório Final

```typescript
// Coletar todas as métricas
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

## 📋 Critérios de Parada

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

## 📊 Relatórios Esperados

### 1. RELATORIO_FINAL_NIVEL_5.md
- Resumo executivo
- Métricas consolidadas
- Validações passadas/falhadas
- Conclusões

### 2. MAPA_POTENCIAL.md
- Onde o sistema brilha
- Comportamentos inesperados positivos
- Eficiências que emergem naturalmente

### 3. MAPA_RISCO.md
- Onde o sistema pode quebrar
- Limites identificados
- Pontos de atenção

### 4. LISTA_UI_CRITICA.md
- Informações que PRECISAM ser visíveis
- Ações que PRECISAM ser óbvias
- Estados que PRECISAM ser claros

### 5. LISTA_UI_RUIDO.md
- Informações que NUNCA devem ser mostradas
- Alertas desnecessários
- Tarefas que geram ruído

### 6. METRICAS_TECNICAS.md
- Latência (média, P95, P99, P99.9)
- Erros (por tipo, por milhão de eventos)
- Estado (drift, inconsistências)

### 7. METRICAS_OPERACIONAIS.md
- Tarefas (úteis vs. irrelevantes, timing)
- Alertas (timing, falsos positivos/negativos)

### 8. METRICAS_PRODUTO.md
- Onde fica inteligente
- Onde fica chato
- Onde surpreende
- Onde exige UI clara

---

## 🎯 Próximo Passo

**Executar o teste:**

```bash
./scripts/teste-massivo-nivel-5/teste-massivo-nivel-5.sh
```

**Abrir interfaces para validação visual:**

```bash
./scripts/teste-massivo-nivel-5/abrir-interfaces-nivel-5.sh
```

---

**Conclusão:** Teste Massivo Nível 5 definido. Escala extrema, métricas claras, relatórios objetivos. Pronto para descobrir os limites reais do sistema.
