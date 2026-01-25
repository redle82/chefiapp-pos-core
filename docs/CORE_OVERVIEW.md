# Core Overview — Mapa Mental do Sistema

> **Este documento responde: "O que é intocável? O que é extensível? O que é descartável?"**  
> **Última atualização:** 2026-01-24  
> **Status:** RATIFICADO

---

## 🎯 Propósito

Este documento é um **mapa mental explícito** do ChefIApp Core. Ele não explica "como fazer", mas sim **"por que existe"** e **"o que nunca pode mudar"**.

**Público-alvo:**
- Desenvolvedores que vão tocar no Core
- Investidores que precisam entender a arquitetura
- Auditores que precisam validar integridade
- Advogados que precisam defender o sistema

---

## 🏛️ O Núcleo Sagrado (IMMUTABLE)

### Definição

O **Núcleo Sagrado** é o conjunto de componentes que **NUNCA** podem ser alterados sem invalidar todo o sistema. Se você mudar isso, o sistema deixa de ser o ChefIApp.

### Componentes Sagrados

#### 1. **Sistema de Eventos (Event-Driven Architecture)**

**O que é:**
- Todos os fatos operacionais são eventos imutáveis
- Eventos são a única linguagem de comunicação entre componentes
- Eventos são auditáveis, reproduzíveis e ordenados

**Por que é sagrado:**
- Sem eventos, não há auditoria
- Sem auditoria, não há confiança
- Sem confiança, não há produto

**Onde vive:**
- `gm_events` (tabela)
- `docker-tests/task-engine/` (geração e processamento)
- `docker-tests/simulators/simulate-24h.js` (validação)

**Violação = Sistema inválido**

---

#### 2. **Governança por SLA (Task Engine)**

**O que é:**
- Toda tarefa tem deadline
- Deadline expirado = escalonamento automático
- Escalonamento ignora hierarquia social
- Hard-blocking impede operações até resolução

**Por que é sagrado:**
- Sem SLA, tarefas são "sugestões"
- Sem escalonamento, problemas ficam invisíveis
- Sem hard-blocking, compliance é opcional

**Onde vive:**
- `docker-tests/task-engine/policies/*.json` (definições)
- `docker-tests/task-engine/escalation-engine.js` (execução)
- `gm_tasks`, `gm_task_escalations`, `gm_shift_blocks` (persistência)

**Violação = Governança quebrada**

---

#### 3. **Offline-First por Design**

**O que é:**
- Offline não é erro, é estado válido
- Ações são enfileiradas localmente
- Idempotency keys previnem duplicação
- Reconciliação é automática

**Por que é sagrado:**
- Restaurantes operam em ambientes com rede instável
- Sem offline-first, o sistema quebra na primeira queda de rede
- Sem idempotência, há duplicação de pedidos/pagamentos

**Onde vive:**
- `docker-tests/simulators/simulate-24h.js` (simulação de offline)
- `gm_offline_actions` (auditoria de ações offline)
- Lógica de retry e reconciliação (a ser consolidada)

**Violação = Sistema não confiável**

---

#### 4. **Fonte Única de Verdade (Single Source of Truth)**

**O que é:**
- Cada domínio tem **uma** e apenas **uma** fonte de verdade
- Duplicação de lógica é proibida
- Consolidação é obrigatória

**Tabelas Sagradas:**
| Domínio | Fonte de Verdade | Violação |
|---------|------------------|----------|
| Pedidos | `gm_orders` | Criar outra tabela de pedidos |
| Tarefas | `gm_tasks` | Lógica de tarefas fora do task-engine |
| Eventos | `gm_events` | Eventos em múltiplos lugares |
| Governança | `task-engine/policies/*.json` | SLA fora do task-engine |
| Perfis | `seeds/profiles/*.json` | Perfis hardcoded no código |

**Por que é sagrado:**
- Duplicação = inconsistência
- Inconsistência = bugs
- Bugs = perda de confiança

**Violação = Integridade quebrada**

---

#### 5. **Validação por Simulação**

**O que é:**
- A única prova de funcionamento é o simulador
- Se `make simulate-24h-small` passa, está correto
- Se falha, está errado
- Não há exceções

**Por que é sagrado:**
- Sem simulação, não há validação objetiva
- Sem validação objetiva, não há confiança
- Sem confiança, não há produto

**Onde vive:**
- `docker-tests/simulators/simulate-24h.js` (simulação completa)
- `docker-tests/simulators/simulate-failfast.js` (validação rápida)
- `docker-tests/Makefile` (orquestração)

