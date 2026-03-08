# Plano de Redução de Debt Técnica

**Data:** 24 Fevereiro 2026
**Status:** Crítico — 880+ Warnings, 13 Erros
**Prioridade:** P1 (Após Fiscal + Jest)

---

## 1. Situação Atual

A codebase acumula **debt técnica significativa**:

| Métrica             | Valor       | Nível                      |
| ------------------- | ----------- | -------------------------- |
| Linting Warnings    | 880+        | 🔴 Crítico                 |
| Linting Errors      | 13          | 🔴 Crítico                 |
| `any` Types         | ~800        | 🔴 Aprox. 90% dos warnings |
| Typechecks Passando | ✅ Sim      | Verde                      |
| ESLint Config       | ✅ Presente | Verde                      |

---

## 2. Anatomia dos Warnings

### 2.1 Distribuição

```
880 warnings total

├─ @typescript-eslint/no-explicit-any  ~800 (90%)
├─ Comments                             ~40
├─ Unused variables/imports             ~20
├─ Component naming                     ~10
└─ Outros (jsx, async, etc)            ~10
```

### 2.2 Problemática do `any`

**Padrão observado:**

```typescript
// ❌ Actual (violates strict typing)
function handleOrder(data: any) {
  return data.total * tax;
}

// ✅ Esperado (proper typing)
function handleOrder(data: Order) {
  return data.total * tax;
}
```

**Causas:**

1. **Legacy code** — migrações incompletas de JavaScript
2. **Lack of types** — bibliotecas sem TypeScript
3. **Lazy refactors** — "I'll fix types later" que nunca aparecem
4. **Fear of changes** — desenvolvedores temem quebrar ao tipar

**Impacto:**

- Impossível refatorar com segurança
- IDE autocomplete falha
- Bugs silenciosos (type errors não detectados)
- Onboarding slower (novos devs não sabem tipos esperados)

### 2.3 Erros Específicos (13)

Sem acesso a listagem completa, categorias prováveis:

- Missing imports
- Unused variables
- Circular dependencies
- Invalid JSX syntax
- Async/await issues

---

## 3. Impacto Técnico

| Aspecto          | Antes                      | Depois (Meta)           | Benefício            |
| ---------------- | -------------------------- | ----------------------- | -------------------- |
| Refactoring Cost | 🔴 Alto                    | 🟢 Baixo                | 5x mais rápido       |
| Bug Detection    | 🔴 Baixa                   | 🟢 Alta                 | Menos issues         |
| IDE Support      | 🔴 Pobre                   | 🟢 Excelente            | Dev experience       |
| Onboarding Tempo | 🔴 2+ semanas              | 🟢 5 dias               | Ramp-up mais rápido  |
| CI/CD Trust      | 🔴 Baixa (ignora warnings) | 🟢 Alta (zero warnings) | Qualidade verificada |

---

## 4. Estratégia de Remediação

### Princípio: **Avoid Bikeshedding**

Objetivo NÃO é criar tipos perfeitos. Objetivo é:

1. Remover `any` onde é fácil
2. Documentar `any` estratégico com comentários
3. Não gastar 40h a tipar função pouco usada

---

## 5. Plano em 3 Fases

### **Fase 1: Análise e Priorização (2-3 dias)**

#### Objectivo

Categorizar warnings por:

- Ficheiro
- Tipo
- Esforço
- Impacto

#### Acções

1. **Gerar relatório detalhado:**

   ```bash
   npx eslint . --format json > linting-report.json
   ```

2. **Analisar por ficheiro:**

   ```bash
   cat linting-report.json | jq '.[] | {file: .filePath, errors: (.messages | length)}'
   ```

3. **Categorizar por tipo:**

   ```bash
   cat linting-report.json | jq '.[] | .messages[] | .rule' | sort | uniq -c
   ```

4. **Priorizar por ficheiro crítico:**
   - Ficheiros em hot path (core, merchant-portal)
   - Ficheiros tocados frequentemente (maior ROI de limpeza)

#### Saída

Spreadsheet com:

- Ficheiro
- # de warnings
- Tipos de warnings
- Esforço estimado (1-5 pontos)
- Impacto (High/Medium/Low)

---

### **Fase 2: Remediação Automática (1-2 dias)**

#### Objectivo

Limpar warnings "fáceis" com `eslint --fix`.

#### Acções

1. **Executar fix automático:**

   ```bash
   npx eslint . --fix
   ```

2. **Revisar e validar:**
   - Correr testes (quando funcionarem)
   - Revisar diffs para sanidade
   - Commit: `chore(lint): automatic eslint fixes`

#### Expectativa

- 30-40% dos warnings removidos automaticamente
- Especialmente: unused imports, spacing, formatting

---

### **Fase 3: Remediação Manual (5-10 dias)**

#### Objectivo

Lidar com `any` types que requerem typing.

#### Acções por Categoria

**A. Fácil (1-2 dias):**

```typescript
// ❌ Before
const user: any = fetchUser();

// ✅ After
interface User {
  id: string;
  name: string;
}
const user: User = fetchUser();
```

- Aplicar a ficheiros com <10 warnings
- High-value: `core`, `merchant-portal/src/hooks`

**B. Médio (3-5 dias):**

```typescript
// ❌ Before
function processData(data: any): any { ... }

// ✅ After
function processData(data: OrderPayload): ProcessResult { ... }
```

