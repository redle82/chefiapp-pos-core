# MANIFESTO DO CORE

> Este documento define o que o ChefIApp Core **É** e o que **NUNCA SERÁ**.
> Qualquer violação deste manifesto é uma regressão arquitetural.

---

## PREÂMBULO

O ChefIApp Core foi validado em **simulação de produção** com:
- 24 horas de operação contínua
- Governança completa (SLA, escalonamento, hard-blocking)
- Resiliência offline durante picos
- Zero orphans, zero duplicatas, zero perda de dados

Este manifesto codifica as decisões que tornaram isso possível.

**Data de ratificação:** 2026-01-24  
**Validado por:** MEGA OPERATIONAL SIMULATOR v2.1

---

## SEÇÃO I — O QUE O CORE É

### 1.1 Sistema Operacional de Restauração

O Core não é um aplicativo. É um **sistema operacional** que governa:
- Pedidos
- Tarefas
- Turnos
- Governança
- Integridade de dados

### 1.2 Governador de Comportamento Humano

O Core não sugere. O Core **exige**.

- Tarefas têm SLA
- SLA expirado = escalonamento automático
- Escalonamento ignora hierarquia social
- Hard-blocking impede operações até resolução

### 1.3 Fonte Única de Verdade

Existe **uma** fonte de verdade para cada domínio:

| Domínio | Fonte de Verdade |
|---------|------------------|
| Pedidos | `gm_orders` |
| Tarefas | `gm_tasks` |
| Eventos | `gm_events` |
| Governança | `task-engine/policies/*.json` |
| Perfis | `seeds/profiles/*.json` |

**Duplicar é proibido. Consolidar é obrigatório.**

### 1.4 Offline-First por Design

Offline não é erro. Offline é **estado válido**.

- Ações são enfileiradas localmente
- Idempotency keys previnem duplicação
- Reconciliação é automática
- Integridade é garantida em qualquer cenário de rede

### 1.5 Event-Driven

O Core se comunica por **eventos**, não por chamadas diretas.

```
Ação → Evento → Reação
```

Eventos são:
- Imutáveis
- Auditáveis
- Reproduzíveis

### 1.6 Governado por SLA

Nenhuma tarefa existe sem deadline.  
Nenhum deadline existe sem consequência.

```
Tarefa criada → SLA definido → Monitoramento → Escalonamento → Resolução ou Falha
```

### 1.7 Testado por Simulação

A única prova de funcionamento é o simulador.

```bash
make simulate-24h-small
make assertions
```

**Se passa: está correto.**  
**Se falha: está errado.**

Não há exceções. Não há "funciona na minha máquina".

---

## SEÇÃO II — O QUE O CORE NUNCA SERÁ

### 2.1 Nunca Será um POS Comum

POS comum = interface de venda.  
ChefIApp Core = sistema de governança operacional.

A diferença:
- POS registra vendas
- Core **governa operações**

### 2.2 Nunca Será UI-First

UI é **consumidor** do Core, não fonte de verdade.

```
ERRADO: UI decide → Core obedece
CERTO:  Core decide → UI exibe
```

Se a UI discorda do Core, a UI está errada.

### 2.3 Nunca Será Permissivo

O Core não pergunta "você tem certeza?".  
O Core diz "você não pode até que X esteja feito".

Permissividade é bug. Rigidez é feature.

### 2.4 Nunca Será "Best Effort"

Não existe "tentamos enviar".  
Existe "enviado" ou "falhou com audit trail".

```
PROIBIDO: fire-and-forget
OBRIGATÓRIO: confirm-or-retry-with-audit
```

### 2.5 Nunca Será Feature Playground

Novas features não entram no Core por vontade.  
Entram por **necessidade validada pelo simulador**.

Critério de entrada:
1. A feature resolve problema operacional real?
2. O simulador pode exercitar a feature?
3. A feature mantém integridade sob stress?

**3 sim = pode entrar.**  
**Qualquer não = não entra.**

### 2.6 Nunca Será Dependente de UI

O Core funciona **sem**:
- Mobile app
- Web app
- Dashboard
- Interface gráfica

Se todas as UIs forem deletadas, o Core continua governando.

### 2.7 Nunca Aceitará Lógica Crítica Fora do Core

