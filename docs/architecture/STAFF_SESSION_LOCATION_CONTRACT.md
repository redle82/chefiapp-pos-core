# Staff Session requires Location — Contrato funcional

**Status:** CANONICAL  
**Tipo:** Contrato — toda sessão de Staff está associada a um Location ativo.  
**Subordinado a:** [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md), [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md).

---

## 1. Regra

**Staff não opera sem Location.**

Para a rota `/app/staff` os **únicos gates** permitidos são: (a) **restaurant_id** existente (ou seed em dev); (b) **Location** selecionável ou ecrã "Nenhuma localização ativa". Não são permitidos: dependência de `core.status === 'online'`, redirect para onboarding, nem preflight operacional. Ver [APPSTAFF_RUNTIME_MODEL.md](./APPSTAFF_RUNTIME_MODEL.md).

Antes de contrato operacional, check-in ou ferramentas (TPV, KDS, tarefas), o sistema resolve:

- **Em qual local estou a operar agora?**

Sem isso: eventos ficam ambíguos, TPV não sabe moeda/fuso, staff não sabe onde está logado, dashboard agrega errado.

---

## 2. Decisões canónicas

| Decisão | Regra |
|--------|--------|
| Staff não opera sem Location | Gate obrigatório antes de operação. |
| Origem do Location | Seleção explícita (se >1 ativo) ou auto-seleção (se 1 ativo). |
| Locais elegíveis | Apenas `isActive === true`. |
| Contexto da sessão | `locationId`, `timezone`, `currency` entram no contexto global da sessão. |
| Sem billing | Nada de plano, faturação ou métrica neste fluxo. |

---

## 3. Fluxo

1. Staff abre o app.
2. Sistema obtém ubicaciones ativas: `locationsStore.getLocations().filter(l => l.isActive)`.
3. **Se 0:** mostra ecrã "Nenhuma ubicación ativa" (edge case; config em Configuração > Ubicaciones).
4. **Se 1:** seleciona automaticamente; segue para contrato operacional / check-in.
5. **Se >1:** mostra ecrã "Selecionar local"; staff escolhe; segue para contrato operacional / check-in.
6. App em modo operacional com `activeLocation` (id, timezone, currency) no contexto.

---

## 4. Estado global (sessão)

| Campo | Tipo | Onde vive | Notas |
|-------|------|-----------|--------|
| activeLocation | Location \| null | StaffContext | Local da sessão atual. |
| activeLocations | Location[] | Derivado (locationsStore, isActive) | Lista elegível para seleção. |
| Persistência | sessionStorage | chave `chefiapp_staff_location_id` | Restaurar sessão ao reabrir tab; opcional por aba. |

---

## 5. O que quebra se não existir (edge cases)

| Cenário | Comportamento |
|---------|----------------|
| 0 ubicaciones ativas | Não entra em operação; mensagem clara; link conceptual para Configuração > Ubicaciones. |
| 1 ubicación ativa | Auto-seleção; nenhuma UI de seleção. |
| >1 ubicación ativa | Obrigatório selecionar; sem valor default arbitrário. |
| Location desativado durante sessão | Política a definir: manter até logout ou revalidar ao focar app. Por agora: manter sessão; revalidar na próxima entrada. |
| Persistência inválida (id em sessionStorage já não existe ou não está ativo) | Tratar como "sem local"; voltar a fluxo de seleção ou auto-seleção. |

---

## 6. Onde vive no código

| Artefacto | Ficheiro / contexto |
|-----------|----------------------|
| Estado activeLocation / activeLocations | `StaffContext` (pages/AppStaff/context/StaffContext.tsx) |
| Fonte de locais ativos | `locationsStore.getLocations().filter(l => l.isActive)` (features/admin/locations) |
| Gate "sem Location" | `AppStaff.tsx` — antes de `operationalContract` / AppStaffLanding |
| UI seleção (>1 local) | `LocationSelectView` (pages/AppStaff/views ou components) |
| UI 0 locais | `NoLocationsView` |

---

## 7. Referências

- [APPSTAFF_RUNTIME_MODEL.md](./APPSTAFF_RUNTIME_MODEL.md) — gates únicos para /app/staff; runtime autónomo.
- [CONFIG_UBICACIONES_CONTRACT.md](./CONFIG_UBICACIONES_CONTRACT.md) — modelo Location e rotas.
- [CONFIG_LOCATION_VS_CONTRACT.md](./CONFIG_LOCATION_VS_CONTRACT.md) — Location = contexto operacional.
- [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md) — rotas e regras Staff.

**Última atualização:** 2026-02-05
