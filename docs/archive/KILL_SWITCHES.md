# 🛡️ KILL SWITCHES — ENFORCEMENT MECHANISMS

**Versão**: 1.0.0
**Data**: 2025-12-26
**Status**: IMMUTABLE
**Propósito**: Proteger a integridade do sistema contra violações das 6 Leis

---

## 🧠 O QUE SÃO KILL SWITCHES

Kill Switches são **mecanismos de proteção técnica e contratual** que impedem a violação das 6 Leis Imutáveis (CANON.md).

São de três tipos:
1. **Código** — Erros forçados que impedem execução
2. **CI/CD** — Testes automatizados que bloqueiam deploy
3. **Contrato** — Cláusulas legais que protegem o método

---

## ⚙️ KILL SWITCHES TÉCNICOS (Código)

### Kill Switch 1: Bloquear Criação Manual de Tarefas (Law 2)

**Arquivo**: `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`

```typescript
/**
 * ❌ KILL SWITCH: Manual task creation prohibited (Law 2 — Reflex)
 *
 * Razão: Tarefas vêm de reflexos sistêmicos, não de ação humana.
 * Permitir criação manual = quebrar automação reflexiva.
 */
export const createTaskManually = () => {
  throw new Error(
    'CANON VIOLATION: Manual task creation prohibited (Law 2 — System > Human). ' +
    'Tasks must originate from system reflexes (idle, pressure, inventory).'
  );
};

// Se algum componente tentar chamar:
// createTaskManually();
// → App crasha com erro explicativo
```

---

### Kill Switch 2: Bloquear Navegação Cross-Role (Law 4)

**Arquivo**: `merchant-portal/src/pages/AppStaff/AppStaff.tsx`

```typescript
/**
 * ❌ KILL SWITCH: Role switching prohibited (Law 4 — Cognitive Isolation)
 *
 * Razão: Cada papel vê apenas seu contexto.
 * Permitir navegação cross-role = poluição cognitiva.
 */
export const switchToRole = (targetRole: StaffRole) => {
  throw new Error(
    'CANON VIOLATION: Manual role switching prohibited (Law 4 — Cognitive Isolation). ' +
    'Role is determined by device assignment, not user choice.'
  );
};

// Se algum componente tentar:
// <button onClick={() => switchToRole('kitchen')}>Ver Cozinha</button>
// → App crasha com erro explicativo
```

---

### Kill Switch 3: Bloquear Customização de UI (Anti-Feature)

**Arquivo**: `merchant-portal/src/ui/design-system/ThemeProvider.tsx` (se existir)

```typescript
/**
 * ❌ KILL SWITCH: UI customization prohibited (Anti-Feature)
 *
 * Razão: UI é reflexo do papel. Customizar = quebrar Tool Sovereignty.
 */
export const changeTheme = () => {
  throw new Error(
    'CANON VIOLATION: UI customization prohibited (Tool Sovereignty). ' +
    'UI is determined by role and context, not user preference.'
  );
};

export const setLayout = () => {
  throw new Error(
    'CANON VIOLATION: Layout customization prohibited (Tool Sovereignty).'
  );
};
```

---

### Kill Switch 4: Bloquear Configuração de Alertas (Anti-Feature)

**Arquivo**: `merchant-portal/src/core/nervous-system/InventoryReflexEngine.ts`

```typescript
/**
 * ❌ KILL SWITCH: Alert configuration prohibited (Anti-Feature)
 *
 * Razão: Alertas vêm de adaptive thresholds. Configuração manual = quebrar inteligência.
 */
export const configureAlertThreshold = () => {
  throw new Error(
    'CANON VIOLATION: Manual alert configuration prohibited. ' +
    'Thresholds are adaptive and context-aware (rush hour vs calm).'
  );
};
```

---

### Kill Switch 5: Bloquear Gamificação (Anti-Feature)

**Arquivo**: `merchant-portal/src/pages/AppStaff/components/` (qualquer componente)

```typescript
/**
 * ❌ KILL SWITCH: Gamification prohibited (Anti-Feature)
 *
 * Razão: Sistema nervoso não joga. Trabalha.
 */
export const addPoints = () => {
  throw new Error(
    'CANON VIOLATION: Gamification prohibited. ' +
    'No points, badges, or leaderboards allowed.'
  );
};

export const showProductivityMetrics = () => {
  throw new Error(
    'CANON VIOLATION: Productivity metrics prohibited (Gamification). ' +
    'System optimizes work, not workers.'
  );
};
```

