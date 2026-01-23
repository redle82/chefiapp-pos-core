# ⚔️ CONFLICT POLICY — ChefIApp Conflict Resolution

> **Política explícita de resolução de conflitos quando múltiplas fontes divergem.**

---

## 🎯 Propósito

Este documento define **quem vence, quando, e porquê** em situações de conflito.

Sem política explícita:

- Bugs silenciosos
- Comportamento imprevisível
- Perda de dados não detectada
- Suporte impossível

Com política explícita:

- Decisões determinísticas
- Debug simplificado
- Auditoria possível
- Comportamento previsível

---

## 🏛️ Princípio Fundamental

> **DATABASE_AUTHORITY**: O backend (Supabase) é SEMPRE a fonte final da verdade.

Isso significa:

- Client pode mostrar estado otimista
- Backend pode rejeitar esse estado
- Client deve aceitar correção do backend
- Nunca o contrário

---

## 📋 Matriz de Conflitos

### 1. Conflitos de Timing (Quem Editou Primeiro)

| Cenário                                    | Regra                                       | Justificativa                 |
| ------------------------------------------ | ------------------------------------------- | ----------------------------- |
| Dois garçons editam mesmo pedido           | **Último evento vence** (`last_write_wins`) | Simples, previsível           |
| Dois garçons adicionam item ao mesmo tempo | **Ambos aceitos** (merge aditivo)           | Não há conflito real          |
| Um edita, outro cancela                    | **Cancelamento vence**                      | Ação destrutiva é intencional |
| Dois tentam fechar mesmo pedido            | **Primeiro vence**, segundo falha           | Fechamento é irreversível     |

### 2. Conflitos Offline vs Online

| Cenário                               | Regra                             | Justificativa                       |
| ------------------------------------- | --------------------------------- | ----------------------------------- |
| Ação offline vs mesma ação online     | **Online vence**                  | Online teve informação mais recente |
| Ação offline, nada aconteceu online   | **Offline aceito**                | Não há conflito                     |
| Edição offline, pedido fechado online | **Edição descartada** com log     | Estado final é irreversível         |
| Pagamento offline, pagamento online   | **Ambos aceitos** se soma ≤ total | Pagamentos são aditivos             |
| Pagamento offline excede total        | **Offline rejeitado**             | Invariante PAY-002                  |

### 3. Conflitos de Permissão

| Cenário                                | Regra                                    | Justificativa           |
| -------------------------------------- | ---------------------------------------- | ----------------------- |
| Garçom tenta ação de gerente (offline) | **Rejeitado no sync**                    | RBAC é backend-enforced |
| Token expirou durante offline          | **Eventos enfileirados, não executados** | Requer re-auth          |
| Usuário demitido durante offline       | **Eventos rejeitados**                   | Usuário não existe mais |

### 4. Conflitos de Estado

| Cenário                                 | Regra                           | Justificativa             |
| --------------------------------------- | ------------------------------- | ------------------------- |
| Adicionar item a pedido que foi fechado | **Rejeitado**                   | Invariante ORD-003        |
| Transferir mesa já transferida          | **Segunda transferência vence** | Última intenção prevalece |
| Ocupar mesa já ocupada                  | **Rejeitado**                   | Invariante TBL-002        |
| Dividir conta já paga                   | **Rejeitado**                   | Estado financeiro locked  |

### 5. Conflitos Financeiros

| Cenário                                       | Regra                      | Justificativa                       |
| --------------------------------------------- | -------------------------- | ----------------------------------- |
| Pagamento duplicado (mesmo `idempotency_key`) | **Segundo ignorado**       | Idempotência                        |
| Valor de item alterado após pedido            | **Valor original mantido** | Preço é locked no momento do pedido |
| Desconto aplicado duas vezes                  | **Segundo ignorado**       | Idempotência por `discount_id`      |
| Gorjeta editada                               | **Último valor vence**     | Gorjeta é ajustável                 |

---

## 🔄 Estratégias de Resolução

### 1. Last Write Wins (LWW)

```
Evento A (t=10) + Evento B (t=12) → B vence
```

**Usado para**: Edições simples, campos únicos

### 2. Merge Aditivo

```
Evento A (adiciona item X) + Evento B (adiciona item Y) → X e Y adicionados
```

**Usado para**: Adição de itens, pagamentos parciais

### 3. Primeiro Vence (First Write Wins)

```
Evento A (fecha pedido) + Evento B (fecha pedido) → A vence, B falha
```

**Usado para**: Ações irreversíveis

### 4. Rejeição com Log

```
Evento inválido → Rejeitado + sync.conflict_detected emitido
```

**Usado para**: Violações de invariante

### 5. Evento Compensatório

```
Evento A aconteceu errado → Evento A' (compensação) criado
```

**Usado para**: Estornos, correções

---

## 🚨 Tratamento de Conflitos

### No Client

```typescript
// Quando backend rejeita evento offline
if (response.status === 409) {
  // 1. Log do conflito
  logger.warn("Conflict detected", { event, serverState });

  // 2. Notificar usuário se necessário
  if (isUserActionableConflict(response)) {
    showConflictToast(response.message);
  }

  // 3. Atualizar estado local com verdade do servidor
  await syncEngine.forceRefresh();

  // 4. Remover evento rejeitado da queue
  offlineQueue.discard(event.idempotency_key);
}
```

### No Backend

```typescript
// Ao receber evento que viola invariante
if (violatesInvariant(event)) {
  // 1. Log para auditoria
  await logConflict({
    event,
    reason: "INVARIANT_VIOLATION",
    invariant_id: "ORD-003",
  });

  // 2. Retornar 409 com detalhes
  return new Response(
    JSON.stringify({
      error: "CONFLICT",
      message: "Order is already closed",
      current_state: order.status,
      suggested_action: "REFRESH_AND_RETRY",
    }),
    { status: 409 },
  );
}
```

---

## 📊 Métricas de Conflito

Monitorar:

- `conflict_count_per_hour`
- `conflict_type_distribution`
- `conflict_resolution_time_ms`
- `user_impacted_conflicts`

Alertar se:

- `conflict_rate > 5%` de eventos
- Mesmo usuário com >3 conflitos/hora
- Conflitos financeiros (qualquer um)

---

## 🔍 Debug de Conflitos

### Query para investigar

```sql
SELECT
  e1.id as rejected_event,
  e1.type,
  e1.occurred_at,
  e1.actor_id,
  e2.id as conflicting_event,
  e2.type as conflicting_type,
  e2.occurred_at as conflicting_at
FROM domain_events e1
JOIN domain_events e2
  ON e1.aggregate_id = e2.aggregate_id
  AND e1.id != e2.id
  AND e1.type = 'sync.conflict_detected'
WHERE e1.aggregate_id = $order_id
ORDER BY e1.occurred_at;
```

### Informações para suporte

1. `order_id` afetado
2. Timestamp do conflito
3. Ação tentada vs estado atual
4. Dispositivo/usuário envolvido
5. Se estava offline

---

## ✅ Checklist de Implementação

- [ ] Todos os handlers de evento verificam conflitos
- [ ] Conflitos sempre logados com `conflict_detected` event
- [ ] UI mostra feedback claro em caso de rejeição
- [ ] Métricas de conflito implementadas
- [ ] Alert para conflitos financeiros

---

## 📚 Referências

- [BUSINESS_INVARIANTS.md](./BUSINESS_INVARIANTS.md)
- [EVENT_MODEL.md](./EVENT_MODEL.md)
- [SyncEngine.ts](../merchant-portal/src/core/sync/SyncEngine.ts)
