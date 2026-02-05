# FASE 2 — Eliminação explícita de perfis na Web (Owner-only)

**Decisão estrutural:** A web de configuração (merchant-portal) é exclusiva do Dono. Perfis Gerente e Staff não existem neste contexto. Não há simulação, troca ou visualização cruzada de papéis na web.

Ref.: [docs/contracts/CONTRATO_OWNER_ONLY_WEB.md](../contracts/CONTRATO_OWNER_ONLY_WEB.md)

---

## Consequências práticas

- **RoleContext na web** assume sempre `owner`. Sem override (backend/sessão), não há leitura de localStorage para papel; em produção não existe seletor de papel.
- **Qualquer lógica condicional por papel** é removida ou simplificada. Componentes não podem retornar `null` por não serem owner.
- **Papéis operacionais** vivem apenas em TPV, KDS, AppStaff (contexto separado da web de configuração).

**Regra de ouro:** Se um ecrã mexe em billing, módulos, métricas ou configuração → é Dono ou nada.

---

## Checklist técnica (onde remover / validar roles)

| Ficheiro | O que fazer | Estado |
|----------|-------------|--------|
| `core/roles/RoleContext.tsx` | role = owner em produção; setRole só DEV (ou remover toggle) | ✅ role sempre owner em prod |
| `ui/design-system/domain/AdminSidebar.tsx` | Remover seletor "MODO DE VISÃO" (Dono/Gerente/Staff) | ✅ Removido |
| `pages/Dashboard/DashboardPortal.tsx` | Não depender de role para conteúdo; systemState é a fonte | ✅ Ramificação por systemState |
| `pages/Dashboard/DashboardPortal.tsx` | EcraZero: `role === "owner"` — em web é sempre owner; pode simplificar para `!showFullDashboard` | Opcional |
| `pages/Config/*`, `pages/Billing/*` | Nenhum `if (!isOwner) return null` | ✅ Nenhum encontrado |
| Outros consumos de `role` | AdminSidebar visibility (owner \|\| manager): em web role é owner; manter ou simplificar para true | Visibilidade mantida (compatível) |

---

## O que foi eliminado (não só escondido)

- ❌ "DEV: Simular papel" / "MODO DE VISÃO" — **removido** do AdminSidebar.
- ❌ Toggle Dono / Gerente / Staff na web — **não existe** (selector removido).
- ❌ RoleContext mutável via UI na web — em produção role é sempre owner; setRole não exposto.
- ❌ Fluxos que dependem de `role !== "owner"` para esconder conteúdo — **nenhum** `if (!isOwner) return null` na web de config.

---

## O que fica (e onde)

| Contexto | Perfis permitidos |
|----------|-------------------|
| merchant-portal (web config) | Dono (owner) |
| TPV / KDS (operação) | Gerente, Staff, Cozinha |
| AppStaff / QR / etc. | Staff |

Papéis existem no sistema, mas não coexistem na mesma superfície. Isso elimina bugs de render vazio, guards contraditórios e estados impossíveis (ex.: gerente a configurar billing).