---

## 🧪 KILL SWITCHES CI/CD (Testes Automatizados)

### Test 1: Verificar Tool Sovereignty (Law 1)

**Arquivo**: `tests/nervous-system/law1-tool-sovereignty.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDominantTool } from '@/pages/AppStaff/context/StaffContext';

describe('KILL SWITCH: Law 1 — Tool Sovereignty', () => {
  it('❌ Should FAIL if tool can be manually overridden', () => {
    const dominantTool = calculateDominantTool({
      activeRole: 'waiter',
      hasActiveOrders: true,
      userPreference: 'kitchen' // ❌ Não deve existir
    });

    // Se userPreference existe, teste FALHA
    expect(dominantTool).toBe('order'); // Sempre 'order' para waiter
    expect(dominantTool).not.toBe('kitchen'); // NUNCA muda para kitchen
  });

  it('✅ Should PASS if tool is purely contextual', () => {
    const waiterTool = calculateDominantTool({
      activeRole: 'waiter',
      hasActiveOrders: true
    });

    expect(waiterTool).toBe('order'); // ✅ Sem configuração, sem escolha
  });
});
```

**CI/CD Action**: Se teste FAIL → **Bloqueia deploy**

---

### Test 2: Verificar System Reflex (Law 2)

**Arquivo**: `tests/nervous-system/law2-reflex.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { checkSystemReflex } from '@/core/nervous-system/SystemReflexEngine';

describe('KILL SWITCH: Law 2 — System Reflex', () => {
  it('❌ Should FAIL if manual task creation exists', () => {
    // Se função createTaskManually() existe e NÃO lança erro, teste FALHA
    expect(() => {
      createTaskManually(); // Deve lançar erro
    }).toThrow('CANON VIOLATION');
  });

  it('✅ Should PASS if idle injects background task automatically', () => {
    const injectedTasks = checkSystemReflex({
      orders: [],
      lastActivityAt: Date.now() - 6 * 60 * 1000, // 6 min idle
      activeRole: 'worker',
      density: 'low'
    });

    expect(injectedTasks.length).toBeGreaterThan(0); // ✅ Sistema injeta tarefa
    expect(injectedTasks[0].meta.source).toBe('idle-reflex'); // ✅ Origem reflexiva
  });
});
```

**CI/CD Action**: Se teste FAIL → **Bloqueia deploy**

---

### Test 3: Verificar Cognitive Isolation (Law 4)

**Arquivo**: `tests/nervous-system/law4-cognitive-isolation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('KILL SWITCH: Law 4 — Cognitive Isolation', () => {
  it('❌ Should FAIL if waiter can see kitchen tasks', () => {
    const waiterView = filterTasksByRole(allTasks, 'waiter');
    const kitchenTasks = waiterView.filter(t => t.context === 'kitchen');

    expect(kitchenTasks.length).toBe(0); // ✅ Waiter NUNCA vê cozinha
  });

  it('❌ Should FAIL if cross-role navigation exists', () => {
    // Se função switchToRole() existe e NÃO lança erro, teste FALHA
    expect(() => {
      switchToRole('kitchen');
    }).toThrow('CANON VIOLATION');
  });

  it('✅ Should PASS if roles are strictly isolated', () => {
    const waiterTasks = filterTasksByRole(allTasks, 'waiter');
    const kitchenTasks = filterTasksByRole(allTasks, 'kitchen');

    // Nenhuma sobreposição
    const overlap = waiterTasks.filter(t => kitchenTasks.includes(t));
    expect(overlap.length).toBe(0); // ✅ Zero overlap
  });
});
```

**CI/CD Action**: Se teste FAIL → **Bloqueia deploy**

---

### Test 4: Verificar Progressive Externalization (Law 6)

**Arquivo**: `tests/nervous-system/law6-externalization.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTaskMigration } from '@/core/nervous-system/TaskMigrationEngine';

describe('KILL SWITCH: Law 6 — Progressive Externalization', () => {
  it('❌ Should FAIL if manual delegation exists', () => {
    // Se função assignTask(task, targetRole) existe, teste FALHA
    expect(() => {
      assignTask(task, 'kitchen'); // Deve lançar erro
    }).toThrow('CANON VIOLATION');
  });

  it('✅ Should PASS if tasks migrate automatically', () => {
    const migration = calculateTaskMigration(
      allTasks,
      'worker', // Current device (generalist)
      'cleaning', // New device (specialist)
      devices
    );

    const cleaningTasks = migration.tasksToMigrate.filter(t => t.uiMode === 'check');

    expect(cleaningTasks.length).toBeGreaterThan(0); // ✅ Cleaning tasks migrated
    expect(migration.tasksToKeep.find(t => t.uiMode === 'check')).toBeUndefined(); // ✅ None left
  });
});
```

