# 🎨 Design Completo de Telas - ChefIApp

**Status:** 📋 **DESIGN COMPLETO**  
**Autor:** Product Designer + Systems Architect  
**Objetivo:** Expressar a verdade do Core sem violar regras constitucionais

---

## 🧠 FILOSOFIA DE DESIGN

### Princípios Fundamentais

1. **UI Expressa Verdade, Nunca Inventa**
   - Se o Core diz "estoque zero", a UI mostra "estoque zero"
   - Nunca permitir ações que violam regras constitucionais
   - Estados ilegais são bloqueados, não mascarados

2. **Cada Tela Responde Uma Pergunta Humana**
   - Não criar telas "porque sim"
   - Hierarquia clara: Operação > Planejamento > Aprendizado
   - Decisão > Informação > Dados brutos

3. **IA Como Mentora, Não Chatbot**
   - Aparece quando há contexto suficiente para ação
   - Fala quando há algo a ensinar
   - Cala quando não há valor

4. **Separação Clara de Responsabilidades**
   - Funcionário: "O que fazer agora?"
   - Gerente: "Onde está o problema?"
   - Dono: "Onde mexer para melhorar?"

---

## 📱 TELAS COMPLETAS

### 1. DASHBOARD PRINCIPAL

**Pergunta:** "Está tudo bem agora?"

**Perfis:** Dono, Gerente

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Dashboard Principal                      │
├─────────────────────────────────────────┤
│                                          │
│  🟢 Status Geral: SAUDÁVEL              │
│  ─────────────────────────────────────  │
│                                          │
│  ⚠️  ALERTAS PRIORITÁRIOS (2)          │
│  ┌──────────────────────────────────┐  │
│  │ 🔴 Estoque crítico: Tomate (0kg) │  │
│  │    Ação: Comprar agora           │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 🟡 KDS atrasado: 3 itens         │  │
│  │    Ação: Ver KDS                 │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 GARGALOS ATIVOS                     │
│  ┌──────────────────────────────────┐  │
│  │ KDS: BAR (2 itens atrasados)     │  │
│  │ Estoque: 1 item crítico           │  │
│  │ Staff: Cobertura adequada        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  💡 PRÓXIMA DECISÃO (IA)                │
│  ┌──────────────────────────────────┐  │
│  │ "Adicionar 1 pessoa no turno     │  │
│  │  das 20h. Previsão: 12 reservas  │  │
│  │  confirmadas."                    │  │
│  │  [Aplicar] [Ver detalhes]        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🚀 ACESSO RÁPIDO                        │
│  [Operação] [Estoque] [Compras]         │
│  [Central] [Reservas]                   │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Primeira tela que o gerente/dono vê
- Responde imediatamente: "está tudo bem?"
- Alertas são acionáveis, não apenas informativos
- IA aparece apenas quando há decisão clara a tomar
- Não mostra dados brutos, apenas o que importa

**Fluxo:**
- Dashboard → Alerta → Tela específica (Estoque, KDS, etc.)
- Dashboard → Decisão IA → Aplicar ou Ver detalhes

**Regras:**
- Status verde: tudo operacional
- Status amarelo: atenção necessária
- Status vermelho: ação imediata
- IA só aparece se houver contexto suficiente para decisão

---

### 2. CENTRAL DE COMANDO

**Pergunta:** "O sistema está saudável?"

**Perfis:** Dono, Gerente (modo técnico)

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Central de Comando                      │
├─────────────────────────────────────────┤
│                                          │
│  📊 PROGRESSO OPERACIONAL                │
│  ┌──────────────────────────────────┐  │
│  │ Turno atual: 45%                │  │
│  │ Pedidos: 23/50 (meta)            │  │
│  │ SLA: 2 violados (aceitável)      │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📡 EVENTOS RELEVANTES (últimos 30min)  │
│  ┌──────────────────────────────────┐  │
│  │ 14:30 - Estoque crítico: Tomate  │  │
│  │ 14:25 - SLA violado: Mesa 5     │  │
│  │ 14:20 - Reserva confirmada: 4p  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⏱️  SLAs EM RISCO (3)                  │
│  ┌──────────────────────────────────┐  │
│  │ Mesa 5 - Pedido #123             │  │
│  │ Tempo: 18min / 15min (atrasado)  │  │
│  │ Causa: KDS BAR bloqueado         │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🏢 RESTAURANTES/TURNOS PROBLEMÁTICOS   │
│  ┌──────────────────────────────────┐  │
│  │ Restaurante A - Turno 20h        │  │
│  │  3 SLAs violados esta semana     │  │
│  │  [Ver detalhes]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📅 TIMELINE EVENTOS CRÍTICOS           │
│  ┌──────────────────────────────────┐  │
│  │ Hoje                              │  │
│  │ 14:30 █ Estoque crítico           │  │
│  │ 14:25 █ SLA violado               │  │
│  │ 13:00 █ Pico de pedidos           │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Filtro: Hoje | Semana | Mês]          │
│  [Filtro: Run ID]                       │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Visão sistêmica, não operacional
- Mostra eventos relevantes, não tudo
- Foco em problemas e padrões
- Timeline ajuda a entender causa-efeito

**Fluxo:**
- Central → Evento → Detalhes
- Central → SLA → KDS/Operação
- Central → Run ID → Explorer detalhado

**Regras:**
- Eventos são filtrados por relevância (não spam)
- SLAs mostram causa raiz, não apenas sintoma
- Timeline mostra apenas eventos críticos

---

### 3. OPERAÇÃO AO VIVO

**Pergunta:** "O que está acontecendo agora?"

