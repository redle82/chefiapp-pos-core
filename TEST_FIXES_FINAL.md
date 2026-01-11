# 🔧 CORREÇÕES FINAIS DOS TESTES

**Data:** 2026-01-10  
**Status:** Correções aplicadas, algumas pendências identificadas

---

## ✅ CORREÇÕES APLICADAS

### 1. ✅ SystemState Import Corrigido
- **Arquivo:** `merchant-portal/src/core/activation/ActivationAdvisor.ts`
- **Mudança:** `../state/SystemState` → `../state/SystemStateProvider`
- **Status:** ✅ Corrigido

### 2. ✅ Nervous System Imports Corrigidos
- **Arquivo:** `tests/nervous-system/AppStaff.stress.test.ts`
- **Mudança:** `core/nervous-system` → `intelligence/nervous-system`
- **Status:** ✅ Corrigido

### 3. ✅ Tipos Explícitos Adicionados
- **Arquivo:** `tests/property-based.test.ts`
- **Mudança:** Adicionados tipos `string[]`, `string`, `number`
- **Status:** ✅ Corrigido

### 4. ✅ JSX Configurado no Jest
- **Arquivo:** `jest.config.js`
- **Mudança:** Adicionado `jsx: 'react'` no ts-jest
- **Status:** ✅ Corrigido

---

## ⚠️ PENDÊNCIAS IDENTIFICADAS

### 1. AppStaff.stress.test.ts usa Vitest, não Jest

**Problema:**
- Teste usa `import { describe, it, expect, beforeEach, vi } from 'vitest'`
- Teste usa `@testing-library/react` (React Testing Library)
- Jest não suporta vitest diretamente

**Soluções Possíveis:**

**Opção A:** Rodar com Vitest (Recomendado)
```bash
cd merchant-portal
npm run test:e2e  # ou vitest run
```

**Opção B:** Converter para Jest
- Substituir imports de vitest por jest
- Ajustar mocks e helpers
- Tempo: 1-2 horas

**Opção C:** Mover teste para merchant-portal/tests/
- Teste já está em `tests/nervous-system/`
- Pode precisar ajustar caminhos

**Recomendação:** Opção A (rodar com vitest separadamente)

---

### 2. @testing-library/react Conflito de Peer Dependency

**Problema:**
- `@testing-library/react-hooks` requer React 17
- Projeto usa React 19
- Conflito de peer dependency

**Solução:**
- Instalar apenas `@testing-library/react` (sem hooks)
- React 19 tem hooks built-in
- Ou usar `--legacy-peer-deps`

**Status:** ⏳ Tentando instalar com `--legacy-peer-deps`

---

## 📊 RESULTADO ATUAL

**Testes que passam:** 382 (98.5%)  
**Testes que falham:** 6 (1.5%)

**Falhas restantes:**
- AppStaff.stress.test.ts (vitest vs jest)
- Outros testes de integração (event-log, gate5, etc)

---

## 🎯 PRÓXIMOS PASSOS

### Imediato:
1. [ ] Verificar se AppStaff.stress.test.ts deve rodar com vitest
2. [ ] Rodar `cd merchant-portal && npm run test:e2e` para testar
3. [ ] Instalar @testing-library/react com --legacy-peer-deps

### Esta Semana:
4. [ ] Converter AppStaff.stress.test.ts para Jest (se necessário)
5. [ ] Corrigir outros testes de integração que falham
6. [ ] Rodar `npm run test:coverage` para ver cobertura

---

**Status:** 🟡 Correções aplicadas, algumas pendências identificadas