**CI/CD Action**: Se teste FAIL → **Bloqueia deploy**

---

## 🚨 KILL SWITCH CI/CD PIPELINE

### GitHub Actions: `.github/workflows/canon-enforcement.yml`

```yaml
name: Canon Enforcement (Kill Switches)

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  enforce-canon:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install Dependencies
        run: npm ci

      - name: Run Kill Switch Tests
        run: |
          npx vitest run tests/nervous-system/law1-tool-sovereignty.test.ts
          npx vitest run tests/nervous-system/law2-reflex.test.ts
          npx vitest run tests/nervous-system/law4-cognitive-isolation.test.ts
          npx vitest run tests/nervous-system/law6-externalization.test.ts

      - name: Block Deploy if Tests Fail
        if: failure()
        run: |
          echo "❌ CANON VIOLATION DETECTED"
          echo "One or more Kill Switch tests failed."
          echo "Deployment BLOCKED until violations are fixed."
          exit 1

      - name: Run Full Stress Test (7 Phases)
        run: npx vitest run tests/nervous-system/AppStaff.stress.test.ts

      - name: Verify Canon Compliance
        if: success()
        run: |
          echo "✅ All Kill Switches PASS"
          echo "Canon integrity maintained."
          echo "Deployment ALLOWED."
```

**Resultado**: Se qualquer teste FAIL → **PR bloqueado, deploy impossível**

---

## 📜 KILL SWITCHES CONTRATUAIS (Licenciamento)

### Cláusula 1: Proibição de Modificação das 6 Leis

**Aplicável a**: Licenças empresariais, white-label, integração

```
CLÁUSULA DE INTEGRIDADE SISTÊMICA

O Licenciado concorda que:

1. As 6 Leis Imutáveis (Tool Sovereignty, Reflex, Temporal Memory,
   Cognitive Isolation, Non-Blocking Suggestions, Progressive Externalization)
   são PARTE ESSENCIAL do método licenciado.

2. Qualquer modificação, remoção ou desativação das 6 Leis constitui
   VIOLAÇÃO MATERIAL deste contrato.

3. Em caso de violação:
   a) Licença é REVOGADA imediatamente
   b) Licenciado deve cessar uso do software em 48 horas
   c) Licenciante pode reivindicar danos por diluição de marca

4. Exemplos de violação:
   - Adicionar botão "Nova Tarefa" (quebra Law 2)
   - Adicionar menu cross-role (quebra Law 4)
   - Adicionar customização de UI (quebra Tool Sovereignty)
   - Adicionar configuração de alertas (quebra Reflex)
   - Adicionar gamificação (quebra método operacional)
```

---

### Cláusula 2: Auditoria de Integridade

**Aplicável a**: Todos os contratos enterprise

```
DIREITO DE AUDITORIA

O Licenciante reserva o direito de:

1. Auditar implementação do Licenciado a qualquer momento mediante
   aviso prévio de 7 dias.

2. Executar suite de testes "Kill Switches" no ambiente do Licenciado
   para verificar conformidade com as 6 Leis.

3. Revogar licença em caso de não-conformidade detectada e não corrigida
   em 30 dias.

4. Publicar "Seal of Canonical Compliance" para licenciados em conformidade.
```

---

### Cláusula 3: Proteção de Método

**Aplicável a**: Contratos de white-label, customização

```
PROPRIEDADE INTELECTUAL DO MÉTODO

O Licenciado reconhece que:

1. AppStaff é baseado em método operacional proprietário protegido por:
   - Trade secret (segredo comercial)
   - Copyright (código-fonte)
   - Pending patent (método de 6 Leis em processo de patenteamento)

2. Licenciado NÃO adquire direito de:
   - Replicar o método em outros produtos
   - Criar "versão customizada" que viole as 6 Leis
   - Licenciar sub-licenças sem autorização expressa

3. Violação desta cláusula resulta em:
   - Revogação imediata de licença
   - Ação judicial por violação de propriedade intelectual
   - Indenização por perdas e danos + lucros cessantes
```

