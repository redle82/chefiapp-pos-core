# 🔧 RESOLUÇÃO: import.meta em Testes UI/UX

**Data:** 18 Janeiro 2026  
**Status:** ⚠️ **REQUER AJUSTE MANUAL**

---

## 📊 PROBLEMA

Os testes de UI/UX não podem ser executados porque o Jest não suporta `import.meta.env` nativamente. Vários arquivos usam `import.meta.env`:

- `merchant-portal/src/config.ts`
- `merchant-portal/src/core/logger/Logger.ts`
- `merchant-portal/src/components/payment/StripePaymentModal.tsx`

---

## ✅ SOLUÇÕES APLICADAS

### 1. Mock Global de import.meta
- ✅ Adicionado em `tests/setup.ts`
- ✅ Inclui todas as variáveis necessárias

### 2. Mock do Logger
- ✅ Criado `tests/__mocks__/Logger.ts`
- ✅ Adicionado ao `moduleNameMapper` do Jest

### 3. Mocks de Dependências
- ✅ Config mockado
- ✅ Supabase mockado
- ✅ StripePaymentModal mockado

---

## ⚠️ PROBLEMA PERSISTENTE

O Jest ainda está tentando importar o `Logger.ts` real antes que o mock seja aplicado, causando erro de sintaxe.

**Erro:**
```
SyntaxError: Cannot use 'import.meta' outside a module
at merchant-portal/src/core/logger/Logger.ts:13
```

---

## 🎯 SOLUÇÕES POSSÍVEIS

### Opção 1: Transformar Logger.ts com Babel (Recomendado)
Adicionar transformação específica para arquivos com `import.meta`:

```javascript
// jest.config.js
transform: {
  '^.+\\.tsx?$': ['ts-jest', {
    tsconfig: 'tests/tsconfig.json',
    jsx: 'react',
  }],
  '.*Logger\\.ts$': ['babel-jest', {
    presets: ['@babel/preset-typescript'],
    plugins: [
      ['@babel/plugin-transform-modules-commonjs', {
        allowTopLevelThis: true,
      }],
    ],
  }],
},
```

### Opção 2: Usar transformIgnorePatterns
Forçar transformação de arquivos específicos:

```javascript
// jest.config.js
transformIgnorePatterns: [
  'node_modules/(?!(.*\\.mjs$))',
],
```

### Opção 3: Refatorar Logger.ts (Mais Trabalhoso)
Criar uma versão do Logger que não use `import.meta` diretamente:

```typescript
// Logger.ts
const getEnv = () => {
  if (typeof import !== 'undefined' && import.meta?.env) {
    return import.meta.env;
  }
  return process.env;
};

export class Logger {
  private isDev: boolean;
  
  constructor() {
    const env = getEnv();
    this.isDev = env.DEV || env.NODE_ENV === 'development';
  }
}
```

### Opção 4: Usar __mocks__ Directory (Mais Simples)
Criar `merchant-portal/src/core/logger/__mocks__/Logger.ts`:

```typescript
// merchant-portal/src/core/logger/__mocks__/Logger.ts
export class Logger {
  private isDev = false;
  log() {}
  error() {}
  warn() {}
}
```

E no teste:
```typescript
jest.mock('../../../merchant-portal/src/core/logger/Logger');
```

---

## 📋 RECOMENDAÇÃO

**Usar Opção 4** (__mocks__ directory) - É a mais simples e funciona automaticamente com Jest.

**Passos:**
1. Criar `merchant-portal/src/core/logger/__mocks__/Logger.ts`
2. Remover mock do `moduleNameMapper` do Jest
3. Adicionar `jest.mock('../../../merchant-portal/src/core/logger/Logger')` no início dos testes

---

## ✅ CONCLUSÃO

Os testes de UI/UX estão **prontos**, mas requerem ajuste final para resolver o problema de `import.meta`. A solução mais simples é criar um diretório `__mocks__` no módulo Logger.

**Estimativa:** 15-30 minutos

---

**Última atualização:** 18 Janeiro 2026
