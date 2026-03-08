# Diagnóstico e Plano de Remediação da Suite de Testes

**Data:** 24 Fevereiro 2026
**Status:** Crítico — Impede Validação Contínua
**Prioridade:** P0 (Máxima após Fiscal)

---

## 1. Situação Atual

A suite de testes unitários está **completamente quebrada**. A execução falha devido a:

- Configuração incorrecta do Jest
- Conflito entre `jest` e `vitest`
- Erros de ambiente (`window is not defined`)
- Ficheiro de setup ausente ou incorrecto

**Evidência:**

```bash
$ npm test
# Jest tenta executar mas falha com erros de ambiente
```

---

## 2. Problemas Identificados

### 2.1 Configuração do Jest

**Ficheiros:**

- `jest.config.js`
- `jest.server-coverage.config.js`

**Problemas:**

1. Ambiente não está configurado como `jsdom` para testes que precisam de DOM
2. `setup-jsdom.js` aparentemente incorrecto ou ausente
3. Transform TypeScript não está correctamente configurado para todos os ficheiros

**Impacto:**

- `window is not defined` ao importar ficheiros que assumem browser
- Testes não conseguem executar
- Cobertura não é calculada

### 2.2 Conflito de Runners

**Situação:**

- Codebase define `jest` como test runner principal
- `merchant-portal` usa `vitest`
- Ambos tentam interoperar → conflito

**Impacto:**

- Confusão sobre qual runner usar
- Incompatibilidade de configs
- Diferentes resultados entre repositório root e pacotes

### 2.3 Ficheiro de Setup Ausente ou Incorrecto

**Ficheiro esperado:**

- `jest.setup.js` ou similar referenciado em `jest.config.js`

**Problema:**

- Se referenciado mas não existe → erro imediato
- Se não existe: `window`, `document`, etc. não estão disponíveis

---

## 3. Impacto

| Aspecto                 | Severidade | Impacto                                 |
| ----------------------- | ---------- | --------------------------------------- |
| Validação de regressões | Crítica    | Impossível detectar bugs                |
| CI/CD gate              | Crítica    | Bloqueador para merge                   |
| Confiança no código     | Alta       | Developers não sabem se código funciona |
| Cobertura               | Alta       | Métrica impossível de calcular          |

---

## 4. Plano de Remediação

### **Fase 1: Diagnóstico Detalhado (1 dia)**

#### Objectivo

Identificar exactamente o que está quebrado e por quê.

#### Acções

1. **Analisar configuração do Jest:**

   - Executar `jest --showConfig` e analisar output
   - Verificar se `jest.setup.js` está referenciado e existe
   - Confirmar que `testEnvironment: 'jsdom'` está presente

2. **Testar configuração mínima:**

   - Criar ficheiro de teste simples
   - Executar `jest` e capturar erro exacto
   - Documentar stack trace

3. **Revisar conflito vitest/jest:**
   - Listar todos os ficheiros de config de teste
   - Decidir: jest para root + vitest para merchant-portal, ou unificar?

#### Saída Esperada

Documento com diagnóstico exacto e lista de erros específicos.

---

### **Fase 2: Reparação de Configuração (3-5 dias)**

#### Objectivo

Fazer `npm test` executar com sucesso.

#### Acções

1. **Criar/Corrigir `jest.setup.js`:**

   ```javascript
   // jest.setup.js
   // Mock do window/document para environment de servidor
   // Setup de bibliotecas de teste (Testing Library)
   // Configuração de timeouts
   ```

2. **Corrigir `jest.config.js`:**

   - Adicionar `testEnvironment: 'jsdom'` se necessário
   - Configurar `setupFiles` e `setupFilesAfterEnv`
   - Definir `transform` correctamente para TS

3. **Resolver conflito vitest/jest:**
   - **Opção A (recomendado):** Jest para root, Vitest para merchant-portal
     - Documentar cada um
     - Criar script unificado de teste
   - **Opção B:** Migrar tudo para Vitest (mais moderno)
     - Maior effort, mas arquitectura mais simples

#### Critérios de Aceitação

- `npm test` executa até ao fim (mesmo que alguns testes falhem)
- Stack trace é legível (não erros de setup)
- Pelo menos 50% dos testes passam

---

### **Fase 3: Correcção de Testes (5-10 dias)**

#### Objectivo

Todos os testes na suite passam com sucesso.

#### Acções

1. **Identificar testes falhando:**

   - Executar `npm test` e catalogar cada falha
   - Agrupar por causa (mock faltando, async issue, etc.)

2. **Corrigir por categoria:**

   - **Importações faltando:** Adicionar mocks necessários
   - **Async/await:** Corrigir com proper `async`/`await` e `done` callbacks
   - **Componentes React:** Garantir que Testing Library está setup
   - **Servidor/HTTP:** Mockar chamadas com `http.MockAdapter` ou similar

3. **Criar testes de fumaça focados:**
   - Que cada package cumpre responsabilidade básica
   - Que interfaces principais não estão quebradas

#### Critérios de Aceitação

- `npm test` passa com 100% sucesso
- Cobertura mínima de 50% para ficheiros críticos
- CI/CD gate de testes passa

---

### **Fase 4: Integração Contínua (2-3 dias)**

#### Objectivo

Garantir que testes correm automaticamente em cada commit.

#### Acções

1. **Configurar GitHub Actions:**

   - Ficheiro `.github/workflows/test.yml`
   - Executar `npm test` em cada PR
   - Bloquear merge se testes falham

2. **Documentação:**
   - README de testes (como correr localmente)
   - Troubleshooting comum

#### Critérios de Aceitação

- GitHub Actions executa e reporta status
- PRs não podem ser mergeados sem testes verdes

---

## 5. Timeline Estimado

| Fase           | Duração        | Dependências           | Início |
| -------------- | -------------- | ---------------------- | ------ |
| 1. Diagnóstico | 1 dia          | Nenhuma                | Dia 1  |
| 2. Reparação   | 3-5 dias       | Diagnóstico (Fase 1)   | Dia 2  |
| 3. Correcção   | 5-10 dias      | Config ok (Fase 2)     | Dia 7  |
| 4. CI Setup    | 2-3 dias       | Testes passam (Fase 3) | Dia 17 |
| **Total**      | **11-19 dias** | —                      | —      |

---

## 6. Próximos Passos Imediatos

### Esta Semana (24-28 fev)

1. [ ] Executar `jest --showConfig` e documentar output
2. [ ] Tentar executar teste simples e capturar erro
3. [ ] Revisar `jest.config.js` e `jest.setup.js` (já existe?)
4. [ ] Decidir: unificar ou separar jest/vitest?

### Próxima Semana (03-07 mar)

1. [ ] Iniciar Fase 1 (diagnóstico completo)
2. [ ] Começar Fase 2 (reparação de config)

---

## 7. Recursos Necessários

- 1 developer TypeScript/Node (20-25 dias)
- Acesso a GitHub Actions
- Documentação de Jest e Vitest (online)

---

## 8. Notas

- Este problema **bloqueia** a validação de qualquer novo código
- Correlaciona com os 880+ linting warnings (sem testes, warnings não são apanhados no CI)
- Deve ser resolvido em paralelo com remediação fiscal (não é dependência)

---

**Aprovado por:** [Pendente]
**Data de revisão:** 01 Março 2026
