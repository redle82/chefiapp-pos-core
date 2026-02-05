# Checklist manual — System Tree em 5 blocos

**Propósito:** Validação rápida após alterações no sidebar do dashboard (hierarquia GloriaFood: Começar, Operar, Equipe, Gestão, Crescimento).

**Referências:** [CORE_SYSTEM_TREE_CONTRACT.md](../architecture/CORE_SYSTEM_TREE_CONTRACT.md) (secção Agrupamento UI), [ENDPOINTS_CATALOG_PORTAL.md](../ops/ENDPOINTS_CATALOG_PORTAL.md).

---

## Checklist

- [x] `/dashboard` mostra a árvore na nova ordem (5 blocos: Começar, Operar, Equipe, Gestão, Crescimento).
- [x] **Core OFF:** em Operar, TPV e KDS aparecem desativados com indicação (tooltip ou texto) e CTA Runbook quando aplicável.
- [x] **Core ON e preflight ok:** "Abrir TPV" (ou link TPV) habilita conforme preflight.
- [x] Secção **Crescimento** está colapsada por defeito e itens marcados como "Em evolução" (disabled + tooltip).
- [x] Nenhuma rota canónica alterada; nenhuma porta/host alterada.
- [x] Sidebar usa tokens DS onde aplicável (space, fontSize, fontWeight); estados disabled/active/blocked visíveis e consistentes.

---

## Resultado (validação)

**Data:** 2026-02-03
**Tipo:** Auditoria por código (DashboardPortal.tsx, TreeSection, useOperationalReadiness).

| Item                   | Implementação                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Ordem 5 blocos         | `COMECAR_IDS`, `OPERAR_IDS`, `EQUIPE_IDS`, `GESTAO_IDS`, `CRESCIMENTO_IDS`; secções na ordem acima.      |
| Core OFF → TPV/KDS     | `getOperarItemState`: `CORE_OFFLINE` → disabled + tooltip "Core offline. Ver Runbook."                   |
| Core ON + preflight ok | `readiness.ready` → `getOperarItemState` retorna `{}` (habilitado).                                      |
| Crescimento colapsado  | `crescimentoExpanded = useState(false)`; itens com `getCrescimentoItemState` → disabled + "Em evolução". |
| Rotas/portas           | Sem alterações neste plano.                                                                              |
| Tokens DS              | `space`, `fontSize`, `fontWeight` do design-system no nav e TreeSection.                                 |

**Recomendação:** Executar uma vez no browser em `/dashboard` (Core OFF e Core ON) para validar visualmente.

---

_Checklist mínimo para validação humana do System Tree em 5 blocos._
