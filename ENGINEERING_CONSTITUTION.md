# ⚖️ ENGINEERING CONSTITUTION — ChefIApp

> **O Sistema Operacional da Engenharia ChefIApp.**
> Effective immediately. **Mandatory. Non-negotiable.**

---

## PREÂMBULO

Este documento define as regras absolutas que governam o desenvolvimento do ChefIApp.

**Violação = Incidente Crítico.**

Não são guidelines. São leis.

---

## PARTE I — PRINCÍPIOS FUNDAMENTAIS

### Art. 1. Hierarquia de Autoridade

```
DATABASE > BACKEND > FRONTEND > UI
```

1. **DATABASE_AUTHORITY**: O banco de dados é a única fonte da verdade final.
2. **Backend valida**: Toda regra de negócio é enforced no backend.
3. **Frontend projeta**: A UI é uma projeção do estado, não a autoridade.
4. **Client nunca decide**: Permissões, preços e estados finais vêm do servidor.

### Art. 2. Definição de "Feito"

Um trabalho só está **FEITO** quando:

- [x] Código commitado (`git status` limpo)
- [x] Build passa sem erros
- [x] Deployed ou com justificativa explícita
- [x] Documentação atualizada se necessário

**"Quase pronto" = "Não feito"**

### Art. 3. Reversibilidade Absoluta

Nada entra no sistema que não possa ser revertido.

- Migrações têm rollback
- Features têm feature flags
- Deploys têm rollback imediato

---

## PARTE II — INVARIANTES ABSOLUTAS

> **Regras que NUNCA podem ser violadas, independente do contexto.**

### Art. 4. Invariantes de Pedidos

| ID      | Invariante                                   |
| ------- | -------------------------------------------- |
| ORD-001 | Pedido não existe sem `restaurant_id` válido |
| ORD-003 | Pedido fechado é **IMUTÁVEL**                |
| ORD-005 | `idempotency_key` garante criação única      |

### Art. 5. Invariantes Financeiras

| ID      | Invariante                                          |
| ------- | --------------------------------------------------- |
| PAY-001 | Pagamento não pode ser aplicado duas vezes          |
| PAY-002 | Soma de pagamentos ≤ total do pedido                |
| FIN-001 | Fechamento de caixa é **IRREVERSÍVEL**              |
| FIN-003 | **Offline NUNCA altera financeiro já sincronizado** |

### Art. 6. Invariantes de Sincronização

| ID      | Invariante                                 |
| ------- | ------------------------------------------ |
| SYN-001 | Backend é SEMPRE a fonte final             |
| SYN-003 | Conflito nunca resulta em perda silenciosa |
| SYN-004 | Replay respeita ordem cronológica          |

**📚 Referência completa**: [BUSINESS_INVARIANTS.md](docs/BUSINESS_INVARIANTS.md)

---

## PARTE III — CLÁUSULAS DE SEGURANÇA

### Art. 7. RBAC Violation = Incidente Crítico

```typescript
if (rbac_violation_count > 0) {
  status = "CRITICAL";
  action = "STOP_DEPLOY";
}
```

**Consequências de violação RBAC**:

1. 🚨 Alerta imediato no Conflict Dashboard
2. ⛔ Deploy bloqueado até resolução
3. 📝 Postmortem obrigatório

### Art. 8. Conflito Financeiro = Postmortem Obrigatório

Qualquer conflito envolvendo:

- Pagamentos
- Fechamento de caixa
- Totais de pedido

**Exige**:

- Investigação documentada
- Root cause identificado
- Correção commitada

### Art. 9. Política de Conflitos

| Cenário                             | Quem Vence                      |
| ----------------------------------- | ------------------------------- |
| Dois garçons editam pedido          | Último evento                   |
| Offline vs Online                   | Online vence                    |
| Ação offline, pedido fechado online | Offline descartado              |
| Pagamento duplicado                 | Segundo ignorado (idempotência) |

**📚 Referência completa**: [CONFLICT_POLICY.md](docs/CONFLICT_POLICY.md)

---

## PARTE IV — GOVERNANÇA DE QUALIDADE

### Art. 10. Teste Universal é Obrigatório

**Nenhum cliente entra em produção sem passar FASE 4 (Offline Total).**

