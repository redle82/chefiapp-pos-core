# 📋 Templates de Tickets - Roadmap Multi-Tenant

**Versão:** 1.0  
**Data:** 2026-01-24

---

## 🎯 COMO USAR

1. Copiar template apropriado
2. Preencher informações específicas
3. Criar ticket no GitHub/Notion/Linear
4. Atribuir a pessoa responsável
5. Adicionar à sprint/backlog apropriado

---

## 📝 TEMPLATE EPIC

```markdown
# EPIC: [Nome do Epic]

## Objetivo
[Descrição clara do objetivo do epic]

## Métricas de Sucesso
- [ ] Métrica 1: [valor esperado]
- [ ] Métrica 2: [valor esperado]

## Dependências
- [ ] Epic/Fase: [nome]
- [ ] Task: [ID]

## Risco
- **Nível:** [Alto | Médio | Baixo]
- **Descrição:** [descrição do risco]
- **Mitigação:** [como mitigar]

## Tasks Relacionadas
- [ ] [F1-001] Task 1
- [ ] [F1-002] Task 2

## Critério de Conclusão
- [ ] Todas as tasks concluídas
- [ ] Métricas de sucesso atingidas
- [ ] Documentação atualizada
```

---

## 📝 TEMPLATE TASK (Feature)

```markdown
# [ID] Título Curto

**Tipo:** feature  
**Prioridade:** P0 | P1 | P2 | P3  
**Dono:** dev | owner | manager  
**Fase:** F0 | F1 | F2 | F3 | F4  
**Estimativa:** S (2-4h) | M (4-8h) | L (1-2d)

## Descrição
[Descrição objetiva do que fazer]

## Checklist Técnico
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Critério de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## Arquivos/Pastas
- `caminho/arquivo.ts` (NOVO | modificar)
- `caminho/pasta/` (NOVO | modificar)

## Dependências
- [ ] Task: [ID]

## Notas
[Notas adicionais, suposições, etc.]
```

---

## 📝 TEMPLATE TASK (Infra)

```markdown
# [ID] Título Curto

**Tipo:** infra  
**Prioridade:** P0 | P1 | P2 | P3  
**Dono:** dev  
**Fase:** F0 | F1 | F2 | F3 | F4  
**Estimativa:** S (2-4h) | M (4-8h) | L (1-2d)

## Descrição
[Descrição objetiva do que fazer]

## Checklist Técnico
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Critério de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## Arquivos/Pastas
- `caminho/arquivo.ts` (NOVO | modificar)
- `caminho/pasta/` (NOVO | modificar)

## Configuração Necessária
- [ ] Variável de ambiente: `VAR_NAME`
- [ ] Serviço externo: [nome]
- [ ] Permissões: [descrição]

## Dependências
- [ ] Task: [ID]

## Notas
[Notas adicionais, suposições, etc.]
```

---

## 📝 TEMPLATE TASK (Security)

```markdown
# [ID] Título Curto

**Tipo:** security  
**Prioridade:** P0 | P1 | P2 | P3  
**Dono:** dev  
**Fase:** F0 | F1 | F2 | F3 | F4  
**Estimativa:** S (2-4h) | M (4-8h) | L (1-2d)

## Descrição
[Descrição objetiva do que fazer]

## Checklist Técnico
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Critério de Aceite
- [ ] Critério 1 (segurança)
- [ ] Critério 2 (testes)
- [ ] Critério 3 (validação)

## Arquivos/Pastas
- `caminho/arquivo.ts` (NOVO | modificar)
- `caminho/pasta/` (NOVO | modificar)

## Testes de Segurança
- [ ] Teste de isolamento
- [ ] Teste de vazamento de dados
- [ ] Teste de permissões

## Dependências
- [ ] Task: [ID]

## Notas
[Notas adicionais, suposições, etc.]
```

---

## 📝 TEMPLATE TASK (Ops)

```markdown
# [ID] Título Curto

**Tipo:** ops  
**Prioridade:** P0 | P1 | P2 | P3  
**Dono:** owner | dev  
**Fase:** F0 | F1 | F2 | F3 | F4  
**Estimativa:** S (2-4h) | M (4-8h) | L (1-2d)

## Descrição
[Descrição objetiva do que fazer]

## Checklist Técnico
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Critério de Aceite
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## Scripts/Comandos
```bash
# Comando 1
# Comando 2
```

## Documentação
- [ ] Documentar em: `docs/ops/nome.md`

## Dependências
- [ ] Task: [ID]

## Notas
[Notas adicionais, suposições, etc.]
```

---

## 📝 TEMPLATE TASK (Refactor)

