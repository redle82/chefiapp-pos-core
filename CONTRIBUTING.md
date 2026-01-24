# 🤝 Contributing Guide - ChefIApp

**Guia para contribuir com o projeto**

> ⚠️ **Antes de contribuir, leia o [`ENGINEERING_CONSTITUTION.md`](ENGINEERING_CONSTITUTION.md)**  
> Este documento define as regras inegociáveis do projeto.

---

## 🎯 Como Contribuir

### 1. Fork e Clone
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/chefiapp-pos-core.git
cd chefiapp-pos-core
```

### 2. Branch
```bash
# Criar branch para feature
git checkout -b feature/nova-feature

# Ou para bugfix
git checkout -b fix/corrigir-bug
```

### 3. Desenvolvimento
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm start

# Executar testes
npm test
```

### 4. Commit
```bash
# Commits descritivos
git commit -m "feat: adiciona nova feature X"
git commit -m "fix: corrige bug Y"
git commit -m "docs: atualiza documentação Z"
```

### 5. Push e PR
```bash
# Push para seu fork
git push origin feature/nova-feature

# Criar Pull Request no GitHub
```

---

## 📝 Convenções

### Commits (Conventional Commits)

```
feat: adiciona nova feature
fix: corrige bug
docs: atualiza documentação
style: formatação (não afeta código)
refactor: refatoração
test: adiciona testes
chore: tarefas de manutenção
```

**Exemplos:**
```bash
feat: adiciona integração com iFood
fix: corrige timer do mapa vivo
docs: atualiza API reference
refactor: simplifica FastPayButton
```

### Nomenclatura

**Componentes:**
```typescript
// PascalCase
FastPayButton.tsx
KitchenPressureIndicator.tsx
WaitlistBoard.tsx
```

**Hooks:**
```typescript
// camelCase com "use" prefix
useKitchenPressure.ts
useOrder.ts
useAppStaff.ts
```

**Services:**
```typescript
// PascalCase
PersistenceService.ts
InventoryService.ts
PrinterService.ts
```

**Utils:**
```typescript
// camelCase
getUrgencyColor.ts
calculateTotal.ts
```

---

## 🧪 Testes

### Escrever Testes

```typescript
// __tests__/components/FastPayButton.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { FastPayButton } from '@/components/FastPayButton';

describe('FastPayButton', () => {
  it('deve processar pagamento', async () => {
    // Teste
  });
});
```

### Executar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Cobertura Mínima
- **Componentes críticos:** > 90%
- **Hooks:** > 85%
- **Services:** > 80%
- **Utils:** > 95%

---

## 📚 Documentação

### Atualizar Documentação

Ao adicionar feature:
1. Atualizar `CHANGELOG.md`
2. Atualizar `docs/API_REFERENCE.md` (se necessário)
3. Adicionar exemplo em `docs/CODE_EXAMPLES.md`
4. Atualizar `QUICK_REFERENCE.md` (se relevante)

### Formato

```markdown
## Nova Feature

**Descrição:** Breve descrição

**Uso:**
\`\`\`typescript
// Exemplo de código
\`\`\`

**Props:**
- `prop1`: tipo - descrição
- `prop2`: tipo - descrição
```

---

## 🎨 Code Style

### TypeScript

```typescript
// ✅ Tipos explícitos
interface Props {
  orderId: string;
  total: number;
}

// ✅ Evitar any
const data: unknown = await fetch();
if (isValidData(data)) {
  // usar data tipado
}

// ✅ Nomes descritivos
const elapsedMinutes = calculateElapsed(order);
// ❌ const time = ...
```

### React

```typescript
// ✅ Componentes funcionais
export function FastPayButton({ orderId, total }: Props) {
  // ...
}

// ✅ Hooks no topo
const { orders } = useOrder();
const [state, setState] = useState();

// ✅ useEffect com cleanup
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []);
```

### Imports

```typescript
// ✅ Ordem: externos, internos, relativos
import React from 'react';
import { View, Text } from 'react-native';
import { useOrder } from '@/context/OrderContext';
import { FastPayButton } from '@/components/FastPayButton';
```

---

## 🐛 Reportar Bugs

### Template

```markdown
**Descrição:**
Breve descrição do bug

**Passos para Reproduzir:**
1. Passo 1
2. Passo 2
3. Passo 3

**Comportamento Esperado:**
O que deveria acontecer

**Comportamento Atual:**
O que está acontecendo

**Ambiente:**
- OS: iOS/Android
- Versão: 1.0.0
- Device: iPhone 13 / Pixel 6

**Logs:**
\`\`\`
Logs relevantes
\`\`\`
```

---

## 💡 Sugerir Features

### Template

```markdown
**Feature:**
Nome da feature

**Problema:**
Qual problema resolve

**Solução Proposta:**
Como resolveria

**Alternativas Consideradas:**
Outras opções

**Impacto:**
- Usuários afetados
- Complexidade
- Tempo estimado
```

---

## 📊 Observability

### Logging

```typescript
// ✅ Usar Logger centralizado
import { Logger } from '@/core/logger';

Logger.info('Order created', { orderId, table });
Logger.error('Payment failed', { orderId, error });

// ❌ Evitar console.log em produção
console.log('debug'); // Não fazer isso
```

### Erros

