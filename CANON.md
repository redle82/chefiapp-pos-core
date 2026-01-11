# ⚖️ CHEFIAPP CANON — LEIS IMUTÁVEIS

**Status**: IMMUTABLE
**Version**: 1.0.0
**Last Updated**: 2025-12-26

---

## 🧠 O QUE É ISTO

Este documento define as **leis constitucionais** do ChefIApp.

Não são features. Não são roadmap. Não são "best practices".

São **limites estruturais inegociáveis** que protegem a integridade do sistema.

**Se quebrar uma lei deste documento, você não tem mais ChefIApp.**
Tem um task manager genérico.

---

## ⚖️ AS 7 LEIS IMUTÁVEIS (CORE 4 — APPSTAFF + NAVIGATION)

### LAW 0: NAVIGATION SOVEREIGNTY (FlowGate > All)

**Princípio**: Existe UM ponto de entrada. Todo o resto é consequência.

**Regras**:
- ✅ Landing → `/app` (sempre)
- ✅ `/app` → FlowGate intercepta (sempre)
- ✅ FlowGate decide rota (única autoridade)
- ❌ NUNCA: Landing decide rota (`/login`, `/onboarding`, query strings)
- ❌ NUNCA: Múltiplos componentes redirecionando
- ❌ NUNCA: Auto-redirects fora do FlowGate

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
<Link to="/login">Entrar</Link>
<Link to="/onboarding">Começar</Link>
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
<Link to="/app">Entrar em operação</Link>
// FlowGate decide o resto
```

**Referência**: `ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md`

---

### LAW 1: TOOL SOVEREIGNTY (Tool > Task)

**Princípio**: O trabalho define a ferramenta. Nunca o contrário.

**Regras**:
- ✅ Garçom → MiniPOS (sempre)
- ✅ Cozinha (ocupada) → KDS (sempre)
- ✅ Cozinha (ociosa) → Mise en Place (sempre)
- ❌ NUNCA: "Escolha sua vista"
- ❌ NUNCA: "Mudar para modo X"
- ❌ NUNCA: Menus de navegação entre ferramentas

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
<button onClick={() => switchTool('kitchen')}>Ver Cozinha</button>
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
const dominantTool = useMemo(() => {
  if (activeRole === 'waiter') return 'order'; // NO CHOICE
}, [activeRole]);
```

---

### LAW 2: REFLEX (System > Human)

**Princípio**: O sistema age antes que o humano pense.

**Regras**:
- ✅ Ocioso por 5 min → Sistema injeta tarefa de fundo
- ✅ Stock < par → Sistema gera alerta (não espera humano verificar)
- ✅ Pressão sobe → UI simplifica automaticamente
- ❌ NUNCA: "Quer criar uma tarefa?"
- ❌ NUNCA: "Configurar alertas de stock"
- ❌ NUNCA: Botão "Verificar pendências"

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
<button onClick={createTask}>Nova Tarefa</button>
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
useEffect(() => {
  const interval = setInterval(() => {
    const reflexTasks = checkSystemReflex({ /* auto */ });
    setTasks(prev => [...prev, ...reflexTasks]);
  }, 15000);
}, []);
```

---

### LAW 3: TEMPORAL MEMORY (Idle ≠ Zero)

**Princípio**: Inatividade é informação, não ausência.

**Regras**:
- ✅ Sistema lembra última atividade
- ✅ Threshold adapta-se ao contexto (rush hour vs calmo)
- ✅ Estado "idle" gera comportamento específico
- ❌ NUNCA: Reset de estado em inatividade
- ❌ NUNCA: Logout automático por inatividade
- ❌ NUNCA: "Ainda está aí?"

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
if (idleTime > 10min) logout();
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
const lastActivityAt = useRef(Date.now());
const idleTime = Date.now() - lastActivityAt.current;
// Idle triggers BEHAVIOR, not disconnection
```

---

### LAW 4: COGNITIVE ISOLATION

**Princípio**: Cada papel vê apenas o seu mundo.

**Regras**:
- ✅ Garçom NUNCA vê tarefas de cozinha
- ✅ Cozinha NUNCA vê inventário
- ✅ Manager vê sinais agregados (não checklists)
- ❌ NUNCA: "Ver todas as tarefas"
- ❌ NUNCA: Dashboard universal
- ❌ NUNCA: Cross-role notifications (exceto críticas)

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
const allTasks = tasks; // Show everything to everyone
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
const visibleTasks = tasks.filter(t =>
  t.assigneeRole === activeRole || t.priority === 'critical'
);
```

---

### LAW 5: NON-BLOCKING SUGGESTIONS

**Princípio**: Informação orbita o trabalho. Nunca o bloqueia.

**Regras**:
- ✅ Tarefas de fundo → Invisíveis
- ✅ Tarefas de atenção → Toasts/orbitais
- ✅ Tarefas críticas → Bloqueio total (raras)
- ❌ NUNCA: Modal para tarefa não-crítica
- ❌ NUNCA: Notificação que exige ação imediata (exceto emergência)
- ❌ NUNCA: Checklist bloqueando ferramenta primária

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
if (task.priority === 'background') showModal(task);
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
if (task.priority === 'critical' && task.status === 'focused') {
  return <BlockingModal task={task} />;
}
// Background tasks: invisible
// Attention tasks: orbital toasts only
```

---

### LAW 6: PROGRESSIVE EXTERNALIZATION

**Princípio**: Trabalho migra para quem é especialista. Automaticamente.