```markdown
# [ID] Título Curto

**Tipo:** refactor  
**Prioridade:** P0 | P1 | P2 | P3  
**Dono:** dev  
**Fase:** F0 | F1 | F2 | F3 | F4  
**Estimativa:** S (2-4h) | M (4-8h) | L (1-2d)

## Descrição
[Descrição objetiva do que fazer]

## Motivação
[Por que este refactor é necessário]

## Checklist Técnico
- [ ] Passo 1
- [ ] Passo 2
- [ ] Passo 3

## Critério de Aceite
- [ ] Critério 1 (funcionalidade mantida)
- [ ] Critério 2 (performance mantida/melhorada)
- [ ] Critério 3 (testes passando)

## Arquivos/Pastas
- `caminho/arquivo.ts` (NOVO | modificar)
- `caminho/pasta/` (NOVO | modificar)

## Testes de Regressão
- [ ] Teste 1
- [ ] Teste 2

## Dependências
- [ ] Task: [ID]

## Notas
[Notas adicionais, suposições, etc.]
```

---

## 📝 TEMPLATE TASK (Bugfix)

```markdown
# [ID] Título Curto

**Tipo:** bugfix  
**Prioridade:** P0 | P1 | P2 | P3  
**Dono:** dev  
**Fase:** F0 | F1 | F2 | F3 | F4  
**Estimativa:** S (2-4h) | M (4-8h) | L (1-2d)

## Descrição
[Descrição do bug]

## Reprodução
1. Passo 1
2. Passo 2
3. Passo 3

## Comportamento Esperado
[O que deveria acontecer]

## Comportamento Atual
[O que está acontecendo]

## Checklist Técnico
- [ ] Identificar causa raiz
- [ ] Implementar fix
- [ ] Adicionar teste para prevenir regressão
- [ ] Validar fix

## Critério de Aceite
- [ ] Bug corrigido
- [ ] Teste adicionado
- [ ] Validação manual passando

## Arquivos/Pastas
- `caminho/arquivo.ts` (modificar)

## Dependências
- [ ] Task: [ID]

## Notas
[Notas adicionais, suposições, etc.]
```

---

## 🎯 EXEMPLOS PRONTOS

### Exemplo 1: F0-001 (Monitoramento)

```markdown
# [F0-001] Setup de Monitoramento Básico

**Tipo:** infra  
**Prioridade:** P0  
**Dono:** dev  
**Fase:** F0  
**Estimativa:** M (4-8h)

## Descrição
Implementar logging estruturado e captura de erros básica usando Sentry

## Checklist Técnico
- [ ] Instalar Sentry: `npx expo install @sentry/react-native`
- [ ] Configurar DSN em variáveis de ambiente
- [ ] Criar `mobile-app/services/logging.ts`
- [ ] Integrar em OrderContext, NowEngine, pagamentos
- [ ] Criar dashboard básico no Supabase

## Critério de Aceite
- [ ] Erros críticos são capturados e alertados
- [ ] Logs são acessíveis para debugging
- [ ] Dashboard básico mostra métricas essenciais

## Arquivos/Pastas
- `mobile-app/services/logging.ts` (NOVO)
- `mobile-app/app/_layout.tsx` (modificar)
- `merchant-portal/src/core/monitoring/` (NOVO)

## Dependências
Nenhuma

## Notas
Sentry DSN precisa ser configurado em variáveis de ambiente
```

---

### Exemplo 2: F1-002 (RLS Policies)

```markdown
# [F1-002] Implementar RLS Policies por Restaurant

**Tipo:** security  
**Prioridade:** P0  
**Dono:** dev  
**Fase:** F1  
**Estimativa:** L (1-2d)

## Descrição
Criar policies RLS que isolam dados por `restaurant_id`

## Checklist Técnico
- [ ] Criar função helper `get_user_restaurant_id()`
- [ ] Criar policies RLS para `gm_restaurants`
- [ ] Criar policies RLS para `gm_orders`
- [ ] Criar policies RLS para `gm_products`
- [ ] Criar policies RLS para `gm_tables`
- [ ] Criar policies RLS para `gm_order_items`
- [ ] Criar policies RLS para `gm_shifts`
- [ ] Criar policies RLS para `gm_tasks`
- [ ] Testar policies com múltiplos restaurantes
- [ ] Validar performance (EXPLAIN ANALYZE)

## Critério de Aceite
- [ ] Policies RLS funcionando
- [ ] Teste de isolamento: restaurante A não vê dados de B
- [ ] Queries performáticas (p95 < 200ms)

## Arquivos/Pastas
- `supabase/migrations/YYYYMMDD_rls_policies.sql` (NOVO)
- `supabase/functions/_shared/get_user_restaurant_id.sql` (NOVO)

## Dependências
- [ ] [F1-001] Auditoria de Tabelas e Tenant ID
- [ ] [F1-003] Tabela de Associação User-Restaurant

## Notas
Testes de isolamento são críticos - não pular esta validação
```

---

## 📊 CHECKLIST DE CRIAÇÃO DE TICKET

Antes de criar ticket, verificar:
- [ ] Template apropriado selecionado
- [ ] Todas as seções preenchidas
- [ ] Dependências identificadas
- [ ] Estimativa realista
- [ ] Critérios de aceite claros
- [ ] Arquivos/pastas identificados
- [ ] Prioridade correta

---

**Versão:** 1.0  
**Data:** 2026-01-24
