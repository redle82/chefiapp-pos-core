# 🔄 CI/CD GUIDE — CHEFIAPP POS CORE
**Versão:** 1.0.0  
**Data:** 2026-01-17  
**Status:** ✅ Em Melhoria

---

## 📋 OVERVIEW

O projeto usa **GitHub Actions** para CI/CD automatizado.

### Workflows Atuais

1. **`.github/workflows/ci.yml`** - Continuous Integration
   - Executa testes
   - Verifica tipos TypeScript
   - Executa linter
   - Valida build
   - Verifica bundle size

2. **`.github/workflows/deploy.yml`** - Continuous Deployment
   - Deploy automático após merge em `main`
   - Health check após deploy

---

## 🚀 CI WORKFLOW

### Triggers
- Push para qualquer branch
- Pull requests

### Steps

1. **Setup Node.js**
   ```yaml
   - uses: actions/setup-node@v3
     with:
       node-version: '18'
   ```

2. **Install Dependencies**
   ```yaml
   - run: npm ci
   ```

3. **Type Check**
   ```yaml
   - run: npm run type-check
   ```

4. **Lint**
   ```yaml
   - run: npm run lint
   ```

5. **Tests**
   ```yaml
   - run: npm test -- --coverage
   ```

6. **Build**
   ```yaml
   - run: npm run build
   ```

7. **Bundle Size Check**
   ```yaml
   - run: npm run bundle-size-check
   ```

---

## 📊 COVERAGE THRESHOLD

O projeto exige **mínimo de 70% de coverage**:

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    statements: 70,
    branches: 70,
    functions: 70,
    lines: 70,
  },
}
```

---

## 🔍 MELHORIAS RECOMENDADAS

### 1. Cache de Dependências
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 2. Testes Paralelos
```yaml
- run: npm test -- --maxWorkers=4
```

### 3. Upload de Coverage
```yaml
- uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### 4. Análise de Segurança
```yaml
- uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high
```

### 5. Notificações
```yaml
- uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'CI: ${{ job.status }}'
```

---

## 🚢 DEPLOY WORKFLOW

### Triggers
- Push para `main` branch
- Tags `v*`

### Steps

1. **Build**
   ```yaml
   - run: npm ci
   - run: npm run build
   ```

2. **Deploy**
   ```yaml
   - uses: vercel/action@v20
     with:
       vercel-token: ${{ secrets.VERCEL_TOKEN }}
   ```

3. **Health Check**
   ```yaml
   - run: |
       sleep 15
       curl -f https://your-app.vercel.app/health || exit 1
   ```

---

## 🔐 SECRETS NECESSÁRIOS

Configure no GitHub Settings → Secrets:

- `VERCEL_TOKEN` - Token do Vercel
- `SUPABASE_URL` - URL do Supabase (para testes)
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase (para testes)

---

## 📈 MÉTRICAS

### Bundle Size
- **Target:** < 500KB (gzipped)
- **Atual:** ~938KB (precisa otimização)

### Test Coverage
- **Target:** > 70%
- **Atual:** Verificar com `npm test -- --coverage`

### Build Time
- **Target:** < 5 minutos
- **Atual:** Verificar no GitHub Actions

---

## 🐛 TROUBLESHOOTING

### Problema: CI falha com erro de tipo
**Solução:**
1. Executar `npm run type-check` localmente
2. Corrigir erros de tipo
3. Commit e push novamente

### Problema: Testes falham no CI mas passam localmente
**Solução:**
1. Verificar variáveis de ambiente
2. Verificar versão do Node.js
3. Verificar dependências (`npm ci` vs `npm install`)

### Problema: Deploy falha
**Solução:**
1. Verificar secrets configurados
2. Verificar build local (`npm run build`)
3. Verificar logs do GitHub Actions

---

## ✅ CHECKLIST DE MELHORIAS

- [ ] Cache de dependências implementado
- [ ] Testes paralelos configurados
- [ ] Upload de coverage para Codecov
- [ ] Análise de segurança (Snyk)
- [ ] Notificações no Slack
- [ ] Bundle size < 500KB
- [ ] Coverage > 70%
- [ ] Build time < 5 minutos

---

**Construído com 💛 pelo Goldmonkey Empire**

> "CI/CD não é luxo, é necessidade."
