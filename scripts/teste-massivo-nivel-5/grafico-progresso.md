# 📊 Gráfico de Progresso - Teste Massivo Nível 5

## 🎯 Estrutura do Teste

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TESTE MASSIVO NÍVEL 5                                 │
│              Stress de Realidade Extrema                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 0: PREFLIGHT                                                       │
│ ─────────────────────────────────────────────────────────────────────── │
│ • Validar Docker Core                                                   │
│ • Validar schema mínimo                                                 │
│ • Validar RPCs críticos                                                 │
│ • Validar Realtime                                                      │
│ • Gerar run_id único                                                    │
│ • Criar diretório de resultados                                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 1: SETUP MASSIVO                                                   │
│ ─────────────────────────────────────────────────────────────────────── │
│ • 400 Ambulantes/Micro (0-3 mesas, 1-3 pessoas)                        │
│ • 350 Pequenos/Médios (10-20 mesas, 5-10 pessoas)                       │
│ • 200 Grandes (40-80 mesas, 15-30 pessoas)                             │
│ • 50 Enterprise (120-300 mesas, 50-150 pessoas)                         │
│                                                                          │
│ Para cada restaurante:                                                  │
│   ├─ Mesas (número aleatório dentro do range)                          │
│   ├─ Locais (Cozinha, Bar, Estoque)                                    │
│   ├─ Ingredientes (15-200 conforme perfil)                             │
│   ├─ Produtos (10-150 conforme perfil)                                 │
│   ├─ Estoque inicial (qty > min_qty)                                   │
│   └─ Pessoas/Identidades (1-150 conforme perfil)                        │
│                                                                          │
│ Validação: Isolamento multi-restaurante                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 2: PEDIDOS CAOS                                                    │
│ ─────────────────────────────────────────────────────────────────────── │
│ • ~500.000 pedidos em 7 dias simulados                                  │
│                                                                          │
│ Tipos de pedidos:                                                        │
│   ├─ 10% Concorrentes (mesma mesa, 3-6 autores)                         │
│   ├─ 5% Longos (30-50 itens)                                           │
│   ├─ 5% Repetitivos (mesa pede 10x o mesmo item)                       │
│   └─ 80% Normais (1-5 itens)                                            │
│                                                                          │
│ Simulação:                                                               │
│   ├─ 7 dias (comprimidos)                                               │
│   ├─ Picos (almoço 12h-14h, jantar 19h-22h)                            │
│   ├─ Horas mortas (15h-18h, 23h-11h)                                    │
│   ├─ 10% Cancelados                                                     │
│   └─ 5% Modificados                                                     │
│                                                                          │
│ Validação: Isolamento, autoria, estado consistente                       │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 3: KDS STRESS                                                      │
│ ─────────────────────────────────────────────────────────────────────── │
│ • Validação de agrupamento por estação (BAR/KITCHEN)                    │
│ • Simulação de produção realista (marcar itens como IN_PREP)            │
│ • Gargalos artificiais:                                                  │
│   ├─ Bar atrasado (200 itens de BAR há 15 minutos)                      │
│   └─ Cozinha sobrecarregada (300 itens de KITCHEN há 45 minutos)       │
│                                                                          │
│ Validação:                                                               │
│   ├─ Agrupamento por estação correto                                    │
│   ├─ Timers por item (tempo decorrido vs. estimado)                     │
│   ├─ Alertas de atraso (>120%, >150%)                                   │
│   └─ Estado consistente (sem inconsistências)                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 4: TASK EXTREME                                                    │
│ ─────────────────────────────────────────────────────────────────────── │
│ • Gerar tarefas de pedidos (atraso, acúmulo)                            │
│ • Gerar tarefas agendadas (rotina)                                      │
│                                                                          │
│ Validação crítica:                                                       │
│   ├─ Nenhuma tarefa absurda (contexto válido)                           │
│   ├─ Nenhuma tarefa duplicada                                           │
│   ├─ Nenhuma tarefa sem contexto                                        │
│   └─ Fechamento automático quando condição some                        │
│                                                                          │
│ Estatísticas:                                                            │
│   ├─ Distribuição por tipo/estação/prioridade                          │
│   └─ Tempo médio de resolução                                           │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 5: ESTOQUE CASCATA                                                 │
│ ─────────────────────────────────────────────────────────────────────── │
│ • Simular consumo automático (via pedidos e BOM)                        │
│ • Forçar quebra de estoque em cascata                                   │
│   ├─ Ingrediente crítico → múltiplos produtos                          │
│   └─ Múltiplos ingredientes simultaneamente                            │
│                                                                          │
│ • Gerar alertas, tarefas, lista de compras                               │
│ • Simular compras (múltiplos mercados, comparação de preços)            │
│ • Confirmar compras via RPC confirm_purchase                            │
│                                                                          │
│ Validação:                                                               │
│   ├─ Consumo correto (via BOM)                                          │
│   ├─ Alertas precisos (quando qty < min_qty)                            │
│   ├─ Lista de compras coerente (sugestão > déficit)                     │
│   └─ Loop fechado (compra → estoque → tarefas fechadas)                 │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 6: MULTI-DISPOSITIVO                                               │
│ ─────────────────────────────────────────────────────────────────────── │
│ • 1.000 ações concorrentes de múltiplos dispositivos                    │
│                                                                          │
│ Tipos de dispositivo:                                                    │
│   ├─ Tablet KDS (cozinha)                                               │
│   ├─ Celular Cozinha (cozinheiro)                                       │
│   ├─ Celular Garçom (garçom)                                            │
│   ├─ TPV (caixa)                                                         │
│   ├─ Cliente QR (mesa)                                                   │
│   └─ Cliente Web (delivery)                                              │
│                                                                          │
│ Simulação:                                                               │
│   ├─ Latência variável (50ms-2s)                                       │
│   └─ Queda de conexão (5% das ações)                                    │
│                                                                          │
│ Validação:                                                               │
│   ├─ Isolamento multi-restaurante                                       │
│   ├─ Autoria preservada                                                 │
│   ├─ Nenhum pedido fantasma (0 tolerado)                                │
│   ├─ Nenhum pedido duplicado                                            │
│   ├─ Estado consistente após reconexão                                  │
│   └─ Nenhum item órfão (0 tolerado)                                     │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 7: TIME WARP                                                       │
│ ─────────────────────────────────────────────────────────────────────── │
│ • Simular 7 dias de operação (comprimido)                               │
│                                                                          │
│ Períodos:                                                                │
│   ├─ Abertura (8h-9h)                                                   │
│   ├─ Pico almoço (12h-14h)                                              │
│   ├─ Horas mortas (15h-18h)                                             │
│   ├─ Pico jantar (19h-22h)                                              │
│   └─ Fechamento (23h-24h)                                                │
│                                                                          │
│ Tasks agendadas:                                                         │
│   ├─ Por hora (limpeza diária)                                          │
│   ├─ Por dia (conferência de estoque)                                    │
│   └─ Por semana (manutenção)                                             │
│                                                                          │
│ Validação:                                                               │
│   ├─ Sistema não acumula lixo lógico                                    │
│   ├─ Tarefas agendadas aparecem no momento correto                      │
│   ├─ Tarefas antigas são fechadas automaticamente                      │
│   └─ Estado não "drift" ao longo do tempo                               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FASE 8: RELATÓRIO FINAL                                                 │
│ ─────────────────────────────────────────────────────────────────────── │
│ • Coletar métricas técnicas (latência, erros, estado)                  │
│ • Coletar métricas operacionais (tarefas, alertas)                      │
│ • Coletar métricas de produto (inteligente, chato, surpreende)          │
│                                                                          │
│ Gerar 8 relatórios:                                                      │
│   ├─ RELATORIO_FINAL_NIVEL_5.md (resumo executivo)                      │
│   ├─ MAPA_POTENCIAL.md (onde o sistema brilha)                          │
│   ├─ MAPA_RISCO.md (onde o sistema pode quebrar)                        │
│   ├─ LISTA_UI_CRITICA.md (o que a UI PRECISA mostrar)                   │
│   ├─ LISTA_UI_RUIDO.md (o que NUNCA deve ser mostrado)                  │
│   ├─ METRICAS_TECNICAS.md (latência, erros, estado)                     │
│   ├─ METRICAS_OPERACIONAIS.md (tarefas, alertas)                        │
│   └─ METRICAS_PRODUTO.md (onde fica inteligente/chato/surpreende)       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Fluxo de Dados

```
┌──────────────┐
│  1.000        │
│ Restaurantes  │
└──────┬────────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│  ~27.850     │                    │  ~12.000     │
│   Mesas      │                    │   Pessoas    │
└──────────────┘                    └──────────────┘
       │                                     │
       └──────────────┬──────────────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ ~500.000     │
              │   Pedidos    │
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │   KDS    │  │  Tasks  │  │ Estoque │
  │  Stress  │  │ Extreme │  │ Cascata │
  └─────────┘  └─────────┘  └─────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  8 Relatórios│
              │   Gerados    │
              └──────────────┘
```

## 🎯 Objetivo Final

**Descobrir:**
- ✅ Onde o sistema brilha (MAPA_POTENCIAL)
- ⚠️ Onde o sistema pode quebrar (MAPA_RISCO)
- 🎨 O que a UI PRECISA mostrar (LISTA_UI_CRITICA)
- 🔇 O que NUNCA deve ser mostrado (LISTA_UI_RUIDO)

**Resultado:**
- UI nasce dos dados, não de suposições
- Motor define a UI, não o contrário
