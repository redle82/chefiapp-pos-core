# TENANT_SELECTION_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato NON-CORE — seleção de tenant (restaurante ativo)  
**Local:** docs/architecture/TENANT_SELECTION_CONTRACT.md  
**Hierarquia:** Subordinado a [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) e [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)

---

## Objetivo

Definir quando a seleção de tenant acontece, os casos 0 / 1 / N, persistência do tenant e comportamento esperado. Evitar loops e redirects invisíveis.

---

## Rota

| Campo | Valor |
|-------|--------|
| **URL** | `/app/select-tenant` |
| **Componente** | SelectTenantPage |
| **Acessível** | Utilizador autenticado; não exige tenant selado (rota fora do RoleGate) |

---

## Quando a seleção acontece

- Utilizador com 0 memberships (ainda sem restaurante) → deve ir para `/bootstrap` (SelectTenantPage redireciona).
- Utilizador com 1 membership → auto-select; tenant selado e redirect para `/dashboard`.
- Utilizador com >1 memberships → lista de restaurantes; utilizador escolhe; switchTenant(id); redirect para `/dashboard`.

A decisão de redirecionar para `/app/select-tenant` (quando não há tenant selado ou há múltiplos) vive no TenantContext / AppDomainWrapper (ou equivalente); FlowGate está documentado como executor em FLOW_CORE.md mas não está na árvore de App.tsx — a lógica atual é TenantProvider + redirecionamentos quando não há tenantId.

---

## Casos 0 / 1 / N

| Caso | Comportamento |
|------|----------------|
| **0 memberships** | SelectTenantPage renderiza Navigate to `/bootstrap` (replace). |
| **1 membership** | SelectTenantPage chama switchTenant(memberships[0].restaurant_id) e navigate("/dashboard", { replace: true }). |
| **>1 memberships** | SelectTenantPage renderiza TenantSelector (modo full). Após utilizador escolher, TenantSelector chama switchTenant(id); SelectTenantPage reage a tenantId e navigate("/dashboard"). |

---

## Persistência do tenant

- **TenantResolver:** setActiveTenant(id) persiste em localStorage (e estado no TenantContext).
- **Selagem:** "Tenant selado" = valor em localStorage + estado sincronizado; evita re-redirect para select-tenant após escolha.

---

## Comportamento esperado

- Nenhum loop de redirect: após seleção, o utilizador permanece em `/dashboard` (ou destino pretendido).
- Verificação de chamadas: em testes, mockar useNavigate e verificar que navigate foi chamado com o destino correto; não depender de efeitos encadeados (FlowGate/AppDomainWrapper) para asserções.

---

## Referências

- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — modos de boot
- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — fluxo do cliente
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — índice rota → contrato
- [CATALOGO_ACOES_CRIACAO_RESTAURANTE.md](./CATALOGO_ACOES_CRIACAO_RESTAURANTE.md) — onde cada ação ocorre

**Violação = redirecionar para select-tenant em loop ou não selar tenant após escolha.**
