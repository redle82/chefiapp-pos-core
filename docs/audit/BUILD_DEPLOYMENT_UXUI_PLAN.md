# Build, Deployment & UI/UX Fixes Plan

**Data:** 24 Fevereiro 2026
**Status:** Critical — Blocks Release
**Prioridade:** P2 (Após Fiscal, Jest, Tech Debt)

---

## 1. Panorama Geral

Existem três áreas de instabilidade que impedem deploys confiáveis:

1. **Build Pipeline Fragile** — Random falhas em CI/CD
2. **Deployment Process** — Manual steps, no rollback plan
3. **UI/UX P0 Issues** — 4 critical user-facing bugs

---

## 2. Build Pipeline Instability

### 2.1 Problemas Identificados

**A. Webpack/Vite Configuration Issues**

```bash
# Sintomas
$ npm run build
# Falha intermitente com "Module not found" ou "Circular dependency"
# Passa segunda vez sem mudanças
```

**Causas Prováveis:**

- Caching não determinístico
- Typescript incremental build cache stale
- Node modules symlinks quebrados

**Ficheiros Relevantes:**

- `vite.config.ts` (merchant-portal)
- `webpack.config.js` (se usar webpack)
- `turbo.json` (task orchestration)

**B. Type Checking Failures**

```bash
$ npm run typecheck
# Falha aleatória com erros que não aparecem localmente
```

**Causas:**

- `tsconfig.json` não coerente entre packages
- Incremental flags desincronizadas
- Declaration files (`.d.ts`) não regeneradas

**C. Dependency Resolution Issues**

```bash
$ npm install (ou pnpm install)
# Simlink quebrados
# Monorepo peer dependencies não resolvidas
```

### 2.2 Impacto

| Nível           | Impacto                    | Frequência      |
| --------------- | -------------------------- | --------------- |
| Dev Experience  | Frustração, slow iteration | Diário          |
| CI/CD flakiness | Falsos negatives em PRs    | 2-3x por semana |
| Merge delays    | PRs bloqueadas sem razão   | Semanal         |

---

## 3. Deployment Process Gaps

### 3.1 Problemas

**A. No Automated Rollback**

```bash
# Actual deployment flow
1. Push to main
2. CI builds and tests (hopefully)
3. Manual trigger: "Deploy to production"
4. Pray it works
5. If broken: grep scripts, trial-and-error recovery
```

**Resultado:** 30+ minutos de downtime se algo quebra

**B. Limited Visibility**

- Sem logs estruturados
- Sem metrics durante deploy
- Sem health checks post-deploy

**C. Missing Staging Environment**

- Nenhum lugar para validar antes de production
- Todas as mudanças vão directo para clientes

### 3.2 Impacto

| Cenário                 | Tempo de Recovery | Custo (est.)    |
| ----------------------- | ----------------- | --------------- |
| DB migration falha      | 2+ horas          | €5000+ downtime |
| API incompatível        | 1 hora            | €2000 downtime  |
| Frontend asset quebrado | 30 min            | €1000 downtime  |

---

## 4. UI/UX P0 Issues

### 4.1 Issues Críticas Identificadas

**Baseado em audit report, 4 issues de severidade máxima:**

#### Issue #1: Missing Validation Messages

**Descrição:** Form submission falha silenciosamente
**Symptom:** User submits order → page freezes → nada acontece
**Current:** Erro em console, user vê nada
**Fix:** Toast notification com "Error: [reason]"
**Effort:** 4 pontos (criar toast system, integrar em 5+ formulários)
**Files:** `merchant-portal/src/ui/forms/*`

#### Issue #2: Missing Breadcrumbs/Navigation

**Descrição:** User não sabe onde está na aplicação
**Symptom:** Post login em Staff Home, nenhuma forma de voltar
**Current:** Sem breadcrumbs, botão voltar incompleto
**Fix:** Breadcrumb component + routing fixes
**Effort:** 5 pontos (breadcrumb system, link breadcrumbs a todas as páginas)
**Files:** `merchant-portal/src/layouts/*`, `src/pages/*`

#### Issue #3: Inaccessible Buttons

