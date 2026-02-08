# MANAGEMENT_ADVISOR_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato do advisor de gestão (banners/checklists no portal, sem bloqueio)  
**Local:** docs/architecture/MANAGEMENT_ADVISOR_CONTRACT.md  
**Hierarquia:** Subordinado a [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) e [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md)

---

## Princípio

No portal de gestão, o sistema **nunca bloqueia** o acesso. Em vez disso, usa **banners** e **checklists** para orientar o utilizador quando o restaurante ainda não está publicado ou completo.

---

## Comportamento obrigatório

- ✅ **Nunca** bloqueia acesso a nenhuma rota do portal (`/app/*`, `/config/*`, `/dashboard`, etc.).
- ✅ Observa o estado do ciclo de vida (configured, published, operational).
- ✅ Exibe **banners** informativos quando o restaurante não está publicado (ex.: "Modo Configuração: TPV, KDS e Presença Online desativados até publicar").
- ✅ Oferece **links/CTAs** para completar checklist ou publicar (ex.: "Completar Checklist", "Publicar Agora").
- ❌ **Nunca** redireciona forçado para onboarding ou para uma única página de setup; o utilizador navega livremente no portal.

---

## Regras

- Se `published === true`, o advisor não mostra nada (ou esconde o banner).
- Durante carregamento inicial ou sem runtime, o advisor não bloqueia: deixa passar o conteúdo ou mostra estado neutro.
- O advisor é **informativo**, não **gate**: não impede acesso a TPV/KDS; isso é feito pelos gates operacionais (RequireOperational) nas rotas `/op/*` (ou equivalentes).

---

## Implementação de referência

Componente: [merchant-portal/src/components/onboarding/ManagementAdvisor.tsx](../../merchant-portal/src/components/onboarding/ManagementAdvisor.tsx). Não mostra nada durante load ou se já publicado; caso contrário, exibe banner não bloqueante com link para checklist/publicar.

---

## Referências

- [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) — portal nunca bloqueia.
- [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) — configured / published / operational.
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — bloqueio real só nas rotas operacionais.

**Violação = regressão arquitetural.**
