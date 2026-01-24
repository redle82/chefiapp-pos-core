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

## 🔍 Code Review

### Checklist

**Funcionalidade:**
- [ ] Código funciona como esperado
- [ ] Testes passando
- [ ] Sem regressões

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