**Descrição:** Buttons sem sufficient contrast ou labels
**Symptom:** WCAG violations, screen readers não conseguem ler buttons
**Current:** `<button>👍</button>` sem aria-label
**Fix:** Add aria-labels, ensure 4.5:1 contrast ratio
**Effort:** 3 pontos (audit 50+ buttons, add labels)
**Files:** `merchant-portal/src/ui/components/*`, design system

#### Issue #4: Missing Loading States

**Descrição:** Bottões não mudam estado durante API calls
**Symptom:** User clica multiple times, duplica orders
**Current:** Sem disable ou loading spinner
**Fix:** Adicionar loading spinners, disable buttons durante request
**Effort:** 4 pontos (identify async operations, add spinners)
**Files:** `merchant-portal/src/ui/forms/*`, hooks/useAsync

---

## 5. Plano de Remediação

### **Fase 1: Build Pipeline Stabilization (3-5 dias)**

#### Objectivo

`npm run build` e `npm test` executam de forma determinística.

#### Acções

1. **Clear all caches:**

   ```bash
   rm -rf node_modules dist .next .turbo
   rm -rf **/tsconfig.tsbuildinfo
   pnpm install
   npm run build
   ```

2. **Fix TypeScript configuration:**

   - Unificar `tsconfig.json` raiz
   - Cada package herda de base
   - `incremental: false` por agora (rebuild completo)
   - `skipLibCheck: true` for node_modules

3. **Fix Vite/Webpack config:**

   - Cacheing strategy (content hash)
   - Dependency pre-bundling
   - Define env variables correctamente

4. **Create deterministic build script:**

   ```bash
   #!/bin/bash
   # scripts/build-deterministic.sh
   set -e

   echo "Cleaning..."
   rm -rf dist node_modules/.cache

   echo "Building..."
   npm run build

   echo "Verifying..."
   npm run typecheck

   echo "Success!"
   ```

#### Critérios de Aceitação

- `npm run build` passes 10 consecutive times
- Build output is byte-for-byte identical (with timestamps)
- CI passes on first try (no retries)

---

### **Fase 2: Deployment Infrastructure (4-7 dias)**

#### Objectivo

Automated deployments com monitored health + rollback capability.

#### Sub-Phase 2A: Health Checks (1-2 dias)

1. **Create health check endpoints:**

   ```typescript
   // server/endpoints/health.ts
   GET /health → {
     status: 'healthy' | 'degraded' | 'down',
     timestamp: ISO8601,
     checks: {
       database: 'ok',
       authentication: 'ok',
       external_services: 'ok'
     }
   }
   ```

2. **Automated health checks post-deploy:**
   ```bash
   #!/bin/bash
   # scripts/verify-deployment.sh
   for i in {1..30}; do
     if curl -s https://production.chefiapp.com/health | grep healthy; then
       echo "Deployment healthy"
       exit 0
     fi
     sleep 2
   done
   echo "Deployment failed!"
   exit 1
   ```

#### Sub-Phase 2B: Rollback Capability (2-3 dias)

1. **Tag releases:**

   ```bash
   git tag -a v1.2.3 -m "Release 1.2.3"
   git push origin v1.2.3
   ```

2. **Store deployment artifacts:**

   ```bash
   # Each deploy creates timestamped artifact
   release-1.2.3-2026-02-24T10:30:00Z.tar.gz
   ```

3. **Rollback script:**
   ```bash
   #!/bin/bash
   # scripts/rollback.sh <version>
   # Redeploy previous release if health check fails
   ```

#### Sub-Phase 2C: Staging Environment (3-4 dias)

1. **Create staging deployment:**

   - Same infrastructure as production
   - Separate database
   - Accessible via `staging.chefiapp.com`

2. **Pre-production validation:**
   ```bash
   # Deploy to staging first
   # Run smoke tests
   # If green: deploy to production
   ```

#### Critérios de Aceitação

- Automated health checks
- Rollback <5 minutes for single file changes
- Staging environment operational
- No manual deploy steps required

---

### **Fase 3: UI/UX P0 Fixes (3-5 dias)**

#### Objectivo

Todas as 4 issues críticas resolvidas.