| Fase     | Obrigatório Para |
| -------- | ---------------- |
| FASE 0   | Todo deploy      |
| FASE 1-2 | Todo deploy      |
| FASE 3-4 | Cliente novo     |
| FASE 5-6 | Release major    |
| FASE 7   | Antes de escalar |

**📚 Referência**: [UNIVERSAL_TEST_PLAN.md](docs/testing/UNIVERSAL_TEST_PLAN.md)

### Art. 11. Conflict Dashboard é Fonte de Verdade

O dashboard de conflitos:

- É monitorado continuamente
- Define health do sistema
- Gera alertas automáticos

**Limites de alerta**:
| Métrica | Limite | Ação |
|---------|--------|------|
| RBAC violations | > 0 | CRÍTICO |
| Conflict rate | > 5% | DEGRADED |
| Sync conflicts/24h | > 10 | DEGRADED |

---

## PARTE V — FLUXO OPERACIONAL

### Art. 12. Daily Flow Padrão

```bash
1. git pull                    # Sync com realidade
2. Implementar                 # Mudar realidade
3. npm run typecheck && npm run build  # Verificar
4. git commit                  # Salvar
5. Deploy                      # Entregar
6. Atualizar PROXIMOS_PASSOS.md
```

### Art. 13. Commit Convention

```
type(scope): description

Tipos: feat, fix, docs, refactor, test, chore
```

### Art. 14. Clean State Law

**Não pode declarar tarefa terminada com `git status` dirty.**

---

## PARTE VI — HIGIENE DE CÓDIGO

### Art. 15. Proibições Absolutas

- ❌ Commit de `*.log` ou debug dumps
- ❌ Código comentado (Git tem histórico)
- ❌ `console.log` em produção (use Logger)
- ❌ Arquivos temporários no repo
- ❌ Secrets hardcoded

### Art. 16. Padrões Obrigatórios

- ✅ TypeScript strict mode
- ✅ ESLint sem warnings
- ✅ Imports absolutos organizados
- ✅ Error boundaries em componentes críticos

---

## PARTE VII — PROTEÇÃO DO SISTEMA

### Art. 17. Quem Pode Usar ChefIApp

Critérios mínimos para cliente:

1. Restaurante real com operação física
2. Disposição para treinar equipe
3. Aceitar que offline não altera financeiro fechado
4. Entender que backend é autoridade

**Cliente que não aceita as regras = Cliente que não entra.**

### Art. 18. O Que Não Fazemos

- ❌ Permitir fraude de permissão
- ❌ Sobrescrever financeiro fechado
- ❌ Ignorar conflitos silenciosamente
- ❌ Deploiar sem passar testes mínimos

---

## PARTE VIII — ENFORCEMENT

### Art. 19. Violação = Incidente

| Tipo de Violação    | Severidade | Ação                    |
| ------------------- | ---------- | ----------------------- |
| Invariante quebrada | CRÍTICO    | Parar desenvolvimento   |
| RBAC violation      | CRÍTICO    | Bloquear deploy         |
| Conflito financeiro | GRAVE      | Postmortem              |
| Lint/Type error     | MÉDIO      | Corrigir antes de merge |
| Clean state dirty   | BAIXO      | Não pode declarar done  |

### Art. 20. Postmortem Obrigatório

Incidentes críticos exigem:

1. Timeline do ocorrido
2. Root cause analysis
3. Correção implementada
4. Medidas preventivas
5. Documento arquivado em `docs/incidents/`

---

## ASSINATURAS

Este documento é lei.

Última atualização: **2026-01-23**

---

## REFERÊNCIAS

| Documento                                                                                      | Propósito                |
| ---------------------------------------------------------------------------------------------- | ------------------------ |
| [BUSINESS_INVARIANTS.md](docs/BUSINESS_INVARIANTS.md)                                          | 26 invariantes absolutas |
| [EVENT_MODEL.md](docs/EVENT_MODEL.md)                                                          | 35+ eventos de domínio   |
| [CONFLICT_POLICY.md](docs/CONFLICT_POLICY.md)                                                  | Matriz de resolução      |
| [UNIVERSAL_TEST_PLAN.md](docs/testing/UNIVERSAL_TEST_PLAN.md)                                  | Plano de teste soberano  |
| [ConflictMetricsDashboard.tsx](merchant-portal/src/pages/Reports/ConflictMetricsDashboard.tsx) | Dashboard de conflitos   |