**Violação = Sistema não validado**

---

## 🔧 O Que É Extensível (EVOLUTIVE)

### Definição

Componentes que **podem** ser modificados, estendidos ou substituídos, desde que respeitem os contratos do Núcleo Sagrado.

### Componentes Extensíveis

#### 1. **Perfis de Restaurante**

**O que é:**
- Configurações JSON que definem características de restaurantes
- Exemplos: `ambulante`, `pequeno`, `medio`, `grande`, `gigante`

**Pode ser:**
- ✅ Adicionar novos perfis
- ✅ Modificar características existentes
- ✅ Adicionar novos campos

**Não pode:**
- ❌ Remover campos obrigatórios
- ❌ Quebrar contratos do task-engine
- ❌ Violar integridade de dados

**Onde vive:**
- `docker-tests/seeds/profiles/*.json`

---

#### 2. **Policy Packs (Pacotes de Compliance)**

**O que é:**
- Definições JSON de tarefas operacionais
- Exemplos: `OPENING_STANDARD`, `CLOSING_STANDARD`, `FOOD_SAFETY_STANDARD`

**Pode ser:**
- ✅ Adicionar novos policy packs
- ✅ Modificar SLA de tarefas
- ✅ Adicionar novos triggers

**Não pode:**
- ❌ Remover validação de SLA
- ❌ Bypassar escalonamento
- ❌ Remover hard-blocking de tarefas críticas

**Onde vive:**
- `docker-tests/task-engine/policies/*.json`

---

#### 3. **Simuladores e Testes**

**O que é:**
- Scripts que validam o comportamento do sistema
- Exemplos: `simulate-24h.js`, `simulate-failfast.js`, `kds-kitchen.js`

**Pode ser:**
- ✅ Adicionar novos cenários de teste
- ✅ Modificar parâmetros de simulação
- ✅ Adicionar novas métricas

**Não pode:**
- ❌ Remover validações de integridade
- ❌ Bypassar verificações de orphans
- ❌ Falsificar resultados

**Onde vive:**
- `docker-tests/simulators/*.js`
- `docker-tests/Makefile`

---

#### 4. **UI e Cascas (Apps)**

**O que é:**
- Interfaces visuais que consomem o Core
- Exemplos: `merchant-portal`, `mobile-app`, `customer-portal`

**Pode ser:**
- ✅ Refazer completamente a UI
- ✅ Mudar frameworks (React → Vue, etc.)
- ✅ Adicionar novas telas

**Não pode:**
- ❌ Bypassar validações do Core
- ❌ Criar lógica de negócio na UI
- ❌ Duplicar fontes de verdade

**Onde vive:**
- `merchant-portal/`
- `mobile-app/`
- `customer-portal/`

---

## 🗑️ O Que É Descartável (DISPOSABLE)

### Definição

Componentes que **podem** ser removidos, refeitos ou ignorados sem impactar o Núcleo Sagrado.

### Componentes Descartáveis

#### 1. **Documentação de Transição**

**O que é:**
- Documentos criados durante migrações
- Exemplos: `LEGACY_INVENTORY.md`, `CLEANUP_REPORT.md`

**Pode ser:**
- ✅ Removido após migração completa
- ✅ Arquivado em `docs/archive/`
- ✅ Ignorado se não for mais relevante

**Onde vive:**
- `docs/refactor/`
- `docs/archive/`

---

#### 2. **Scripts de Migração Única**

**O que é:**
- Scripts SQL ou Node.js executados uma vez
- Exemplos: migrações de schema, seeds iniciais

**Pode ser:**
- ✅ Removido após execução
- ✅ Mantido apenas para histórico

**Onde vive:**
- `supabase/migrations/` (após execução em produção)
- Scripts temporários em `docker-tests/`

---

#### 3. **Configurações de Ambiente Específicas**

**O que é:**
- Arquivos `.env.example`, configurações locais
- Exemplos: chaves de API de desenvolvimento, URLs de staging

**Pode ser:**
- ✅ Modificado livremente
- ✅ Removido se não for mais necessário

**Onde vive:**
- `.env.example`
- Configurações locais

---

## 📐 Arquitetura em Camadas

### Camada 0: Núcleo Sagrado (IMMUTABLE)

```
┌─────────────────────────────────────────┐
│   NÚCLEO SAGRADO (NUNCA MUDAR)          │
├─────────────────────────────────────────┤
│  • Sistema de Eventos                   │
│  • Governança por SLA                   │
│  • Offline-First                        │
│  • Fonte Única de Verdade               │
│  • Validação por Simulação              │
└─────────────────────────────────────────┘
```