**Perfis:** Funcionário (por função), Gerente (supervisão)

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Operação ao Vivo                        │
├─────────────────────────────────────────┤
│                                          │
│  📋 PEDIDOS ATIVOS (8)                   │
│  ┌──────────────────────────────────┐  │
│  │ Mesa 5 - Pedido #123             │  │
│  │ Status: Em preparo               │  │
│  │ Tempo: 12min / 15min             │  │
│  │ [Ver detalhes]                   │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Mesa 12 - Pedido #124            │  │
│  │ Status: Aguardando               │  │
│  │ Tempo: 5min / 15min              │  │
│  │ [Ver detalhes]                   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🍳 KDS POR ESTAÇÃO                     │
│  ┌──────────────────────────────────┐  │
│  │ BAR: 3 itens                     │  │
│  │   ⚠️  2 atrasados                │  │
│  │ KITCHEN: 5 itens                 │  │
│  │   ✅ Todos em tempo               │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📦 BACKLOG VISÍVEL                     │
│  ┌──────────────────────────────────┐  │
│  │ 3 pedidos aguardando preparo     │  │
│  │ Tempo médio de espera: 8min       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⏰ ATRASOS REAIS                        │
│  ┌──────────────────────────────────┐  │
│  │ Mesa 5 - 3min atrasado            │  │
│  │ Causa: Item bloqueado (falta)   │  │
│  │ [Resolver]                        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⚡ AÇÕES RÁPIDAS                        │
│  [Novo Pedido] [Ver KDS] [Ver Mesas]    │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Visão em tempo real, não histórica
- Foco no que está acontecendo AGORA
- Ações rápidas permitidas (não bloqueadas)
- Backlog visível para planejamento

**Fluxo:**
- Operação → Pedido → Detalhes
- Operação → KDS → Estação específica
- Operação → Atraso → Resolver

**Regras:**
- Apenas pedidos ativos (não fechados)
- Atrasos mostram causa, não apenas tempo
- Ações rápidas respeitam regras do Core

---

### 4. KDS INTELIGENTE

**Pergunta:** "Onde está o gargalo?"

**Perfis:** Funcionário (cozinha/bar), Gerente (supervisão)

**Componentes:**