**Regras**:
- ✅ 1 pessoa → faz tudo (meta-tool)
- ✅ Pessoa especializada conecta → trabalho migra
- ✅ Ferramenta primária recalcula sozinha
- ❌ NUNCA: "Transferir tarefa para..."
- ❌ NUNCA: Configuração manual de distribuição
- ❌ NUNCA: Botão "Delegar"

**Violação Típica** (PROIBIDA):
```typescript
// ❌ FORBIDDEN
<button onClick={() => assignTask(task, 'kitchen')}>Mandar para Cozinha</button>
```

**Implementação Correta**:
```typescript
// ✅ CANONICAL
const migration = calculateTaskMigration(
  tasks, currentRole, newDeviceRole, devices
);
// Tasks migrate WITHOUT user action
setTasks(migration.tasksToKeep);
```

---

## 🚫 ANTI-FEATURES (PROIBIDAS PARA SEMPRE)

### ❌ 0. Múltiplos Pontos de Decisão de Navegação

**NUNCA**:
- Landing decidindo rotas
- Query strings controlando fluxo (`?oauth=google`, `?mode=migration`)
- Auto-redirects em múltiplos componentes
- Lógica de fluxo fora do FlowGate

**Razão**: Quebra Navigation Sovereignty (Law 0). Gera loops, telas erradas, comportamento imprevisível.

**Referência**: `LESSONS_LEARNED_AUTHORITY_CONFLICT.md`

---

### ❌ 1. Customização de UI

**NUNCA**:
- Temas
- Layouts alternativos
- "Modo avançado"
- Configuração de widgets
- Personalização de dashboard

**Razão**: UI é reflexo do papel. Customizar UI = quebrar Tool Sovereignty.

---

### ❌ 2. Criação Manual de Tarefas

**NUNCA**:
- Botão "Nova Tarefa"
- "Criar lembrete"
- "Adicionar pendência"

**Razão**: Tarefas vêm de reflexos. Criação manual = quebrar Reflex (Law 2).

**Exceção**: Owner pode criar tarefas de alto nível (estratégicas, não operacionais).

---

### ❌ 3. Navegação Cross-Role

**NUNCA**:
- Menu lateral com "Cozinha | Sala | Bar"
- Tabs entre contextos
- "Ver como Manager"

**Razão**: Quebra Cognitive Isolation (Law 4).

---

### ❌ 4. Configuração de Alertas

**NUNCA**:
- "Notificar-me quando..."
- Sliders de sensibilidade
- Escolher quais alertas receber

**Razão**: Alertas vêm de reflexos adaptativos. Configuração manual = quebrar inteligência do sistema.

---

### ❌ 5. Modo "Poder"

**NUNCA**:
- "Ver tudo"
- "Admin mode"
- Dashboard omnisciente (exceto Owner Dashboard específico)

**Razão**: Informação é contextual. Excesso de informação = ruído cognitivo.

---

### ❌ 6. Gamificação

**NUNCA**:
- Pontos
- Badges
- Leaderboards
- "Produtividade aumentou X%"

**Razão**: Sistema nervoso não joga. Trabalha.

---

### ❌ 7. Integração com Task Managers

**NUNCA**:
- Sync com Trello
- Export para Notion
- API para criar tarefas externamente

**Razão**: ChefIApp não é task manager. Integrar com task managers = poluir reflexos.

---

## ✅ O QUE PODE MUDAR (Scope Permitido)

### 🟢 Data & Intelligence
- Melhorar adaptive thresholds
- Refinar densidade de sinais
- Otimizar distribuição de tarefas

### 🟢 Performance
- Reduzir latência
- Otimizar rendering
- Melhorar offline sync

### 🟢 Compliance & Fiscal
- Adicionar regulações regionais
- Integrar com sistemas fiscais
- Adaptar para países específicos

### 🟢 Novos Reflexes (Com Cuidado)
- Adicionar novos engines (Hygiene, Safety, etc.)
- Desde que sigam as 6 Leis

---

## 🛡️ PROTEÇÃO TÉCNICA DAS LEIS

### Kill Switches (Código)

```typescript
// EXEMPLO: Bloquear criação manual de tarefas
export const createTask = () => {
  throw new Error('CANON VIOLATION: Manual task creation prohibited (Law 2)');
};

// EXEMPLO: Bloquear navegação cross-role
export const switchRole = () => {
  throw new Error('CANON VIOLATION: Role switching prohibited (Law 4)');
};
```

### Code Review Checklist

Antes de merge, verificar:
- [ ] Não adiciona múltiplos pontos de decisão de navegação?
- [ ] Não adiciona customização de UI?
- [ ] Não adiciona criação manual de tarefas?
- [ ] Não adiciona navegação cross-role?
- [ ] Não adiciona configuração de alertas?
- [ ] Não quebra Navigation Sovereignty?
- [ ] Não quebra Tool Sovereignty?
- [ ] Não quebra Reflex automatizado?

---

## 📜 ASSINATURA CANÔNICA

Este documento é **lei**. Não opinião.

Qualquer mudança a este documento requer:
1. Aprovação unânime de fundadores
2. Stress test completo (7 fases)
3. Prova de não-violação das 6 Leis

**Versão**: 1.1.0
**Status**: IMMUTABLE
**Ratificado**: 2025-12-26
**Atualizado**: 2026-01-08 (Law 0: Navigation Sovereignty adicionada)

---

**"Se você tem que escolher entre feature e canon, escolha canon."**

— ChefIApp Team
