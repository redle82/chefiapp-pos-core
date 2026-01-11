# 🎯 AppStaff Full Operation Simulation

## Objetivo

Teste E2E completo que simula um restaurante ativo com **15 funcionários simultâneos**, validando que o AppStaff funciona como um **sistema nervoso operacional** que:

- ✅ Nunca fica vazio (gera tarefas automáticas)
- ✅ Reage a eventos em tempo real (pedidos, pagamentos, chamados)
- ✅ Distribui tarefas corretamente por role
- ✅ Não duplica tarefas (sem spam)
- ✅ Gerencia urgência sem criar caos

## Estrutura da Equipe (15 pessoas)

### Gestão
- **Dono** - Visão geral, não executa tarefas
- **Gerente Geral** - Coordena fluxo, resolve exceções

### Sala / Atendimento
- **Garçom A** - Mesas 1-4
- **Garçom B** - Mesas 5-8
- **Garçom C** - Mesas 9-12
- **Garçom D** - Apoio / Chamados
- **Host/Recepção** - Entrada de clientes

### Cozinha
- **Cozinheiro Principal**
- **Auxiliar de Cozinha**
- **Pratos Frios / Sobremesas**

### Bar
- **Bartender Principal**
- **Ajudante de Bar**

### Operação
- **Limpeza / Turnover de Mesas**
- **Runner** (leva pedidos)
- **Estoque / Apoio**

## Fases do Teste

### FASE 1 — Restaurante Vazio (Estado Base)
**Condição**: Nenhum cliente, nenhum pedido ativo

**Esperado**:
- Sistema gera tarefas automáticas de rotina
- Cada funcionário recebe tarefas compatíveis com seu setor
- AppStaff não fica vazio
- Sensação: o sistema está vivo mesmo sem clientes

### FASE 2 — Pedidos pela Página Web
**Evento**: 3 clientes fazem pedidos pela página web pública (pagos online)

**Esperado**:
- Pedido entra no sistema
- Cozinha recebe tarefas automaticamente
- Bar recebe tarefas se houver bebidas
- Runner recebe tarefa de apoio
- Garçom **não** é acionado (pedido não é presencial)
- Owner Dashboard atualiza vendas
- AppStaff reflete novas tarefas sem refresh manual

### FASE 3 — Pedido via QR Code da Mesa
**Evento**: Mesa 3 e Mesa 7 fazem pedidos via QR

**Esperado**:
- Pedido vinculado à mesa
- Garçom responsável recebe tarefa: "Acompanhar Mesa X"
- Cozinha e bar recebem tarefas normalmente
- Sistema não duplica tarefas
- Status do pedido evolui em tempo real

### FASE 4 — Pedido feito pelo Garçom (AppStaff)
**Evento**: Garçom B lança pedido manualmente no sistema

**Esperado**:
- Pedido entra como "pedido assistido"
- Cozinha e bar recebem tarefas
- Nenhum conflito com pedidos web/QR
- Garçom não recebe tarefa redundante

### FASE 5 — Cliente Pede Conta e Paga
**Evento**: Cliente da Mesa 5 pede a conta e paga (TPV ou QR)

**Esperado**:
- Garçom recebe tarefa: "Finalizar mesa"
- Limpeza recebe tarefa automática: "Limpar Mesa 5"
- Sistema libera mesa
- Owner Dashboard atualiza faturamento
- AppStaff remove tarefas concluídas

### FASE 6 — Cliente Chama o Garçom (Repetido)
**Evento**: Cliente da Mesa 8 pressiona "Chamar Garçom" 3 vezes

**Esperado**:
- Apenas uma tarefa ativa (sem spam)
- Sistema registra múltiplos sinais
- Garçom vê urgência aumentada (visual ou prioridade)
- Gerente pode ver alerta de pressão
- AppStaff mantém calma operacional (sem caos)

## Como Executar

```bash
# Instalar dependências (se necessário)
npm install

# Executar teste
npx playwright test tests/appstaff-full-operation-simulation.spec.ts

# Com UI (debug)
npx playwright test tests/appstaff-full-operation-simulation.spec.ts --ui

# Com headed browser (ver o que acontece)
npx playwright test tests/appstaff-full-operation-simulation.spec.ts --headed
```

## Pré-requisitos

1. **Servidor rodando**: `npm run server:web-module` (porta 4320)
2. **Frontend rodando**: `npm run dev` (merchant-portal)
3. **Banco de dados**: Supabase local ou remoto configurado
4. **Tabelas necessárias**:
   - `staff_tasks`
   - `reflex_firings`
   - `gm_orders`
   - `gm_order_items`

## Validações Finais

### ✅ Sistema Nunca Fica Vazio
Todos os funcionários (exceto owner) devem ter pelo menos 1 tarefa ativa.

### ✅ Tarefas Relevantes por Role
- **Cozinha**: Tarefas relacionadas a preparação, pedidos, estoque
- **Bar**: Tarefas relacionadas a bebidas
- **Garçom**: Tarefas relacionadas a mesas, atendimento
- **Limpeza**: Tarefas relacionadas a limpeza, turnover

### ✅ Sem Duplicação
Múltiplos chamados não devem criar múltiplas tarefas idênticas.

### ✅ Reação em Tempo Real
Tarefas devem aparecer automaticamente quando eventos ocorrem (sem refresh manual).

## Resultado Esperado

**Sensação geral**: "O restaurante está se movendo sozinho"

O AppStaff deve funcionar como um sistema nervoso silencioso, guiando pessoas reais em tempo real, com múltiplos canais, sem confusão, sem excesso de informação e sem necessidade de pensar.