```
┌─────────────────────────────────────────┐
│ KDS Inteligente                         │
├─────────────────────────────────────────┤
│                                          │
│  [BAR] [KITCHEN] [DESSERT]              │
│                                          │
│  🍸 BAR (3 itens)                        │
│  ┌──────────────────────────────────┐  │
│  │ ⚠️  Caipirinha - Mesa 5          │  │
│  │    Tempo: 18min / 10min          │  │
│  │    Status: ATRASADO             │  │
│  │    [Marcar pronto]               │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 🟡 Mojito - Mesa 12              │  │
│  │    Tempo: 8min / 10min           │  │
│  │    Status: Em preparo           │  │
│  │    [Marcar pronto]               │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ ✅ Gin Tônica - Mesa 8            │  │
│  │    Tempo: 5min / 10min           │  │
│  │    Status: Pronto                │  │
│  │    [Entregar]                    │  │
│  └──────────────────────────────────┘  │
│                                          │
│  💡 SUGESTÃO (IA)                        │
│  ┌──────────────────────────────────┐  │
│  │ "Caipirinha atrasada: falta      │  │
│  │  limão. Repor estoque urgente."  │  │
│  │  [Ver estoque] [Bloquear item]   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 AGRUPAMENTO INTELIGENTE              │
│  ┌──────────────────────────────────┐  │
│  │ 3 Caipirinhas (mesmas mesas)     │  │
│  │ Preparar juntas? [Sim] [Não]     │  │
│  └──────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco no gargalo, não em tudo
- Agrupamento inteligente reduz trabalho
- IA aparece quando há causa clara (falta item)
- Destaque automático de risco

**Fluxo:**
- KDS → Item → Marcar pronto
- KDS → Item atrasado → Ver causa → Resolver
- KDS → Sugestão IA → Aplicar

**Regras:**
- Itens atrasados aparecem primeiro
- Agrupamento é sugestão, não obrigação
- IA só sugere quando há causa identificável

---

### 5. ESTOQUE REAL

**Pergunta:** "O que vai acabar e quando?"

**Perfis:** Dono, Gerente

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Estoque Real                            │
├─────────────────────────────────────────┤
│                                          │
│  🔴 CRÍTICO (1)                         │
│  ┌──────────────────────────────────┐  │
│  │ Tomate: 0kg / 10kg mínimo        │  │
│  │ Ruptura: AGORA                   │  │
│  │ Consumo: 2kg/hora                │  │
│  │ [Comprar agora]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🟡 ATENÇÃO (3)                         │
│  ┌──────────────────────────────────┐  │
│  │ Limão: 2kg / 5kg mínimo          │  │
│  │ Ruptura prevista: 2h             │  │
│  │ Consumo: 1kg/hora                │  │
│  │ [Adicionar à lista]              │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 CONSUMO REAL (últimas 24h)          │
│  ┌──────────────────────────────────┐  │
│  │ Tomate: 48kg consumidos          │  │
│  │   Média: 2kg/hora                 │  │
│  │   Pico: 4kg/hora (20h)           │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📈 PREVISÃO DE RUPTURA                 │
│  ┌──────────────────────────────────┐  │
│  │ Próximas 24h:                    │  │
│  │   Limão: 2h                      │  │
│  │   Cebola: 8h                     │  │
│  │   Alho: 12h                      │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📋 HISTÓRICO DE FALHAS                 │
│  ┌──────────────────────────────────┐  │
│  │ Tomate: 3x esta semana            │  │
│  │   Última: Hoje 14:30              │  │
│  │   Causa: Consumo acima do previsto│  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Compras] [Fornecedores] [Histórico]   │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco no que vai acabar, não em tudo
- Previsão baseada em consumo real
- Histórico ajuda a identificar padrões
- Acesso direto a compras

**Fluxo:**
- Estoque → Item crítico → Compras
- Estoque → Previsão → Planejar compra
- Estoque → Histórico → Identificar padrão

**Regras:**
- Estoque zero é bloqueado (não permite pedidos)
- Previsão usa consumo real, não estimativa
- Histórico não é apagável

---

### 6. COMPRAS & FORNECEDORES

**Pergunta:** "O que preciso comprar agora?"

**Perfis:** Dono, Gerente (quando crítico)

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Compras & Fornecedores                  │
├─────────────────────────────────────────┤
│                                          │
│  📋 LISTA AUTOMÁTICA DE COMPRAS          │
│  ┌──────────────────────────────────┐  │
│  │ 🔴 Tomate: 20kg                  │  │
│  │    Motivo: Estoque crítico       │  │
│  │    Fornecedor: Hortifruti X      │  │
│  │    Lead time: 2 dias              │  │
│  │    [Criar pedido]                │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 🟡 Limão: 10kg                   │  │
│  │    Motivo: Previsão de ruptura   │  │
│  │    Fornecedor: Hortifruti X      │  │
│  │    Lead time: 2 dias              │  │
│  │    [Criar pedido]                │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🏢 FORNECEDORES                         │
│  ┌──────────────────────────────────┐  │
│  │ Hortifruti X                     │  │
│  │   Categoria: Hortifruti          │  │
│  │   Lead time médio: 2 dias         │  │
│  │   Última compra: 3 dias atrás    │  │
│  │   Status: Ativo                   │  │
│  │   [Ver histórico] [Criar pedido] │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⏱️  SLA DE REPOSIÇÃO                    │
│  ┌──────────────────────────────────┐  │
│  │ Tomate: 2 dias                  │  │
│  │   Pedido hoje → Entrega: 28/01   │  │
│  │   Ruptura prevista: 26/01 16h    │  │
│  │   ⚠️  Risco de atraso             │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 HISTÓRICO DE ATRASOS                 │
│  ┌──────────────────────────────────┐  │
│  │ Hortifruti X:                    │  │
│  │   3 atrasos nos últimos 30 dias   │  │
│  │   Média de atraso: 6h             │  │
│  │   [Ver detalhes]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🎯 SIMULAÇÃO DE IMPACTO                 │
│  ┌──────────────────────────────────┐  │
│  │ Se comprar hoje:                 │  │
│  │   Entrega: 28/01                 │  │
│  │   Ruptura: 26/01 16h             │  │
│  │   Impacto: 2 dias sem tomate     │  │
│  │   [Simular cenário alternativo]   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Criar Pedido] [Fornecedores] [Histórico]│
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Lista automática baseada em estoque + previsão
- SLA de reposição mostra risco real
- Simulação ajuda a decidir
- Histórico de atrasos informa escolha

**Fluxo:**
- Compras → Item → Criar pedido
- Compras → Fornecedor → Ver histórico
- Compras → Simulação → Decidir

**Regras:**
- Lista automática não pode ser editada (é verdade)
- Pedidos respeitam lead time do fornecedor
- Simulação não altera dados reais

---

### 7. HORÁRIOS & TURNOS

**Pergunta:** "Tem gente suficiente no momento certo?"

**Perfis:** Gerente, Dono

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Horários & Turnos                       │
├─────────────────────────────────────────┤
│                                          │
│  📅 ESCALA PLANEJADA vs REAL            │
│  ┌──────────────────────────────────┐  │
│  │ Hoje - 20h                       │  │
│  │   Planejado: 3 garçons           │  │
│  │   Real: 2 garçons (1 ausente)    │  │
│  │   Status: ⚠️  SUBSTAFFED          │  │
│  │   [Ver cobertura]                │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ✅ CHECK-IN / CHECK-OUT                 │
│  ┌──────────────────────────────────┐  │
│  │ João - Garçom                    │  │
│  │   Turno: 18h - 02h               │  │
│  │   Check-in: 18:05 (5min atraso) │  │
│  │   Status: Em turno               │  │
│  │   [Check-out]                    │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 SOBRECARGA POR PESSOA                │
│  ┌──────────────────────────────────┐  │
│  │ Maria - Cozinha                  │  │
│  │   Turnos esta semana: 6           │  │
│  │   Horas: 48h / 40h máximo        │  │
│  │   Status: ⚠️  SOBRECARGA           │  │
│  │   [Ver detalhes]                 │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📈 CORRELAÇÃO COM ATRASOS               │
│  ┌──────────────────────────────────┐  │
│  │ Turno 20h - Segunda               │  │
│  │   2 pessoas (substaffed)         │  │
│  │   5 SLAs violados                │  │
│  │   Correlação: 80%                 │  │
│  │   [Ver análise]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⚠️  ALERTAS DE RISCO FUTURO             │
│  ┌──────────────────────────────────┐  │
│  │ Amanhã - 20h                      │  │
│  │   Previsão: 12 reservas           │  │
│  │   Staff planejado: 2 pessoas      │  │
│  │   Risco: ALTO                     │  │
│  │   [Adicionar pessoa]             │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Criar Turno] [Cobertura] [Relatório]  │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Comparação planejado vs real mostra problema
- Check-in/out rastreável
- Sobrecarga detectada automaticamente
- Correlação com atrasos prova causa

**Fluxo:**
- Turnos → Cobertura → Adicionar pessoa
- Turnos → Sobrecarga → Ver detalhes
- Turnos → Alerta futuro → Planejar

**Regras:**
- Check-in/out não pode ser falsificado
- Sobrecarga é calculada automaticamente
- Correlação usa dados reais, não estimativa

---

### 8. RESERVAS

**Pergunta:** "O que está vindo pela frente?"

**Perfis:** Gerente, Dono

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Reservas                                 │
├─────────────────────────────────────────┤
│                                          │
│  📅 RESERVAS POR HORÁRIO                 │
│  ┌──────────────────────────────────┐  │
│  │ Hoje - 20h                       │  │
│  │   12 reservas confirmadas        │  │
│  │   48 pessoas                      │  │
│  │   Capacidade: 60 pessoas          │  │
│  │   Status: 🟢 OK                  │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Hoje - 21h                       │  │
│  │   18 reservas confirmadas        │  │
│  │   72 pessoas                      │  │
│  │   Capacidade: 60 pessoas          │  │
│  │   Status: 🔴 LOTADO                │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🪑 TAMANHO DAS MESAS                    │
│  ┌──────────────────────────────────┐  │
│  │ Mesa 5: 4 pessoas                │  │
│  │ Mesa 12: 2 pessoas               │  │
│  │ Mesa 8: 6 pessoas                │  │
│  │   Total: 12 pessoas               │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 IMPACTO PREVISTO NA OPERAÇÃO        │
│  ┌──────────────────────────────────┐  │
│  │ 20h - 12 reservas                │  │
│  │   Previsão de pedidos: 24        │  │
│  │   Staff necessário: 3 pessoas    │  │
│  │   Staff planejado: 2 pessoas      │  │
│  │   Risco: MÉDIO                    │  │
│  │   [Ajustar staff]                │  │
│  └──────────────────────────────────┘  │
│                                          │
│  💡 SUGESTÃO AUTOMÁTICA                  │
│  ┌──────────────────────────────────┐  │
│  │ 21h - 18 reservas                │  │
│  │   Capacidade: 60 pessoas          │  │
│  │   Reservas: 72 pessoas            │  │
│  │   Sugestão: RECUSAR próximas      │  │
│  │   [Aplicar] [Ver detalhes]       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📈 CORRELAÇÃO COM ESTOQUE E STAFF       │
│  ┌──────────────────────────────────┐  │
│  │ 20h - 12 reservas                │  │
│  │   Estoque: OK                    │  │
│  │   Staff: SUBSTAFFED              │  │
│  │   Ação: Adicionar 1 pessoa        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Nova Reserva] [Mapa] [Previsão]      │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco no que está vindo, não no passado
- Impacto previsto ajuda a planejar
- Sugestão automática baseada em capacidade
- Correlação com estoque e staff

**Fluxo:**
- Reservas → Horário → Ver detalhes
- Reservas → Sugestão → Aplicar
- Reservas → Impacto → Ajustar staff

**Regras:**
- Reservas não podem exceder capacidade
- Sugestão é baseada em dados reais
- Impacto previsto usa histórico

---

### 9. TASKS & RESPONSABILIDADE

**Pergunta:** "O que está pendente e por quê?"

**Perfis:** Funcionário, Gerente, Dono

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Tasks & Responsabilidade                 │
├─────────────────────────────────────────┤
│                                          │
│  📋 TASKS ABERTAS (5)                    │
│  ┌──────────────────────────────────┐  │
│  │ Limpar cozinha                  │  │
│  │   Tipo: LIMPEZA                 │  │
│  │   Responsável: João              │  │
│  │   SLA: 2h restantes             │  │
│  │   Status: Pendente              │  │
│  │   [Iniciar]                     │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Verificar estoque               │  │
│  │   Tipo: ESTOQUE                 │  │
│  │   Responsável: Maria             │  │
│  │   SLA: 30min restantes          │  │
│  │   Status: Em andamento          │  │
│  │   [Concluir]                    │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⏱️  SLAs                                │
│  ┌──────────────────────────────────┐  │
│  │ Tasks com SLA violado: 2          │  │
│  │   Limpar cozinha: 1h atrasado    │  │
│  │   Verificar estoque: 15min atrasado│ │
│  │   [Ver todas]                    │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🔍 CAUSA DA TASK                        │
│  ┌──────────────────────────────────┐  │
│  │ Limpar cozinha                   │  │
│  │   Causa: Pedido #123 finalizado  │  │
│  │   Criada: 14:30                  │  │
│  │   Por: Sistema automático        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  👤 RESPONSÁVEL                          │
│  ┌──────────────────────────────────┐  │
│  │ João - Garçom                    │  │
│  │   Tasks abertas: 3               │  │
│  │   Tasks concluídas hoje: 12      │  │
│  │   SLA violado: 1                 │  │
│  │   [Ver perfil]                   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 HISTÓRICO (não apagável)            │
│  ┌──────────────────────────────────┐  │
│  │ Limpar cozinha                    │  │
│  │   Criada: 14:30                   │  │
│  │   Iniciada: 14:35                 │  │
│  │   Concluída: 15:00                │  │
│  │   SLA: Dentro do prazo            │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Filtro: Minhas | Todas | Atrasadas]   │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco no que está pendente, não no que já foi feito
- Causa da task explica o porquê
- Responsável é rastreável
- Histórico não é apagável (auditoria)

**Fluxo:**
- Tasks → Task → Iniciar/Concluir
- Tasks → SLA violado → Ver causa
- Tasks → Responsável → Ver perfil

**Regras:**
- Tasks não podem ser deletadas
- Histórico é imutável
- SLA é calculado automaticamente

---

### 10. MENTORIA IA — FUNCIONÁRIO

**Pergunta:** "Como posso melhorar?"

**Perfis:** Funcionário

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Mentoria IA - Funcionário               │
├─────────────────────────────────────────┤
│                                          │
│  💡 FEEDBACK CONTEXTUAL                  │
│  ┌──────────────────────────────────┐  │
│  │ "Você está melhorando!"           │  │
│  │   Seus últimos 3 turnos tiveram   │  │
│  │   zero atrasos. Continue assim.  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📈 EVOLUÇÃO PESSOAL                     │
│  ┌──────────────────────────────────┐  │
│  │ Esta semana:                    │  │
│  │   ✅ 0 atrasos                  │  │
│  │   ✅ 12 tasks concluídas        │  │
│  │   ⚠️  1 SLA violado             │  │
│  │   Tendência: Melhorando         │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🔄 ERROS RECORRENTES                    │
│  ┌──────────────────────────────────┐  │
│  │ "Você costuma esquecer de        │  │
│  │  verificar o estoque antes de    │  │
│  │  enviar pedidos. Dica: crie uma  │  │
│  │  rotina de verificação rápida."   │  │
│  │   [Ver treino]                   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  💪 SUGESTÕES PRÁTICAS                   │
│  ┌──────────────────────────────────┐  │
│  │ "Quando o KDS está cheio,        │  │
│  │  priorize itens mais rápidos     │  │
│  │  primeiro. Isso reduz atrasos." │  │
│  │   [Aplicar agora]                │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🎓 TOM RESPEITOSO E EDUCATIVO           │
│  ┌──────────────────────────────────┐  │
│  │ "Não é culpa sua, mas podemos    │  │
│  │  melhorar juntos. Que tal        │  │
│  │  tentar esta técnica?"            │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Treino Rápido] [Feedback do Turno]    │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco em melhoria, não em punição
- Evolução pessoal mostra progresso
- Erros recorrentes são educativos
- Tom respeitoso e educativo

**Fluxo:**
- Mentoria → Feedback → Aplicar
- Mentoria → Erro recorrente → Treino
- Mentoria → Evolução → Ver histórico

**Regras:**
- IA nunca culpa, apenas ensina
- Feedback é contextual, não genérico
- Evolução é baseada em dados reais

---

### 11. MENTORIA IA — GERENTE

**Pergunta:** "Onde estou errando como líder?"

**Perfis:** Gerente

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Mentoria IA - Gerente                   │
├─────────────────────────────────────────┤
│                                          │
│  📊 DECISÕES PASSADAS                    │
│  ┌──────────────────────────────────┐  │
│  │ Segunda - 20h                    │  │
│  │   Decisão: Não adicionar staff    │  │
│  │   Resultado: 5 SLAs violados      │  │
│  │   Impacto: Alto                   │  │
│  │   [Ver análise]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📈 IMPACTO REAL                         │
│  ┌──────────────────────────────────┐  │
│  │ Esta semana:                     │  │
│  │   Decisões: 12                   │  │
│  │   Impacto positivo: 8             │  │
│  │   Impacto negativo: 4            │  │
│  │   Tendência: Melhorando          │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🔍 PADRÕES NEGATIVOS                    │
│  ┌──────────────────────────────────┐  │
│  │ "Você costuma subestimar a       │  │
│  │  demanda em turnos de segunda.   │  │
│  │  Considere adicionar 1 pessoa    │  │
│  │  extra nesses dias."              │  │
│  │   [Aplicar sugestão]             │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🏗️  SUGESTÕES ESTRUTURAIS               │
│  ┌──────────────────────────────────┐  │
│  │ "Sua equipe está sobrecarregada   │  │
│  │  nas segundas. Considere criar    │  │
│  │  uma escala fixa para esse dia."  │  │
│  │   [Ver escala]                   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⚠️  ALERTAS DE RISCO HUMANO             │
│  ┌──────────────────────────────────┐  │
│  │ "João está com 48h esta semana.  │  │
│  │  Risco de erro por cansaço:      │  │
│  │  ALTO. Considere reduzir carga." │  │
│  │   [Ver escala]                   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Análise Completa] [Padrões] [Ações]   │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco em decisões, não em operação
- Impacto real mostra consequências
- Padrões negativos são estruturais
- Alertas de risco humano são preventivos

**Fluxo:**
- Mentoria → Decisão → Ver análise
- Mentoria → Padrão → Aplicar sugestão
- Mentoria → Alerta → Ver escala

**Regras:**
- IA não julga, apenas informa
- Decisões passadas são imutáveis
- Alertas são preventivos, não punitivos

---

### 12. MENTORIA IA — DONO

**Pergunta:** "Onde mexer para melhorar o negócio?"

**Perfis:** Dono

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Mentoria IA - Dono                      │
├─────────────────────────────────────────┤
│                                          │
│  🔍 CAUSAS RAIZ                          │
│  ┌──────────────────────────────────┐  │
│  │ "Seus SLAs violados aumentaram   │  │
│  │  30% esta semana. Causa raiz:     │  │
│  │  substaffing em turnos de pico.  │  │
│  │  Solução: Ajustar escala."       │  │
│  │   [Ver análise]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🎯 DECISÕES ESTRATÉGICAS                │
│  ┌──────────────────────────────────┐  │
│  │ "Seu estoque está com 3 rupturas │  │
│  │  por semana. Considere aumentar  │  │
│  │  estoque mínimo em 20% ou trocar  │  │
│  │  fornecedor."                     │  │
│  │   [Ver estoque] [Ver fornecedores]│ │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 PREVISÃO DE IMPACTO                  │
│  ┌──────────────────────────────────┐  │
│  │ Se ajustar escala:                │  │
│  │   Redução de SLAs: 40%            │  │
│  │   Custo adicional: R$ 500/semana  │  │
│  │   ROI: Positivo (menos reclamações)│ │
│  │   [Simular]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🔕 ALERTAS SILENCIOSOS                  │
│  ┌──────────────────────────────────┐  │
│  │ "Seu fornecedor X está com 3      │  │
│  │  atrasos seguidos. Considere      │  │
│  │  buscar alternativas."            │  │
│  │   [Ver fornecedores]              │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ✅ RECOMENDAÇÕES CLARAS                 │
│  ┌──────────────────────────────────┐  │
│  │ 1. Ajustar escala (prioridade alta)│ │
│  │ 2. Trocar fornecedor (média)      │  │
│  │ 3. Aumentar estoque mínimo (baixa)│ │
│  │   [Ver todas]                     │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Análise Completa] [Simular] [Ações]   │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Foco em causas raiz, não sintomas
- Decisões estratégicas são claras
- Previsão de impacto ajuda a decidir
- Alertas silenciosos são informativos

**Fluxo:**
- Mentoria → Causa raiz → Ver análise
- Mentoria → Decisão estratégica → Simular
- Mentoria → Recomendação → Aplicar

**Regras:**
- IA não decide, apenas recomenda
- Previsão usa dados reais
- Alertas são informativos, não urgentes

---

### 13. ANÁLISE & PADRÕES INVISÍVEIS

**Pergunta:** "O que sempre dá errado?"

**Perfis:** Gerente, Dono

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Análise & Padrões Invisíveis            │
├─────────────────────────────────────────┤
│                                          │
│  🔍 PADRÕES DETECTADOS                   │
│  ┌──────────────────────────────────┐  │
│  │ Padrão: SLAs violados em segundas │  │
│  │   Frequência: 80% das segundas    │  │
│  │   Causa: Substaffing               │  │
│  │   Impacto: Alto                    │  │
│  │   [Ver detalhes] [Aplicar fix]    │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🚧 GARGALOS RECORRENTES                 │
│  ┌──────────────────────────────────┐  │
│  │ Gargalo: KDS BAR                  │  │
│  │   Frequência: 3x por semana       │  │
│  │   Horário: 20h - 22h              │  │
│  │   Causa: Falta de limão           │  │
│  │   Solução: Aumentar estoque mínimo│  │
│  │   [Aplicar]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📅 TURNOS PROBLEMÁTICOS                 │
│  ┌──────────────────────────────────┐  │
│  │ Turno: Segunda 20h                │  │
│  │   SLAs violados: 5                │  │
│  │   Staff: 2 pessoas (substaffed)  │  │
│  │   Correlação: 90%                 │  │
│  │   [Ajustar escala]                │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🍽️  ITENS CAUSADORES                    │
│  ┌──────────────────────────────────┐  │
│  │ Item: Caipirinha                  │  │
│  │   Atrasos: 12 esta semana          │  │
│  │   Causa: Falta de limão           │  │
│  │   Solução: Aumentar estoque mínimo│  │
│  │   [Aplicar]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ✅ AÇÕES SUGERIDAS                      │
│  ┌──────────────────────────────────┐  │
│  │ 1. Ajustar escala segunda 20h     │  │
│  │ 2. Aumentar estoque mínimo limão   │  │
│  │ 3. Trocar fornecedor limão         │  │
│  │   [Aplicar todas]                  │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Filtro: Semana | Mês | Semestre]      │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Padrões invisíveis são detectados automaticamente
- Gargalos recorrentes têm solução clara
- Turnos problemáticos são identificados
- Ações sugeridas são acionáveis

**Fluxo:**
- Análise → Padrão → Ver detalhes → Aplicar fix
- Análise → Gargalo → Aplicar solução
- Análise → Ações sugeridas → Aplicar todas

**Regras:**
- Padrões são detectados automaticamente
- Soluções são baseadas em dados reais
- Ações são acionáveis, não apenas informativas

---

### 14. SIMULAÇÃO DE FUTURO (TIME WARP UI)

**Pergunta:** "E se...?"

**Perfis:** Dono, Gerente

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Simulação de Futuro                     │
├─────────────────────────────────────────┤
│                                          │
│  🎯 CENÁRIO BASE                         │
│  ┌──────────────────────────────────┐  │
│  │ Período: Próxima semana           │  │
│  │   Staff: 3 pessoas/turno          │  │
│  │   Estoque: Atual                  │  │
│  │   Reservas: Confirmadas           │  │
│  │   [Simular]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⚙️  AJUSTES                             │
│  ┌──────────────────────────────────┐  │
│  │ Staff: [3] pessoas/turno         │  │
│  │   [Aumentar] [Diminuir]           │  │
│  │                                    │  │
│  │ Estoque mínimo: [Atual]           │  │
│  │   [Aumentar 20%] [Diminuir 20%]   │  │
│  │                                    │  │
│  │ Reservas: [Confirmadas]            │  │
│  │   [Adicionar] [Remover]           │  │
│  └──────────────────────────────────┘  │
│                                          │
│  📊 IMPACTO PREVISTO                     │
│  ┌──────────────────────────────────┐  │
│  │ Se aumentar staff para 4:          │  │
│  │   SLAs violados: -40%             │  │
│  │   Custo adicional: R$ 500/semana  │  │
│  │   ROI: Positivo                    │  │
│  │   [Ver detalhes]                   │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🔄 COMPARAR CENÁRIOS                    │
│  ┌──────────────────────────────────┐  │
│  │ Cenário A: Staff 3                │  │
│  │   SLAs: 10 violados               │  │
│  │                                    │  │
│  │ Cenário B: Staff 4                │  │
│  │   SLAs: 6 violados                │  │
│  │   Diferença: -40%                 │  │
│  │   [Aplicar Cenário B]             │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⚠️  ALERTAS DE RISCO                    │
│  ┌──────────────────────────────────┐  │
│  │ "Se não aumentar staff,          │  │
│  │  previsão: 15 SLAs violados."    │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Simular] [Comparar] [Aplicar]          │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Simulação permite testar antes de decidir
- Ajustes são fáceis de fazer
- Impacto previsto ajuda a decidir
- Comparação de cenários é clara

**Fluxo:**
- Simulação → Ajustar → Simular
- Simulação → Comparar → Aplicar
- Simulação → Alerta → Ajustar

**Regras:**
- Simulação não altera dados reais
- Impacto previsto usa histórico
- Aplicar cenário altera dados reais

---

### 15. PERFIL DO RESTAURANTE (ALMA DO LUGAR)

**Pergunta:** "Quem somos?"

**Perfis:** Dono

**Componentes:**

```
┌─────────────────────────────────────────┐
│ Perfil do Restaurante                   │
├─────────────────────────────────────────┤
│                                          │
│  🎵 RITMO DO RESTAURANTE                 │
│  ┌──────────────────────────────────┐  │
│  │ Ritmo: Rápido                     │  │
│  │   Pico: 20h - 22h                │  │
│  │   Calmaria: 14h - 17h            │  │
│  │   [Ajustar]                      │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🏷️  IDENTIDADE OPERACIONAL               │
│  ┌──────────────────────────────────┐  │
│  │ Tipo: Casual                      │  │
│  │   Foco: Rapidez                   │  │
│  │   Prioridade: Atendimento         │  │
│  │   [Editar]                        │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ⚙️  PREFERÊNCIAS                        │
│  ┌──────────────────────────────────┐  │
│  │ Estoque mínimo: Alto              │  │
│  │   Motivo: Evitar rupturas         │  │
│  │                                    │  │
│  │ Staff: Adequado                   │  │
│  │   Motivo: Priorizar qualidade     │  │
│  │   [Ajustar]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🚫 LIMITES ACEITÁVEIS                    │
│  ┌──────────────────────────────────┐  │
│  │ SLAs violados: Máx 5/semana       │  │
│  │   Atual: 3/semana                 │  │
│  │   Status: OK                      │  │
│  │                                    │  │
│  │ Rupturas: Máx 1/semana            │  │
│  │   Atual: 0/semana                 │  │
│  │   Status: OK                      │  │
│  │   [Ajustar]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  🎓 AJUSTES DE MENTORIA                  │
│  ┌──────────────────────────────────┐  │
│  │ Tom: Educativo                    │  │
│  │   Frequência: Quando necessário   │  │
│  │   Foco: Melhoria contínua         │  │
│  │   [Ajustar]                       │  │
│  └──────────────────────────────────┘  │
│                                          │
│  [Salvar] [Resetar]                      │
│                                          │
└─────────────────────────────────────────┘
```

**Justificativa:**
- Perfil define identidade do restaurante
- Ritmo ajuda a entender operação
- Preferências personalizam sistema
- Limites aceitáveis definem tolerância

**Fluxo:**
- Perfil → Ritmo → Ajustar
- Perfil → Preferências → Ajustar
- Perfil → Limites → Ajustar

**Regras:**
- Perfil não pode violar regras do Core
- Limites são informativos, não bloqueios
- Ajustes de mentoria personalizam IA

---

## 🔄 FLUXO ENTRE TELAS

### Fluxo Principal (Gerente/Dono)

```
Dashboard
  ├─> Alerta → Tela específica (Estoque, KDS, etc.)
  ├─> Decisão IA → Aplicar ou Ver detalhes
  └─> Acesso rápido → Operação, Estoque, Compras

