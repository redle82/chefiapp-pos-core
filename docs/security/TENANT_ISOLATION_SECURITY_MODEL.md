# TENANT_ISOLATION_SECURITY_MODEL (ChefIApp)

## 0. Objetivo

Garantir **zero vazamento** de dados entre diferentes restaurantes (tenants). O isolamento é a base da confiança técnica e jurídica do ChefIApp.

---

## 1. As 15 Regras de Ouro (Golden Rules)

### Camada de Dados (Data Plane)

1.  **Onipresença do Tenant ID**: Toda tabela multi-tenant DEVE possuir a coluna `restaurant_id`.
2.  **Soberania do Servidor**: O `restaurant_id` é sempre derivado pelo Backend via Auth Context. Nunca confiar no ID enviado pelo Cliente em operações de escrita.
3.  **Integridade Referencial**: Chaves estrangeiras (FKs) e índices compostos `(restaurant_id, ...)` são obrigatórios para evitar drift e garantir performance.
4.  **Fail-Closed Design**: Na dúvida de resolução de tenant, o sistema bloqueia (403). Nunca assume um tenant padrão sem prova de membership.

### Segurança de Banco (Postgres/Supabase RLS)

5.  **RLS Hardened**: RLS ativado em 100% das tabelas multi-tenant. Sem exceção.
6.  **Políticas por Papel**: `Owner`, `Manager`, `Waiter` e `KDS` possuem políticas de leitura/escrita granulares via RLS.
7.  **Soberania das Membresias**: A tabela `gm_restaurant_members` é a única fonte da verdade para policies.

### Infraestrutura & API (Docker Core)

8.  **Portão de Escrita Único**: O Core API é a única entrada permitida para mutação de estado institucional.
9.  **Isolamento de Rede**: O Postgres reside em rede interna isolada. Apenas gateways autorizados possuem acesso.

### Autenticação & Autorização

10. **Auth de Grau Militar**: Sessões curtas, refresh tokens e validação constante de JWT.
11. **Guardião Central**: Resolução de tenant e autorização de ação centralizadas no Kernel/Service Layer.
12. **Privilégio Mínimo**: Waiters e KDS nunca veem faturamento agregado ou exportações sensíveis.

### Anti-Contaminação

13. **IDs Imprevisíveis**: Uso mandatório de `UUIDv4` para todas as entidades externas.
14. **Trilha de Auditoria com Escopo**: Todos os logs e eventos DEVEM carregar o `restaurant_id`.
15. **Teste de Isolamento (Isolation E2E)**: Todo PR deve passar por teste de "Acesso Cruzado" (User A tentando ler Recurso B).

---

## 2. Matriz de Acesso (Resumo)

| Recurso                  | Owner   | Manager       | Waiter     | KDS     |
| ------------------------ | ------- | ------------- | ---------- | ------- |
| Financeiro (Daily Total) | ✅ Read | ✅ Read (Ltd) | ❌         | ❌      |
| Pedidos Ativos           | ✅ Full | ✅ Full       | ✅ Operate | ✅ View |
| Menu/Config              | ✅ Edit | ✅ Edit       | ✅ View    | ✅ View |
| Team Management          | ✅ Full | ✅ View       | ❌         | ❌      |
| Billing/Subscriptions    | ✅ Full | ❌            | ❌         | ❌      |

---

## 3. Estratégia Híbrida de Implementação

- **Cloud (Merchant Portal)**: Implementado via **Supabase RLS**. O JWT injeta o `restaurant_id` e a membership via custom claims ou joins nas policies.
- **Local/Edge (Docker Core)**: Implementado via **Service-Level Guarding**. O API Server aplica filtros de `restaurant_id` em todas as queries e valida o token contra o Core Auth.

---

_Documento Soberano de Segurança — Atualizado em: 2026-01-31_