**Timeline por Issue:**

**Issue #1: Validation Messages (4 pontos, 1 dia)**

```typescript
// merchant-portal/src/ui/components/FormError.tsx
export const FormError = ({ message }: { message?: string }) => (
  message ? (
    <Toast type="error" message={message} />
  ) : null
);

// Usage in every form
<form onSubmit={async (e) => {
  try {
    await submitOrder();
  } catch (err) {
    showError(err.message); // ← Now visible
  }
}}>
```

1. [ ] Criar Toast component reutilizável
2. [ ] Integrar em 5+ formulários críticos
3. [ ] Testar com manual testing

**Issue #2: Breadcrumbs (5 pontos, 1-2 dias)**

```typescript
// merchant-portal/src/ui/components/Breadcrumb.tsx
export const Breadcrumb = ({ path }: { path: BreadcrumbItem[] }) => (
  <nav>
    {path.map((item, idx) => (
      <a href={item.href} key={idx}>
        {item.label}
        {idx < path.length - 1 ? ' / ' : ''}
      </a>
    ))}
  </nav>
);

// Add to layout
<Layout breadcrumbs={[
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Orders', href: '/admin/orders' }
]}>
```

1. [ ] Criar Breadcrumb component
2. [ ] Add ao layout principal
3. [ ] Link todas rotas

**Issue #3: Accessibility (3 pontos, 1 dia)**

```typescript
// Before
<button>👍</button>

// After
<button aria-label="Approve order" className="text-green-600">
  👍
</button>

// Ensure contrast (use color blindness simulator)
```

1. [ ] Audit todos buttons com WCAG checker
2. [ ] Add aria-labels sistemáticamente
3. [ ] Garantir 4.5:1 contrast

**Issue #4: Loading States (4 pontos, 1 dia)**

```typescript
// merchant-portal/src/hooks/useAsync.ts
export const useAsync = <T, E>(asyncFunction: () => Promise<T>) => {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      return await asyncFunction();
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { execute, loading };
};

// Usage
<button disabled={loading} onClick={handleSubmit}>
  {loading ? "⏳ Processing..." : "Submit"}
</button>;
```

1. [ ] Criar/mejore useAsync hook
2. [ ] Integrar em formulários
3. [ ] Testar com intentional delays

#### Critérios de Aceitação (4 Checklists)

- [ ] **Validation:** All forms show error messages on submit failure
- [ ] **Navigation:** Breadcrumbs visible on every page > home
- [ ] **Accessibility:** WCAG AA compliance (4.5:1 contrast, all buttons labeled)
- [ ] **Loading:** All async buttons show loading state, disabled during request

---

## 6. Timeline Total

| Fase      | Duração       | Dependências | Início |
| --------- | ------------- | ------------ | ------ |
| 1. Build  | 3-5 dias      | Nenhuma      | Dia 1  |
| 2. Deploy | 4-7 dias      | Build OK     | Dia 6  |
| 3. UI/UX  | 3-5 dias      | Paralelo a 2 | Dia 1  |
| **Total** | **7-10 dias** | —            | —      |

---

## 7. Próximos Passos

### Esta Semana (24-28 fev)

1. [ ] Run `npm run build` 10 times, check for flakiness
2. [ ] Document build failures
3. [ ] Create issue tracker for each UI/UX problem
4. [ ] Assign developers

### Próxima Semana (03-07 mar)

1. [ ] Start Fase 1 (build stabilization)
2. [ ] Start Fase 3 (UI/UX issues in parallel)

---

## 8. Resources Required

- 2-3 developers (total 7-10 dias)
- DevOps review (rollback strategy)
- QA for smoke tests
- WCAG 2.1 validator tool

---

## 9. Success Criteria

- ✅ Build passes consistently (10/10 attempts)
- ✅ Staging environment operational
- ✅ Rollback <5 minutes for typical change
- ✅ All 4 UI/UX issues resolved
- ✅ Health checks operational
- ✅ Zero unhandled exceptions in user flows

---

**Status:** Ready for implementation
**Depends on:** Nothing critical (can run in parallel)
**Blocks:** Production-ready release

Approver: [Pendente]
