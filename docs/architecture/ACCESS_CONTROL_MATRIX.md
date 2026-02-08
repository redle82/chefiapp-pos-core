# Matriz de Controlo de Acesso — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T40-3 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Matriz completa de papéis (roles) vs recursos/ações. Consolida e expande [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md). Documento canónico para RLS, produto e auditoria.

---

## 1. Âmbito

Este documento define:

- **Papéis:** Owner, Manager, Waiter, KDS (e, se aplicável, Admin de suporte).
- **Recursos:** Dados e funcionalidades por domínio (financeiro, pedidos, menu, equipa, billing, etc.).
- **Ações:** Leitura (Read), Escrita/Edição (Edit), Operação (Operate), Vista (View), Full (CRUD + ações especiais).
- **Isolamento:** Toda a matriz aplica-se **por tenant** (restaurant_id); não há acesso cross-tenant.

**Implementação:** RLS (Supabase) no Cloud Merchant Portal; Service-Level Guarding no Docker Core. Ver [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md).

---

## 2. Papéis

| Papel | Descrição | Fonte da verdade |
|-------|-----------|-------------------|
| **Owner** | Dono do restaurante; acesso total ao tenant; billing e equipa | gm_restaurant_members.role = 'owner' |
| **Manager** | Gestor; opera pedidos, menu, equipa (vista); não billing | gm_restaurant_members.role = 'manager' |
| **Waiter** | Staff de sala; opera pedidos e vista de menu | gm_restaurant_members.role = 'waiter' |
| **KDS** | Cozinha; vista de pedidos e tarefas KDS | gm_restaurant_members.role = 'kds' |
| **Admin (suporte)** | Suporte ChefIApp; acesso excecional e auditado; fora do tenant | Conta/role específica; não em gm_restaurant_members |

---

## 3. Matriz de acesso (Recurso × Papel)

Legenda: **Full** = criar, ler, atualizar, apagar e ações especiais · **Edit** = criar, ler, atualizar (sem apagar sensível) · **Operate** = executar ações operacionais (ex.: criar pedido, check-in) · **View** = só leitura · **Read (Ltd)** = leitura limitada (ex.: totais agregados com restrições) · **—** = sem acesso.

| Recurso / Funcionalidade | Owner | Manager | Waiter | KDS |
|--------------------------|-------|---------|--------|-----|
| **Financeiro (Daily Total, caixa)** | ✅ Read | ✅ Read (Ltd) | ❌ | ❌ |
| **Pedidos (ativos, histórico)** | ✅ Full | ✅ Full | ✅ Operate | ✅ View |
| **Menu / Configuração do restaurante** | ✅ Edit | ✅ Edit | ✅ View | ✅ View |
| **Gestão de equipa (Team Management)** | ✅ Full | ✅ View | ❌ | ❌ |
| **Billing / Subscrições** | ✅ Full | ❌ | ❌ | ❌ |
| **Check-in / Check-out (turnos)** | ✅ Full | ✅ Full | ✅ Operate (próprio) | ✅ Operate (próprio) |
| **Tarefas (KDS, tarefas atribuídas)** | ✅ Full | ✅ Full | ✅ View / Operate (conforme contexto) | ✅ View / Operate |
| **Export (work log, dados sensíveis)** | ✅ Full | 🟡 Ltd (conforme política) | ❌ | ❌ |
| **Auditoria / Logs (leitura)** | ✅ Read | 🟡 Ltd (eventos do tenant) | ❌ | ❌ |
| **Desativar / Reativar membro (staff)** | ✅ Full | ✅ Staff apenas (nunca último owner) | ❌ | ❌ |
| **Configuração de integrações (TPV, etc.)** | ✅ Full | ❌ ou Ltd | ❌ | ❌ |

*Nota:* "Ltd" indica restrições adicionais (ex.: Manager não vê dados de billing; export apenas para Owner ou processo aprovado). Detalhe de implementação em RLS e serviços.

---

## 4. Regras de isolamento (tenant)

- **Todas** as linhas da matriz aplicam-se **no âmbito de um único tenant** (restaurant_id).
- Nenhum papel pode aceder a dados de outro tenant; RLS e Service Layer aplicam filtro por tenant em todas as queries.
- **Fail-closed:** Na dúvida de resolução de tenant ou de permissão, o sistema devolve 403 (ou equivalente); nunca assume tenant ou papel por defeito.

---

## 5. Admin (suporte) e acessos excecionais

- Acesso **Admin** (suporte ChefIApp) é excecional, auditado e fora da matriz por tenant (ex.: troubleshooting com consentimento do cliente).
- Qualquer acesso Admin deve ser registado (quem, quando, que recurso/tenant, motivo); ver [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) quando implementado.
- Não confundir com "Owner" do restaurante; Owner é papel dentro do tenant.

---

## 6. Referências de implementação

- **RLS:** Políticas por papel em tabelas multi-tenant; helpers `user_restaurant_ids()`, `get_user_restaurants()`, `is_user_member_of_restaurant()`; considerar apenas membros com `disabled_at IS NULL`.
- **Edge Functions / API:** Validar JWT e membership; derivar restaurant_id do contexto de auth; nunca confiar em parâmetros do cliente para tenant ou papel.
- **Frontend:** Esconder UI de funcionalidades não permitidas ao papel; a autorização final é sempre no backend.

---

**Referências:** [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) · [THREAT_MODEL.md](./THREAT_MODEL.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [OWASP_ASVS_CHECKLIST.md](./OWASP_ASVS_CHECKLIST.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
