# 📐 Architecture Decision Records (ADR) - ChefIApp Multi-Tenant

**Versão:** 1.0  
**Data:** 2026-01-24

---

## 🎯 OBJETIVO

Documentar decisões arquiteturais importantes do roadmap multi-tenant para referência futura e evitar retrabalho.

---

## 📋 ADR-001: Single Database com RLS (Row Level Security)

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Escalar de 1 para 500 restaurantes

### Decisão
Usar **Single Database com Row Level Security (RLS)** do Supabase, ao invés de multi-database ou schema-per-tenant.

### Alternativas Consideradas
1. **Multi-Database** (1 banco por restaurante)
   - ❌ Complexidade operacional alta
   - ❌ Custo elevado
   - ❌ Manutenção difícil

2. **Schema-per-Tenant** (1 schema por restaurante)
   - ❌ Limite de schemas no PostgreSQL
   - ❌ Migrations complexas
   - ❌ Queries cross-tenant difíceis

3. **Single Database com RLS** ✅
   - ✅ Simplicidade operacional
   - ✅ Custo eficiente
   - ✅ RLS nativo do Supabase
   - ✅ Escalável até 500+ restaurantes

### Consequências
- **Positivas:**
  - Operação simplificada
  - Custo eficiente
  - Manutenção centralizada
  - RLS garante isolamento automático

- **Negativas (Mitigadas):**
  - Performance: Mitigado com índices e caching (Fase 3)
  - Escala: Mitigado com otimizações (Fase 4)

### Validação
- Testes de isolamento automatizados
- Performance validada com 100 restaurantes (Fase 3)
- Escalabilidade validada com 500 restaurantes (Fase 4)

---

## 📋 ADR-002: restaurant_id como Tenant ID

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Modelagem de dados multi-tenant

### Decisão
Usar `restaurant_id` diretamente como tenant_id, **sem criar camada extra** de `tenant_id` ou `saas_tenants`.

### Alternativas Consideradas
1. **Camada `saas_tenants` separada**
   - ❌ Complexidade desnecessária
   - ❌ Join extra em todas as queries
   - ❌ Confusão entre tenant e restaurant

2. **`restaurant_id` como tenant_id** ✅
   - ✅ Simplicidade
   - ✅ Performance (menos joins)
   - ✅ Fácil de entender

### Consequências
- **Positivas:**
  - Modelo simples e claro
  - Queries mais rápidas (menos joins)
  - Fácil de entender e manter

- **Negativas:**
  - Futuro multi-location pode precisar ajuste (mas `restaurant_id` pode referenciar grupo)

### Validação
- Modelo validado em Fase 1
- Performance validada em Fase 2-3

---

## 📋 ADR-003: RLS desde Fase 1 (Não Depois)

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Segurança e isolamento

### Decisão
Implementar **RLS (Row Level Security) desde a Fase 1**, não adiar para fases posteriores.

### Alternativas Consideradas
1. **RLS depois (Fase 2-3)**
   - ❌ Risco de vazamento de dados
   - ❌ Retrabalho massivo
   - ❌ Dificuldade de adicionar depois

2. **RLS desde Fase 1** ✅
   - ✅ Segurança desde o início
   - ✅ Evita retrabalho
   - ✅ Testes de isolamento desde cedo

### Consequências
- **Positivas:**
  - Segurança garantida desde o início
  - Testes de isolamento desde Fase 1
  - Evita retrabalho massivo

- **Negativas:**
  - Complexidade inicial maior
  - Requer testes rigorosos

### Validação
- Testes de isolamento passando desde Fase 1
- Zero vazamentos de dados em produção

---

## 📋 ADR-004: Índices em restaurant_id desde o Início

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Performance em escala

### Decisão
Criar **índices em `restaurant_id` desde a Fase 1**, não adiar para quando performance degradar.

### Alternativas Consideradas
1. **Índices depois (quando necessário)**
   - ❌ Performance degradada antes de corrigir
   - ❌ Criar índices em produção pode causar locks
   - ❌ Queries lentas afetam usuários

2. **Índices desde Fase 1** ✅
   - ✅ Performance garantida desde o início
   - ✅ Evita degradação
   - ✅ Criar índices em dados pequenos é rápido

### Consequências
- **Positivas:**
  - Performance garantida
  - Evita degradação
  - Criar índices em dados pequenos é rápido

- **Negativas:**
  - Espaço adicional (mínimo)
  - Write performance ligeiramente menor (aceitável)

### Validação
- Performance validada em Fase 1-2
- Queries < 200ms desde Fase 1

---

## 📋 ADR-005: Logging Estruturado desde Fase 0

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Observabilidade e debugging

### Decisão
Implementar **logging estruturado desde a Fase 0**, não adiar.

### Alternativas Consideradas
1. **Logging depois (Fase 2-3)**
   - ❌ Debugging impossível em produção
   - ❌ Perda de contexto de problemas
   - ❌ Difícil adicionar depois

2. **Logging desde Fase 0** ✅
   - ✅ Debugging possível desde o início
   - ✅ Contexto completo de problemas
   - ✅ Fácil de expandir depois

### Consequências
- **Positivas:**
  - Debugging possível desde o início
  - Contexto completo (restaurant_id, user_id, action)
  - Base para observabilidade completa

- **Negativas:**
  - Custo de storage (mínimo)
  - Overhead de logging (aceitável)

### Validação
- Logs acessíveis desde Fase 0
- Debugging de problemas facilitado

---

## 📋 ADR-006: Billing desde Fase 2 (Não Adiar)

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Receita e sustentabilidade