Central
  ├─> Evento → Detalhes
  ├─> SLA → KDS/Operação
  └─> Run ID → Explorer detalhado

Operação
  ├─> Pedido → Detalhes
  ├─> KDS → Estação específica
  └─> Atraso → Resolver

KDS
  ├─> Item → Marcar pronto
  ├─> Item atrasado → Ver causa → Resolver
  └─> Sugestão IA → Aplicar

Estoque
  ├─> Item crítico → Compras
  ├─> Previsão → Planejar compra
  └─> Histórico → Identificar padrão

Compras
  ├─> Item → Criar pedido
  ├─> Fornecedor → Ver histórico
  └─> Simulação → Decidir

Turnos
  ├─> Cobertura → Adicionar pessoa
  ├─> Sobrecarga → Ver detalhes
  └─> Alerta futuro → Planejar

Reservas
  ├─> Horário → Ver detalhes
  ├─> Sugestão → Aplicar
  └─> Impacto → Ajustar staff

Tasks
  ├─> Task → Iniciar/Concluir
  ├─> SLA violado → Ver causa
  └─> Responsável → Ver perfil

Mentoria (Funcionário)
  ├─> Feedback → Aplicar
  ├─> Erro recorrente → Treino
  └─> Evolução → Ver histórico

Mentoria (Gerente)
  ├─> Decisão → Ver análise
  ├─> Padrão → Aplicar sugestão
  └─> Alerta → Ver escala

