# Checklist de Verificação — Fluxo de Criação de Novo Restaurante

**Propósito:** Confirmar que o sistema de criação de restaurante está fechado e operacional. Usar manualmente e/ou via testes antes de considerar o fluxo “vendável”.

**Local:** docs/audit/CHECKLIST_VERIFICACAO_CRIACAO_RESTAURANTE.md

---

## 1. Rotas

| Item | Verificação | Estado |
|------|-------------|--------|
| Rota `/bootstrap` | Existe em App.tsx; renderiza BootstrapPage; acessível sem tenant selado | ☐ |
| Rota `/app/select-tenant` | Existe em App.tsx; renderiza SelectTenantPage; fora do RoleGate | ☐ |
| `/bootstrap` → destino | Após criar restaurante, redireciona para `/app/dashboard` (ou `/dashboard`) | ☐ |
| `/app/select-tenant` 0 tenants | Redireciona para `/bootstrap` | ☐ |
| `/app/select-tenant` 1 tenant | Auto-select + redireciona para `/dashboard` | ☐ |
| `/app/select-tenant` >1 tenants | Mostra lista (Seus Restaurantes); após escolha → `/dashboard` | ☐ |

---

## 2. Gates

| Item | Verificação | Estado |
|------|-------------|--------|
| FlowGate | Utilizador sem tenant → não monta /app/* (exceto /bootstrap, /app/select-tenant) | ☐ |
| FlowGate | Utilizador com múltiplos tenants → redirect para /app/select-tenant | ☐ |
| RequireOperational | isPublished === false → bloqueia /op/tpv e /op/kds; mostra "Sistema não operacional" | ☐ |
| RequireOperational | isPublished === true → libera /op/tpv e /op/kds | ☐ |

---

## 3. Ações explícitas

| Item | Onde | Estado |
|------|------|--------|
| Criar restaurante | BootstrapPage: insert gm_restaurants + gm_restaurant_members (owner) | ☐ |
| Selecionar tenant | switchTenant(tenantId); persistência (localStorage/context) | ☐ |
| Publicar restaurante | /app/publish; atualiza estado; libera /op/* via RequireOperational | ☐ |
| Operar TPV/KDS | /op/tpv, /op/kds; bloqueados se não publicado | ☐ |

---

## 4. Contratos e documentação

| Documento | Existe e está indexado | Estado |
|-----------|------------------------|--------|
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md | CORE_CONTRACT_INDEX, ROTAS_E_CONTRATOS, INDICE_MDS | ☐ |
| TENANT_SELECTION_CONTRACT.md | Idem | ☐ |
| GATES_FLUXO_CRIACAO_E_OPERACAO.md | Referência para gates atuais | ☐ |
| CAMINHO_DO_CLIENTE.md | Secção 2a (bootstrap e select-tenant) alinhada ao fluxo real | ☐ |
| CATALOGO_ACOES_CRIACAO_RESTAURANTE.md | Ações catalogadas | ☐ |

---

## 5. Testes críticos

| Teste | Ficheiro | Comando / Nota | Estado |
|-------|----------|----------------|--------|
| E2E criação 1º restaurante | create-first-restaurant.spec.ts | `npx playwright test tests/e2e/create-first-restaurant.spec.ts` (app + Supabase) | ☐ |
| Unit SelectTenantPage | SelectTenantPage.test.tsx | `npm run test -- src/pages/SelectTenantPage.test.tsx` | ☐ |
| Unit RequireOperational + billing TDD | RequireOperationalBilling.test.tsx | `npm run test -- src/components/operational/RequireOperationalBilling.test.tsx` | ☐ |
| Unit TenantResolver | TenantResolver.test.ts | `npm run test -- src/core/tenant/TenantResolver.test.ts` | ☐ |
| E2E publicar → operar | publish-to-operational.spec.ts | `npx playwright test tests/e2e/publish-to-operational.spec.ts` (cenários sem publicar; opcional com fixture) | ☐ |

---

## 6. Verificação final (manual ou E2E)

| Item | Verificação | Estado |
|------|-------------|--------|
| Utilizador novo → cria restaurante | Signup → bootstrap → criação restaurante + owner → dashboard; sem erro | ☐ |
| CoreResetPage | Nunca aparece no fluxo normal (E2E create-first-restaurant verifica) | ☐ |
| Multi-tenant | Seleção de tenant funciona; switch persiste | ☐ |
| Publicação | Publicar desbloqueia /op/*; RequireOperational libera TPV/KDS | ☐ |
| TPV/KDS | Abrem corretamente quando publicado | ☐ |
| Rotas mortas | Nenhuma rota oficial quebrada ou redirect em loop | ☐ |

---

## 7. Regras de ouro (não regredir)

- Não tocar no Core sem contrato.
- Não criar onboarding wizard artificial que prende.
- Não esconder bugs com redirects genéricos.
- Preferir falha explícita a comportamento implícito.

---

## Referências

- [AUDITORIA_FLUXO_CRIACAO_RESTAURANTE.md](./AUDITORIA_FLUXO_CRIACAO_RESTAURANTE.md)
- [ROTAS_E_CONTRATOS.md](../architecture/ROTAS_E_CONTRATOS.md)
- [GATES_FLUXO_CRIACAO_E_OPERACAO.md](../architecture/GATES_FLUXO_CRIACAO_E_OPERACAO.md)
- [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md)