### Decisão
Implementar **billing básico desde a Fase 2**, não adiar para Fase 3-4.

### Alternativas Consideradas
1. **Billing depois (Fase 3-4)**
   - ❌ Perda de receita
   - ❌ Dificuldade de cobrar retroativamente
   - ❌ Risco financeiro

2. **Billing desde Fase 2** ✅
   - ✅ Receita desde cedo
   - ✅ Validação de modelo de negócio
   - ✅ Base para expansão

### Consequências
- **Positivas:**
  - Receita desde cedo
  - Validação de modelo
  - Base para expansão

- **Negativas:**
  - Complexidade adicional
  - Requer integração Stripe

### Validação
- Billing funcionando desde Fase 2
- Taxa de sucesso > 95%

---

## 📋 ADR-007: Observabilidade desde Fase 2 (Não Adiar)

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Operação e debugging em escala

### Decisão
Implementar **observabilidade mínima desde a Fase 2**, expandir para completa na Fase 3.

### Alternativas Consideradas
1. **Observabilidade depois (Fase 3-4)**
   - ❌ Debugging impossível em escala
   - ❌ Problemas não detectados
   - ❌ SLA difícil de manter

2. **Observabilidade desde Fase 2** ✅
   - ✅ Debugging possível em escala
   - ✅ Detecção precoce de problemas
   - ✅ Base para observabilidade completa

### Consequências
- **Positivas:**
  - Debugging possível em escala
  - Detecção precoce
  - Base para expansão

- **Negativas:**
  - Custo de ferramentas (aceitável)
  - Complexidade adicional

### Validação
- Observabilidade funcionando desde Fase 2
- Problemas detectados em < 5 min

---

## 📋 ADR-008: Testes de Isolamento desde Fase 1

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Segurança e isolamento

### Decisão
Implementar **testes automatizados de isolamento desde a Fase 1**, executar antes de cada deploy.

### Alternativas Consideradas
1. **Testes depois ou manuais**
   - ❌ Risco de vazamento não detectado
   - ❌ Testes manuais não escalam
   - ❌ Falhas só detectadas em produção

2. **Testes automatizados desde Fase 1** ✅
   - ✅ Vazamentos detectados antes de deploy
   - ✅ Testes escalam
   - ✅ Confiança em cada deploy

### Consequências
- **Positivas:**
  - Segurança garantida
  - Confiança em deploys
  - Testes escalam

- **Negativas:**
  - Tempo adicional em CI/CD (aceitável)
  - Manutenção de testes

### Validação
- Testes passando desde Fase 1
- Zero vazamentos em produção

---

## 📋 ADR-009: Automação desde Fase 3 (Não Adiar)

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Operação escalável

### Decisão
Implementar **automação completa desde a Fase 3**, não adiar para Fase 4.

### Alternativas Consideradas
1. **Automação depois (Fase 4)**
   - ❌ Operação manual não escala
   - ❌ Erros humanos
   - ❌ Tempo gasto em tarefas repetitivas

2. **Automação desde Fase 3** ✅
   - ✅ Operação escalável
   - ✅ Redução de erros
   - ✅ Tempo focado em valor

### Consequências
- **Positivas:**
  - Operação escalável
  - Redução de erros
  - Tempo focado em valor

- **Negativas:**
  - Complexidade inicial
  - Requer manutenção

### Validação
- Automação funcionando desde Fase 3
- Tempo de operação reduzido em 80%

---

## 📋 ADR-010: Documentação desde o Início

**Data:** 2026-01-24  
**Status:** ✅ Aprovado  
**Contexto:** Conhecimento e continuidade

### Decisão
Manter **documentação completa desde o início**, não adiar.

### Alternativas Consideradas
1. **Documentação depois**
   - ❌ Conhecimento perdido
   - ❌ Onboarding difícil
   - ❌ Decisões esquecidas

2. **Documentação desde o início** ✅
   - ✅ Conhecimento preservado
   - ✅ Onboarding facilitado
   - ✅ Decisões documentadas

### Consequências
- **Positivas:**
  - Conhecimento preservado
  - Onboarding facilitado
  - Decisões documentadas (ADR)

- **Negativas:**
  - Tempo adicional (mas vale a pena)
  - Manutenção de documentação

### Validação
- Documentação completa desde Fase 0
- Onboarding de novos devs facilitado

---

## 📊 RESUMO DAS DECISÕES

| ADR | Decisão | Fase | Impacto |
|-----|---------|------|---------|
| ADR-001 | Single DB + RLS | F1 | Alto |
| ADR-002 | restaurant_id como tenant_id | F1 | Médio |
| ADR-003 | RLS desde Fase 1 | F1 | Crítico |
| ADR-004 | Índices desde Fase 1 | F1 | Alto |
| ADR-005 | Logging desde Fase 0 | F0 | Médio |
| ADR-006 | Billing desde Fase 2 | F2 | Alto |
| ADR-007 | Observabilidade desde Fase 2 | F2 | Alto |
| ADR-008 | Testes desde Fase 1 | F1 | Crítico |
| ADR-009 | Automação desde Fase 3 | F3 | Médio |
| ADR-010 | Documentação desde início | F0 | Médio |

---

## 🔄 REVISÃO DE DECISÕES

### Quando Revisar
- A cada fase concluída
- Quando métricas indicarem problema
- Quando nova informação disponível

### Processo de Revisão
1. Avaliar decisão atual
2. Considerar alternativas
3. Documentar mudança (se houver)
4. Atualizar ADR

---

**Versão:** 1.0  
**Data:** 2026-01-24