```typescript
// ✅ Capturar exceções com contexto
try {
  await processPayment(order);
} catch (error) {
  Logger.error('Payment error', { orderId: order.id, error });
  throw error; // Re-throw se necessário
}

// ✅ ErrorBoundary em componentes React
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Métricas

```typescript
// ✅ Usar hooks de métricas quando disponíveis
const { metrics, isLoading } = useRealtimeMetrics();
```

---

## 🏛️ Core Development Workflow

> **IMPORTANTE:** Mudanças no Core requerem validação obrigatória via simulador.

### O Que é Considerado Core

- `docker-tests/simulators/`
- `docker-tests/task-engine/`
- `merchant-portal/src/core/`
- `mobile-app/context/` (OrderContext, AppStaffContext)
- `mobile-app/services/` (NowEngine, PersistenceService)
- `supabase/functions/`
- `server/`
- `CORE_MANIFESTO.md`

### Workflow de Desenvolvimento do Core

#### 1. Antes de Começar

```bash
# Ler o CORE_MANIFESTO.md
# Verificar se a mudança viola algum princípio
# Confirmar que o simulador pode exercitar a mudança
```

#### 2. Durante o Desenvolvimento

```bash
cd docker-tests

# Validação rápida (1 min) - Use durante desenvolvimento
make simulate-failfast

# Se passar, continue
# Se falhar, corrija antes de continuar
```

#### 3. Antes de Commit

```bash
cd docker-tests

# Validação completa (5 min) - Obrigatório antes de commit
make simulate-24h-small

# Assertions de integridade
make assertions

# Se ambos passarem, pode commitar
# Se falharem, NÃO commitar até corrigir
```

#### 4. Pull Request

**Requisitos Obrigatórios:**

- ✅ `make simulate-failfast` deve passar (validado automaticamente no CI)
- ✅ `make simulate-24h-small` deve passar (validado automaticamente no CI para PRs em `main` ou `core/frozen-v1`)
- ✅ `make assertions` deve passar (validado automaticamente no CI)
- ✅ CORE_MANIFESTO.md não violado
- ✅ Documentação atualizada (se necessário)

**O CI/CD bloqueará o merge se qualquer validação falhar.**

### Quando Usar Cada Validação

| Situação | Validação | Tempo |
|----------|-----------|-------|
| Durante desenvolvimento | `make simulate-failfast` | ~1 min |
| Antes de commit | `make simulate-24h-small` | ~5 min |
| Antes de merge (main) | `make simulate-24h-small` + `make assertions` | ~5 min |
| Validação completa | `make simulate-24h-large` ou `make simulate-24h-giant` | ~5-7 min |

### Regras Absolutas

1. **Nenhuma mudança no Core sem validação**
   - Se o simulador não exercita, não é Core
   - Código não testado = código morto

2. **Nenhuma violação do CORE_MANIFESTO.md**
   - Qualquer violação é regressão arquitetural
   - Deve ser revertida imediatamente

3. **Nenhuma lógica crítica fora do Core**
   - Governança vive no Core
   - Offline vive no Core
   - SLA vive no Core

4. **UI nunca governa**
   - UI consome Core, não governa
   - UI pode ser reescrita, Core permanece

### Troubleshooting

**Simulador falha:**
1. Verificar `make assertions`
2. Revisar mudanças recentes
3. Consultar `docs/testing/MEGA_OPERATIONAL_SIMULATOR.md`
4. Verificar logs do simulador

**CI/CD falha:**
1. Executar validações localmente
2. Verificar se PostgreSQL está rodando (para CI local)
3. Revisar mudanças que podem ter quebrado o Core
4. Consultar `HANDOFF.md` para troubleshooting

---

## 🔍 Code Review

### Checklist

**Funcionalidade:**
- [ ] Código funciona como esperado
- [ ] Testes passando
- [ ] Sem regressões

**Core (se aplicável):**
- [ ] `make simulate-failfast` passou
- [ ] `make simulate-24h-small` passou (se PR em main/core/frozen-v1)
- [ ] `make assertions` passou
- [ ] CORE_MANIFESTO.md não violado
- [ ] Simulador exercita a mudança

**Código:**
- [ ] Segue convenções
- [ ] Bem documentado
- [ ] Sem código morto
- [ ] Performance OK

**Observability:**
- [ ] Erros capturados com contexto
- [ ] Logs apropriados (info/warn/error)
- [ ] Sem console.log em produção

**Segurança:**
- [ ] Inputs validados
- [ ] Sem dados sensíveis expostos
- [ ] Erros tratados

**Documentação:**
- [ ] README atualizado (se necessário)
- [ ] Changelog atualizado
- [ ] Comentários claros

---

## 🚀 Release Process

### Versão

**Semantic Versioning:**
- `MAJOR.MINOR.PATCH`
- `1.0.0` → `1.0.1` (patch: bugfix)
- `1.0.0` → `1.1.0` (minor: feature)
- `1.0.0` → `2.0.0` (major: breaking)

### Checklist de Release

- [ ] Todos os testes passando
- [ ] Changelog atualizado
- [ ] Version bump
- [ ] Tag criada
- [ ] Release notes escritas
- [ ] Deploy testado

---

## 📞 Contato

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Email:** dev@chefiapp.com

---

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

**Obrigado por contribuir! 🎉**

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
