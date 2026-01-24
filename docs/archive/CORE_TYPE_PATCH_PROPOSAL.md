# CORE TYPE PATCH PROPOSAL

> **Proposta formal de correção de tipos em código FROZEN**
> Data: 2025-12-22
> Versão proposta: 1.0.1-AUDIT

---

## Contexto

Durante a implementação da suíte massiva de auditoria (Gates 0-7), foram identificados 2 erros de tipo em arquivos do core que impedem a execução completa dos testes de Gate 4, Gate 7 e End-to-End.

Estes arquivos estão marcados como FROZEN (não modificáveis) conforme governança do projeto.

---

## Erros Identificados

### Erro 1: `event-log/InMemoryEventStore.ts:71`

**Arquivo:** `event-log/InMemoryEventStore.ts`
**Linha:** 71
**Erro:** `Type 'null' is not assignable to type 'string | undefined'`

**Código atual:**
```typescript
event.hash_prev = null;
```

**Correção proposta:**
```typescript
event.hash_prev = undefined;
```

**Justificativa:**
- O tipo `hash_prev` em `CoreEvent` é definido como `string | undefined`
- `null` não é compatível com `undefined` em TypeScript strict mode
- Semanticamente, `undefined` é mais correto para "ausência de valor anterior"

**Impacto:**
- Nenhum impacto em runtime (ambos são falsy)
- Permite execução do Gate 4 (Atomicity/Concurrency)

---

### Erro 2: `projections/OrderSummaryProjection.ts:36`

**Arquivo:** `projections/OrderSummaryProjection.ts`
**Linha:** 36
**Erro:** `Type 'string | undefined' is not assignable to type 'string'`

**Código atual:**
```typescript
tableId: order.table_id,
```

**Correção proposta:**
```typescript
tableId: order.table_id || '',
```

**Alternativa (mais explícita):**
```typescript
tableId: order.table_id ?? 'NO_TABLE',
```

**Justificativa:**
- `Order.table_id` é definido como `string | undefined` (pedidos podem não ter mesa)
- `ReadOrderSummary.tableId` espera `string`
- Fallback para string vazia é semanticamente correto

**Impacto:**
- Nenhum impacto em runtime para pedidos com mesa
- Pedidos sem mesa terão `tableId: ''` (comportamento explícito)
- Permite execução do Gate 7 (Projections)

---

## Plano de Execução

### Pré-requisitos
- [ ] Aprovação desta proposta
- [ ] Backup do estado atual (tag `pre-audit-patch`)

### Execução
1. Aplicar correção em `InMemoryEventStore.ts`
2. Aplicar correção em `OrderSummaryProjection.ts`
3. Executar `npm run test:pilot` (todos os gates)
4. Executar `npm run audit:report` (relatório completo)
5. Verificar 0 falhas

### Pós-execução
- [ ] Tag `audit-world-v1.0.1`
- [ ] Arquivar relatório de auditoria
- [ ] Atualizar CHANGELOG

---

## Verificação de Impacto

### Gates Afetados pela Correção

| Gate | Antes | Depois |
|------|-------|--------|
| 0-1 | ✅ | ✅ (sem mudança) |
| 2-3 | ✅ | ✅ (sem mudança) |
| 4 | ⚠️ Blocked | ✅ Desbloqueado |
| 5 | ✅ | ✅ (sem mudança) |
| 7 | ⚠️ Blocked | ✅ Desbloqueado |
| E2E | ⚠️ Blocked | ✅ Desbloqueado |

### Testes Esperados Após Correção

- **Total de suites:** 6
- **Total de testes:** ~60+
- **Falhas esperadas:** 0

---

## Assinaturas

**Proposto por:** Claude (Assistente IA)
**Data:** 2025-12-22

**Aprovado por:** _________________
**Data:** _________________

---

## Notas de Auditoria

Esta proposta segue o protocolo de governança do projeto:
1. Erros foram identificados, não criados
2. Código FROZEN não foi modificado sem aprovação
3. Correções são mínimas e cirúrgicas
4. Impacto documentado e verificável
5. Processo reproduzível por terceiros

---

*Documento gerado como parte do MASSIVE_AUDIT_PROTOCOL*