- Criar tipos inferenciais onde necessário
- Aplicar a funções críticas

**C. Difícil/Documentado (2 dias):**

```typescript
// When legitimate (e.g., JSON parsing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parsed: any = JSON.parse(input); // Type determined at runtime

// Document why
```

- Deixar `any` com comentário justificando
- Exemplo: JSON parsing, external API responses
- Target: <10 strategic `any` remaining

#### Estratégia de Commit

```bash
# Commit em blocos por ficheiro/impacto
git commit -m "refactor(types): remove any from core/Order"
git commit -m "refactor(types): remove any from hooks/usePayment"
git commit -m "refactor(types): document strategic any in parsers"
```

#### Critérios de Aceitação

- [ ] 0 errors (13 → 0)
- [ ] ≤50 warnings (880 → 50)
- [ ] ≤5 strategic `any`
- [ ] All tests pass
- [ ] Git history is clean

---

## 6. Timeline Detalhado

| Fase      | Tarefas                     | Dias          | Saída                     |
| --------- | --------------------------- | ------------- | ------------------------- |
| 1         | Analisar, priorizar         | 2-3           | Relatório + spreadsheet   |
| 2         | ESLint --fix                | 1             | 30-40% warnings removidos |
| 3.A       | Typing fácil (10 ficheiros) | 2             | 50% debt reduzido         |
| 3.B       | Typing médio (20 funções)   | 3             | 80% debt reduzido         |
| 3.C       | Documentar strategic `any`  | 1             | 100% com comentários      |
| **Total** | —                           | **9-11 dias** | Debt <10% do original     |

---

## 7. Regras para Evitar Regressão

### Regra 1: Linting Gate no CI

```yaml
# .github/workflows/lint.yml
- name: Lint
  run: npm run lint

- name: Fail if warnings
  run: |
    count=$(npx eslint . --format json | jq '[.[] | .messages[] | select(.severity == 1)] | length')
    if [ $count -gt 10 ]; then
      echo "Too many warnings: $count"
      exit 1
    fi
```

### Regra 2: No New `any` Policy

```typescript
// ✅ Accepted
const data: OrderData = input;

// ❌ Rejected in PR review
const data: any = input; // Why?!
```

**Processo:**

- PR review checklist: "Any new `any` types?" → No
- If yes: require justification + comment

### Regra 3: Regular Audits

```bash
# Mensal
npm run lint:stats
```

---

## 8. Ferramentas de Suporte

### Automação

**Gerar relatório de debt:**

```bash
#!/bin/bash
# scripts/audit-lint-debt.sh
npx eslint . --format json | jq '
  [
    .[] | {
      file: .filePath,
      lines: (.messages | length),
      rules: (.messages | group_by(.rule) | map({rule: .[0].rule, count: length}))
    }
  ] | sort_by(-.lines)
'
```

**Criar spreadsheet (manual ou Python):**

- Link problema ao Pull Request
- Assign a developer
- Estimate effort
- Track progress

---

## 9. Padrões Comuns de Remediação

### Pattern 1: Event Handlers

```typescript
// ❌ Before
const handleClick = (e: any) => { ... }

// ✅ After
import { MouseEvent, FC } from 'react';
const handleClick: FC<{ onClick: (e: MouseEvent) => void }> = ({ onClick }) => ...
// ou
const handleClick = (e: MouseEvent<HTMLButtonElement>) => { ... }
```

### Pattern 2: API Responses

```typescript
// ❌ Before
const data: any = await fetch("/api/orders").then((r) => r.json());

// ✅ After
interface OrderResponse {
  id: string;
  total: number;
}
const data: OrderResponse = await fetch("/api/orders").then((r) => r.json());
```

### Pattern 3: Props Spreading

```typescript
// ❌ Before
function Card(props: any) {
  return <div {...props}>{props.children}</div>;
}

// ✅ After
interface CardProps extends React.HTMLProps<HTMLDivElement> {
  children: React.ReactNode;
}
function Card({ children, ...rest }: CardProps) {
  return <div {...rest}>{children}</div>;
}
```

---

## 10. Recursos Necessários

- 1-2 developers TypeScript (9-11 dias)
- ESLint + TypeScript setup (já present)
- Code review time (~1h por 5 ficheiros)

---

## 11. Próximos Passos Imediatos

### Semana 1 (24-28 fev)

1. [ ] Executar `npx eslint . --format json > linting-report.json`
2. [ ] Analisar distribuição de warnings
3. [ ] Criar spreadsheet de priorização
4. [ ] Identificar top 5 ficheiros

### Semana 2 (03-07 mar)

1. [ ] Começar Fase 1 (análise detalhada)
2. [ ] Iniciar Fase 2 (ESLint --fix)

---

## 12. Riscos e Mitigação

| Risco                  | Probabilidade | Impacto | Mitigação                     |
| ---------------------- | ------------- | ------- | ----------------------------- |
| Quebrar funcionalidade | Média         | Alto    | Rodar testes após cada batch  |
| Over-typing            | Alta          | Médio   | Code review, avoid perfection |
| Performance hit        | Baixa         | Baixo   | Profile antes/depois          |
| Merge conflicts        | Média         | Médio   | Coordenar com PRs in-flight   |

---

**Status:** Ready for Fase 1 (Análise)
**Depends on:** Jest repair (optional, works in parallel)
**Blocked by:** Nothing

Approver: [Pendente]