---

## 🔐 ENFORCEMENT HIERARCHY

### Nível 1: Código (Imediato)
- Kill Switches lançam erros
- App crasha se Lei for violada
- Dev vê mensagem clara sobre violação

### Nível 2: CI/CD (Pre-Deploy)
- Testes automatizados rodam em PR
- Deploy bloqueado se teste falhar
- Impossível fazer merge sem passar

### Nível 3: Auditoria (Post-Deploy)
- Auditorias periódicas em licenciados enterprise
- Verificação de conformidade com 6 Leis
- Revogação de licença se violação detectada

### Nível 4: Legal (Último Recurso)
- Ação judicial por violação de propriedade intelectual
- Indenização por diluição de marca
- Injunção para cessar uso do software

---

## 📋 CODE REVIEW CHECKLIST (Obrigatório)

Antes de merge em `main`, verificar:

### ✅ Law 1 — Tool Sovereignty
- [ ] Nenhum botão de "mudar ferramenta"?
- [ ] Nenhuma configuração de UI por preferência?
- [ ] Tool calculado puramente por contexto (papel + trabalho)?

### ✅ Law 2 — Reflex
- [ ] Nenhuma criação manual de tarefas?
- [ ] Idle/Pressure/Inventory reflexes funcionam automaticamente?
- [ ] Nenhum botão "Nova Tarefa" ou "Criar Lembrete"?

### ✅ Law 3 — Temporal Memory
- [ ] `lastActivityAt` sendo rastreado?
- [ ] Idle threshold adaptativo ao contexto?
- [ ] NUNCA logout automático por inatividade?

### ✅ Law 4 — Cognitive Isolation
- [ ] Nenhuma navegação cross-role?
- [ ] Waiter NUNCA vê kitchen?
- [ ] Kitchen NUNCA vê inventory?
- [ ] Filtros de papel funcionam corretamente?

### ✅ Law 5 — Non-Blocking Suggestions
- [ ] Background tasks invisíveis?
- [ ] Attention tasks em toasts/orbitais?
- [ ] Critical tasks bloqueiam apenas se prioridade = 'critical'?

### ✅ Law 6 — Progressive Externalization
- [ ] Task migration automática quando device especializado conecta?
- [ ] Nenhum botão "Delegar" ou "Transferir"?
- [ ] Dominant tool recalcula sozinho após migration?

### ✅ Anti-Features
- [ ] ZERO customização de UI?
- [ ] ZERO configuração de alertas?
- [ ] ZERO gamificação (pontos, badges)?
- [ ] ZERO integração com task managers (Trello, Notion)?

---

## 🎯 QUANDO USAR KILL SWITCHES

### ✅ Use quando:
- Alguém tenta adicionar feature que quebra Canon
- PR introduz violação das 6 Leis
- Cliente pede customização proibida
- Concorrente tenta replicar método

### ❌ Não use quando:
- Mudança não afeta comportamento sistêmico
- Otimização de performance pura
- Bug fix que mantém Lei intacta
- Adicionar compliance fiscal (não quebra Leis)

---

## 📞 ENFORCEMENT SUPPORT

**Para desenvolvedores**:
- Leia `CANON.md` antes de qualquer PR
- Rode testes de Kill Switch localmente: `npx vitest run tests/nervous-system/`
- Se teste falhar, PARE. Não ignore. Pergunte.

**Para product managers**:
- Feature request quebra Canon? → **Recuse imediatamente**
- Cliente pede customização proibida? → **Explique o método, não negocie**

**Para legal/business**:
- Licenciado violar cláusula? → **Revogue licença**
- Concorrente copiar método? → **Ação judicial**

---

## 🔒 FINAL WORD

Kill Switches existem para **proteger a integridade do sistema**.

Não são "regras chatas". São **garantia de que AppStaff funciona**.

Se você desabilitar Kill Switch, você não tem mais AppStaff.
Você tem um task manager genérico.

**Proteja o método. Proteja as Leis.**

---

**Versão**: 1.0.0
**Data**: 2025-12-26
**Status**: IMMUTABLE
**Enforcement**: ACTIVE

---

© 2025 ChefIApp — Operational Nervous System
**Protected by Code, CI/CD, and Contract**