**Regra:** Se você tocar aqui, o sistema deixa de ser válido.

---

### Camada 1: Runtime (EVOLUTIVE)

```
┌─────────────────────────────────────────┐
│   RUNTIME (EXTENSÍVEL COM CONTRATOS)    │
├─────────────────────────────────────────┤
│  • Perfis de Restaurante               │
│  • Policy Packs                         │
│  • Simuladores                          │
│  • Apps (UI)                            │
└─────────────────────────────────────────┘
```

**Regra:** Pode mudar, desde que respeite os contratos do Núcleo Sagrado.

---

### Camada 2: Descartável (DISPOSABLE)

```
┌─────────────────────────────────────────┐
│   DESCARTÁVEL (PODE REMOVER)           │
├─────────────────────────────────────────┤
│  • Documentação de transição            │
│  • Scripts de migração única            │
│  • Configurações temporárias            │
└─────────────────────────────────────────┘
```

**Regra:** Pode remover sem impacto no Core.

---

## 🚨 Regras de Ouro

### Regra 1: Se Não É Exercitado pelo Simulador, Não É Core

Se uma funcionalidade não aparece no `simulate-24h.js`, ela não faz parte do Núcleo Sagrado.

**Exemplo:**
- ❌ Feature de "compartilhar receita no Instagram" → Não é Core
- ✅ Sistema de tarefas com SLA → É Core (exercitado pelo simulador)

---

### Regra 2: Duplicação = Violação

Se você vê lógica duplicada, consolide imediatamente.

**Exemplo:**
- ❌ Lógica de retry em 3 lugares diferentes → Violação
- ✅ Lógica de retry em `offline-controller` → Correto

---

### Regra 3: UI Não Decide, Core Decide

A UI nunca toma decisões de negócio. Ela apenas reflete o estado do Core.

**Exemplo:**
- ❌ UI verifica se pode fechar turno → Violação
- ✅ UI consulta Core, Core retorna `canCloseShift: false` → Correto

---

### Regra 4: Sem Validação, Sem Confiança

Se uma mudança não passa no `make simulate-24h-small`, ela não pode ser commitada.

**Exemplo:**
- ❌ "Funciona na minha máquina" → Violação
- ✅ "Passou no simulador" → Correto

---

## 📊 Matriz de Decisão

Use esta matriz para decidir se algo é Sagrado, Extensível ou Descartável:

| Critério | Sagrado | Extensível | Descartável |
|----------|---------|------------|-------------|
| **Aparece no simulador?** | ✅ Sim | ✅ Sim | ❌ Não |
| **Se remover, sistema quebra?** | ✅ Sim | ❌ Não | ❌ Não |
| **Pode ser substituído?** | ❌ Não | ✅ Sim | ✅ Sim |
| **Tem contrato formal?** | ✅ Sim | ✅ Sim | ❌ Não |
| **É auditável?** | ✅ Sim | ✅ Sim | ❌ Não |

---

## 🎯 Próximos Passos Recomendados

### Para Desenvolvedores

1. **Leia este documento antes de tocar no Core**
2. **Consulte `CORE_MANIFESTO.md` para regras específicas**
3. **Execute `make simulate-failfast` antes de cada commit**
4. **Execute `make simulate-24h-small` antes de cada PR**

### Para Investidores/Auditores

1. **Foque na Camada 0 (Núcleo Sagrado)**
2. **Valide que o simulador cobre todos os componentes sagrados**
3. **Verifique que não há duplicação de lógica**
4. **Confirme que a validação é automática e reproduzível**

---

## 📚 Documentos Relacionados

- **[CORE_MANIFESTO.md](../../CORE_MANIFESTO.md)** - Lei do sistema (regras específicas)
- **[docs/CORE_ARCHITECTURE.md](../CORE_ARCHITECTURE.md)** - Arquitetura técnica
- **[docs/testing/MEGA_OPERATIONAL_SIMULATOR.md](../testing/MEGA_OPERATIONAL_SIMULATOR.md)** - Validação completa
- **[START_HERE.md](../../START_HERE.md)** - Ponto de entrada

---

## ✅ Conclusão

Este documento define **o que é intocável** no ChefIApp Core.

**Resumo em uma frase:**
> O Núcleo Sagrado é o que faz o ChefIApp ser o ChefIApp. Tudo mais é extensível ou descartável.

**Última validação:** 2026-01-24  
**Próxima revisão:** Quando houver mudança arquitetural significativa

---

*Este documento é parte do Core v1.0-core-sovereign.*
