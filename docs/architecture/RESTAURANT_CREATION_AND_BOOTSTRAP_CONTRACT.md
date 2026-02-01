# RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato NON-CORE — criação do primeiro restaurante e bootstrap  
**Local:** docs/architecture/RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md  
**Hierarquia:** Subordinado a [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) e [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md)

---

## Objetivo

Definir onde e como nasce o primeiro restaurante após signup. Quem pode criar, estado inicial, relação owner ↔ restaurante. O que NÃO é responsabilidade do bootstrap.

---

## Rota

| Campo | Valor |
|-------|--------|
| **URL** | `/bootstrap` |
| **Componente** | BootstrapPage |
| **Acessível** | Apenas utilizador autenticado sem tenant (session sim, tenantId não) |

---

## Onde nasce o restaurante

- **Implementação atual:** [BootstrapPage](merchant-portal/src/pages/BootstrapPage.tsx).
- **Ações:** INSERT `gm_restaurants` (nome, slug, owner_id, status, country, plan, type) + INSERT `gm_restaurant_members` (user_id, restaurant_id, role: "owner").
- **Via:** DbWriteGate.insert (BootstrapPage); não existe RPC "create_restaurant" no Core.
- **Destino após sucesso:** redirect para `/app/dashboard`.

---

## Quem pode criar

- Utilizador com sessão válida (auth) e sem tenant selado (0 memberships ou primeiro acesso pós-signup).
- A rota `/bootstrap` não exige tenant nem role; está fora do RoleGate em App.tsx.

---

## Estado inicial (alvo)

- **Contrato (alvo):** restaurante nasce `status: "draft"`; publicação depois em `/app/publish`.
- **Implementação atual:** BootstrapPage insere `status: "active"` (alinhamento pendente; não alterar nesta fase sem decisão explícita).

---

## Relação owner ↔ restaurante

- Ao criar o restaurante, BootstrapPage cria em seguida o vínculo em `gm_restaurant_members` com `role: "owner"`.
- O mesmo user_id (sessão) é `owner_id` em `gm_restaurants` e `user_id` em `gm_restaurant_members` com role owner.

---

## O que NÃO é responsabilidade do bootstrap

- Login/signup (AuthPage).
- Configuração do restaurante (identidade, localização, etc.) — feita no portal após bootstrap.
- Billing, publicação, operação — fluxos separados.

---

## Referências

- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — fluxo do cliente
- [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) — destino pós-login
- [CATALOGO_ACOES_CRIACAO_RESTAURANTE.md](./CATALOGO_ACOES_CRIACAO_RESTAURANTE.md) — onde cada ação ocorre
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — índice rota → contrato

**Violação = criar primeiro restaurante fora do fluxo /bootstrap ou sem vínculo owner.**