Mentoria (Dono)
  ├─> Causa raiz → Ver análise
  ├─> Decisão estratégica → Simular
  └─> Recomendação → Aplicar

Análise
  ├─> Padrão → Ver detalhes → Aplicar fix
  ├─> Gargalo → Aplicar solução
  └─> Ações sugeridas → Aplicar todas

Simulação
  ├─> Ajustar → Simular
  ├─> Comparar → Aplicar
  └─> Alerta → Ajustar

Perfil
  ├─> Ritmo → Ajustar
  ├─> Preferências → Ajustar
  └─> Limites → Ajustar
```

---

## 👥 O QUE APARECE PARA CADA PERFIL

### Funcionário
- ✅ Operação ao Vivo
- ✅ KDS Inteligente
- ✅ Tasks & Responsabilidade
- ✅ Mentoria IA — Funcionário
- ❌ Dashboard Principal
- ❌ Central de Comando
- ❌ Estoque Real
- ❌ Compras & Fornecedores
- ❌ Horários & Turnos (apenas check-in/out)
- ❌ Reservas
- ❌ Mentoria IA — Gerente/Dono
- ❌ Análise & Padrões
- ❌ Simulação de Futuro
- ❌ Perfil do Restaurante

### Gerente
- ✅ Dashboard Principal
- ✅ Central de Comando
- ✅ Operação ao Vivo (supervisão)
- ✅ KDS Inteligente (supervisão)
- ✅ Estoque Real
- ✅ Compras & Fornecedores (quando crítico)
- ✅ Horários & Turnos
- ✅ Reservas
- ✅ Tasks & Responsabilidade
- ✅ Mentoria IA — Gerente
- ✅ Análise & Padrões
- ✅ Simulação de Futuro
- ❌ Mentoria IA — Funcionário/Dono
- ❌ Perfil do Restaurante

### Dono
- ✅ Dashboard Principal
- ✅ Central de Comando
- ✅ Estoque Real
- ✅ Compras & Fornecedores
- ✅ Horários & Turnos
- ✅ Reservas
- ✅ Tasks & Responsabilidade
- ✅ Mentoria IA — Dono
- ✅ Análise & Padrões
- ✅ Simulação de Futuro
- ✅ Perfil do Restaurante
- ❌ Operação ao Vivo (apenas visão geral)
- ❌ KDS Inteligente (apenas visão geral)
- ❌ Mentoria IA — Funcionário/Gerente

---

## 🤖 ONDE A IA APARECE E ONDE ELA NÃO APARECE

### Onde a IA Aparece

1. **Dashboard Principal**
   - Quando há decisão clara a tomar
   - Exemplo: "Adicionar 1 pessoa no turno das 20h"

2. **KDS Inteligente**
   - Quando há causa identificável de atraso
   - Exemplo: "Caipirinha atrasada: falta limão"

3. **Mentoria IA — Funcionário**
   - Sempre (é a tela de mentoria)
   - Feedback contextual, evolução, erros recorrentes

4. **Mentoria IA — Gerente**
   - Sempre (é a tela de mentoria)
   - Decisões passadas, impacto real, padrões negativos

5. **Mentoria IA — Dono**
   - Sempre (é a tela de mentoria)
   - Causas raiz, decisões estratégicas, recomendações

6. **Reservas**
   - Quando há sugestão automática baseada em capacidade
   - Exemplo: "RECUSAR próximas reservas (lotado)"

7. **Análise & Padrões**
   - Quando há padrões detectados
   - Exemplo: "SLAs violados em segundas: 80%"

### Onde a IA NÃO Aparece

1. **Central de Comando**
   - Apenas dados brutos, sem interpretação
   - Eventos, SLAs, timeline

2. **Operação ao Vivo**
   - Apenas dados em tempo real
   - Pedidos, KDS, backlog, atrasos

3. **Estoque Real**
   - Apenas dados reais, sem interpretação
   - Estoque, consumo, previsão, histórico

4. **Compras & Fornecedores**
   - Apenas dados, sem interpretação
   - Lista, fornecedores, SLA, histórico

5. **Horários & Turnos**
   - Apenas dados, sem interpretação
   - Escala, check-in/out, sobrecarga, correlação

6. **Tasks & Responsabilidade**
   - Apenas dados, sem interpretação
   - Tasks, SLAs, causa, responsável, histórico

7. **Simulação de Futuro**
   - Apenas simulação, sem interpretação
   - Cenário, ajustes, impacto, comparação

8. **Perfil do Restaurante**
   - Apenas configuração, sem interpretação
   - Ritmo, identidade, preferências, limites

---

## ✅ JUSTIFICATIVA DE CADA TELA

### Por que cada tela existe:

1. **Dashboard Principal** - Responde "está tudo bem?" imediatamente
2. **Central de Comando** - Visão sistêmica, não operacional
3. **Operação ao Vivo** - O que está acontecendo AGORA
4. **KDS Inteligente** - Onde está o gargalo
5. **Estoque Real** - O que vai acabar e quando
6. **Compras & Fornecedores** - O que preciso comprar agora
7. **Horários & Turnos** - Tem gente suficiente no momento certo
8. **Reservas** - O que está vindo pela frente
9. **Tasks & Responsabilidade** - O que está pendente e por quê
10. **Mentoria IA — Funcionário** - Como posso melhorar
11. **Mentoria IA — Gerente** - Onde estou errando como líder
12. **Mentoria IA — Dono** - Onde mexer para melhorar o negócio
13. **Análise & Padrões** - O que sempre dá errado
14. **Simulação de Futuro** - E se...?
15. **Perfil do Restaurante** - Quem somos

---

**Última atualização:** 2026-01-27