| Tipo de Lógica | Onde Vive | Onde NUNCA Vive |
|----------------|-----------|-----------------|
| Governança | Core | UI |
| SLA | Core | Mobile |
| Escalonamento | Core | Web |
| Hard-blocking | Core | Componentes |
| Offline sync | Core | Hooks avulsos |

**Se é crítico, está no Core. Sem exceção.**

---

## SEÇÃO III — PRINCÍPIOS NÃO NEGOCIÁVEIS

### 3.1 Governança > Conveniência

Se a governança diz "não pode fechar turno", o turno não fecha.  
Não importa se o gerente está com pressa.  
Não importa se "é só dessa vez".

### 3.2 Integridade > Velocidade

Uma operação lenta e correta é melhor que uma rápida e corrompida.

O Core prefere:
- Bloquear a perder dados
- Retry a falhar silenciosamente
- Audit trail a performance

### 3.3 Offline é Estado Válido

Perder conexão não é emergência.  
É cenário esperado e testado.

O sistema deve:
- Continuar operando
- Enfileirar ações
- Reconciliar automaticamente
- Nunca duplicar

### 3.4 UI é Descartável

Qualquer UI pode ser:
- Reescrita
- Substituída
- Deletada

O Core permanece intacto.

### 3.5 Se o Simulador Não Exercita, Não é Core

```
Código no Core + Simulador não testa = Código morto
Código morto = Remover
```

Não há código "importante demais para testar".

---

## SEÇÃO IV — REGRAS PARA O FUTURO

### 4.1 Como Novas Features Entram

```
1. Proposta documentada
2. Simulador atualizado para exercitar
3. Implementação
4. make simulate-24h-* passa
5. make assertions passa
6. Merge permitido
```

**Pular qualquer passo = PR rejeitado.**

### 4.2 Onde Lógica Pode Viver

| Tipo | Localização Permitida |
|------|----------------------|
| Governança | `core/sovereignty/`, `task-engine/` |
| Eventos | `core/events/` |
| Offline | `core/offline/`, `simulators/` |
| Fiscal | `core/fiscal/` |
| Pagamentos | `core/payment/` |
| UI Components | `pages/`, `components/` |
| Integrações | `server/integrations/` |

**Lógica no lugar errado = refatorar ou remover.**

### 4.3 Quando Algo Vira Legacy

Código vira legacy quando:
- Não é exercitado pelo simulador por 2 ciclos
- Tem @deprecated há mais de 1 mês
- Duplica lógica existente no Core
- Não tem owner documentado

**Legacy = candidato a remoção.**

### 4.4 Quem Decide Exceções

**Quase ninguém.**

Exceções ao manifesto requerem:
1. Documento escrito justificando
2. Aprovação de 2+ maintainers
3. Plano de remoção da exceção
4. Prazo máximo de 30 dias

Exceção sem prazo = não é exceção, é violação.

---

## SEÇÃO V — DEFINIÇÕES

### Core
Código que governa operação, testado pelo simulador, independente de UI.

### UI
Qualquer interface visual que consome o Core.

### Legacy
Código não exercitado, marcado para remoção.

### Governança
Sistema de regras que força comportamento correto.

### Hard-Blocking
Restrição que impede operação até resolução.

### Escalonamento
Transferência automática de responsabilidade por SLA expirado.

### Simulador
Ferramenta que valida o Core sem UI, sob condições reais.

---

## SEÇÃO VI — ASSINATURAS

Este manifesto foi validado por:

- **MEGA OPERATIONAL SIMULATOR v2.1**
  - 24h simuladas
  - 964+ pedidos
  - 210+ tarefas
  - 89+ escalações
  - 0 orphans
  - 0 duplicatas

- **Limpeza Total (2026-01-24)**
  - 25 arquivos removidos
  - 11 diretórios removidos
  - 8 edge functions removidas
  - 0 regressões

---

## APÊNDICE — COMANDOS DE VALIDAÇÃO

```bash
# Validação rápida
make simulate-24h-small && make assertions

# Validação completa
make simulate-24h-small && \
make simulate-24h-large && \
make simulate-24h-giant && \
make assertions

# Verificar integridade
make assertions
```

**Se qualquer comando falhar, o Core está em violação.**

---

## EPÍLOGO

> O ChefIApp Core não é flexível.  
> Não é amigável.  
> Não é permissivo.  
>
> É **correto**.
>
> E ser correto é mais importante que ser conveniente.

---

*Este manifesto é lei. Violações são bugs. Bugs são corrigidos ou removidos.*
