# Design System Coverage Map

**Propósito:** Forçar a realidade a obedecer ao [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md). Se uma tela/componente **não** usa o Design System, tem de estar aqui explicado e classificado.

**Regra:** Se não usa DS → tem que estar nesta tabela. Tudo que for "não" ou "parcial" vira **ticket de arquitetura** (bug, débito, contrato em falta ou violação).

**Atualização:** Preencher após auditoria de merchant-portal, mobile-app, KDSMinimal, TPVMinimal. Ver [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) e prompt [PROMPT_DESIGN_SYSTEM_UNIFICATION.md](./PROMPT_DESIGN_SYSTEM_UNIFICATION.md).

---

## Tabela de cobertura

| Área / Tela | Terminal | Usa DS? | O que falta | Tipo |
|-------------|----------|---------|-------------|------|
| **Config** (Layout, Sidebar, Identity) | Web | ✅ | — | OK |
| **BillingConfigPanel** (Command Center → Billing) | Web | ✅ | — | OK |
| Billing (BillingPage — /app/billing) | Web | ⚠️ parcial | VPC local; migrar para core-design-system | Débito |
| Landing (Hero, Footer, FAQ, Demo) | Web | ⚠️ parcial | Botões/cores legacy; alinhar a core-design-system | Débito |
| Dashboard (Command Center) | Web | ⚠️ parcial | Shell e painéis mistos (cores/fontes locais) | Débito |
| Web Pública (menu, pedido, status) | Web | ⚠️ parcial | Tokens locais; migrar para core-design-system | Débito |
| KDSMinimal | Web (KDS) | ❌ | Estados offline, inputs sem tokens | Bug / Violação |
| TPVMinimal | Web (TPV) | ❌ | Inputs, modais sem tokens | Violação |
| AppStaff Home / Tarefas | Mobile | ⚠️ parcial | Cards legacy; tokens nativos a mapear | Débito |
| Modais (abrir caixa, fechar caixa, pagamento) | Web | ⚠️ parcial | Estilos locais | Débito |
| Estados (loading, empty, error, offline) | Web / Mobile | ⚠️ parcial | EmptyState/LoadingState existem; nem todos usam tokens canónicos | Débito |

**Tipos:** `OK` | `Débito` (técnico) | `Bug` | `Violação` (arquitetural)

---

## Como preencher (auditoria)

1. **Por terminal:** Web (merchant-portal), Mobile (mobile-app), KDS (KDSMinimal), TPV (TPVMinimal).
2. **Por tela/área:** Uma linha por ecrã ou módulo relevante.
3. **Usa DS?** ✅ sim (tokens/core-design-system) | ⚠️ parcial | ❌ não.
4. **O que falta:** Lista curta (ex.: "Botões antigos", "Inputs sem tokens", "Estados offline").
5. **Tipo:** OK | Débito | Bug | Violação.

Após refactor: mudar linha para ✅ e tipo OK; ou remover se redundante.

---

## Referências

- [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) — Lei do DS.
- [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) — Mecanismos A, B, C.
- [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) — Onde a lei está no código.
- [core-design-system/](../core-design-system/) — Tokens canónicos.
