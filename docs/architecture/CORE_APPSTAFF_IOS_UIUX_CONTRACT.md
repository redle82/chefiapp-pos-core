# CORE_APPSTAFF_IOS_UIUX_CONTRACT

**Status:** CANONICAL  
**Tipo:** Contrato de UI/UX do AppStaff para iOS — UI canónica ligada ao Core  
**Local:** docs/architecture/CORE_APPSTAFF_IOS_UIUX_CONTRACT.md  
**Hierarquia:** Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md), [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md), [CORE_MOBILE_TERMINALS_CONTRACT.md](./CORE_MOBILE_TERMINALS_CONTRACT.md), [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md)

---

## Lei do sistema

**A UI/UX do AppStaff em iOS que não está ligada ao Docker Core e ao Design System é LEGACY. Não serve. O contrato canónico é este: UI/UX do AppStaff iOS DEVE usar tokens do core-design-system e DEVE consumir apenas o Docker Core (REST/RPC). Qualquer ecrã ou componente que use cores hardcoded, fontes arbitrárias ou fontes de dados fora do Core é legacy e deve ser migrado.**

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Legacy vs UI/UX canónica

| Estado        | Definição |
| ------------- | --------- |
| **Legacy**    | UI/UX do AppStaff (iOS) que: (a) não usa tokens do **core-design-system** (cores, tipografia, espaçamento, radius); (b) não obtém dados exclusivamente do **Docker Core** (localhost:3001); (c) usa estilos locais hardcoded, font-size arbitrário, paletas próprias. Esta UI não está conectada ao Core e **não serve** como referência. |
| **Canónica**  | UI/UX do AppStaff (iOS) que: (a) usa **apenas** tokens do pacote **core-design-system** (ou mapeamento explícito Web → Native documentado); (b) comunica **apenas** com o Docker Core (REST/RPC); (c) obedece a [CORE_DESIGN_SYSTEM_CONTRACT](./CORE_DESIGN_SYSTEM_CONTRACT.md) e [RESTAURANT_OS_DESIGN_PRINCIPLES](./RESTAURANT_OS_DESIGN_PRINCIPLES.md). |

**Regra:** Nenhuma nova funcionalidade no AppStaff iOS pode ser implementada com UI legacy. Migração de ecrãs legacy para a UI canónica é obrigatória antes de considerar o piloto fechado em conformidade.

---

## 2. Conexão ao Docker Core

O AppStaff iOS **não** fala com:

- merchant-portal (Web)
- TPV
- KDS
- Web Pública
- Supabase/Firebase como fonte de verdade de negócio (auth pode ser exceção contratada)

O AppStaff iOS **só** fala com:

- **Docker Core** — URL oficial no piloto: `http://localhost:3001` (REST/RPC).  
- Leitura e escrita de tarefas, pedidos, turno, consciência operacional e visibilidade financeira vêm **do Core**. A UI **mostra** e **confirma**; não calcula, não persiste verdade.

Esta regra repete e especializa [CORE_MOBILE_TERMINALS_CONTRACT](./CORE_MOBILE_TERMINALS_CONTRACT.md) §3. Qualquer chamada de rede do `mobile-app` que não seja para o Core é violação.

---

## 3. Design System obrigatório

Todo o ecrã e componente visível no AppStaff iOS DEVE:

1. **Cores** — Usar tokens de `core-design-system` (colors.background, colors.surface, colors.textPrimary, colors.textSecondary, colors.accent, etc.). Proibido: hex/rgba hardcoded fora de um ficheiro de tokens que re-exporte o DS.
2. **Tipografia** — Usar escala do DS (fontSize, fontWeight, lineHeight). Proibido: font-size ou peso arbitrário em StyleSheet.
3. **Espaçamento** — Usar base grid do DS (spacing/space). Proibido: padding/margin mágicos (ex.: 17, 23) sem alias do DS.
4. **Radius e elevação** — Usar radius (sm, md, lg, full) e elevation do DS.
5. **Estados** — Normal, Loading, Blocked, Warning, Critical, Offline com as cores/estados visuais do DS e de [RESTAURANT_OS_DESIGN_PRINCIPLES](./RESTAURANT_OS_DESIGN_PRINCIPLES.md) (dark default, tap 44–48px, hierarquia brutal, tempo visível quando importa).

O pacote **core-design-system** (tokens, typography, spacing) é a fonte única. O `mobile-app` deve importar esses tokens (ou ter um adaptador Native que mapeie 1:1) e não duplicar paletas nem escalas.

---

## 4. Onde se aplica

| Área | Aplica-se |
| ---- | --------- |
| **mobile-app** (Expo, iOS/Android) — todos os ecrãs (tabs), modais, listas, botões, empty states, loading | Sim. Este contrato define a única UI/UX canónica do AppStaff. |
| merchant-portal — rotas /garcom, /garcom/mesa/:id | Não (mostram "Disponível apenas no app mobile"). |
| KDS, TPV, Web Pública, Command Center | Não; têm contratos próprios. |

---

## 5. Enforcement

- **Cobertura:** Qualquer ecrã ou componente em `mobile-app/` que não use tokens do core-design-system (ou mapeamento documentado) deve estar listado como **legacy** numa tabela de migração (ex.: DESIGN_SYSTEM_COVERAGE ou APPSTAFF_UIUX_MIGRATION) com prazo de migração.
- **Novo código:** Em PRs que alterem UI do AppStaff iOS, verificar: (1) uso de tokens DS; (2) chamadas apenas ao Core. Rejeitar PR que introduza UI legacy.
- **CI / gate:** Onde existir lint ou script de auditoria de Design System, incluir `mobile-app` e falhar em cores/font-size hardcoded em ficheiros de UI.

---

## 6. Resumo

1. **UI/UX legacy** = AppStaff iOS sem DS e sem Core como única fonte. **Não serve.**
2. **UI/UX canónica** = AppStaff iOS com tokens do core-design-system e comunicação exclusiva com Docker Core.
3. **Contrato** = Este documento. Nenhuma decisão de UI/UX do AppStaff iOS pode contradizê-lo; migração de legacy para canónica é obrigatória.

---

## 7. Referências

- [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) — Lei macro do AppStaff; quatro perguntas; seis subcontratos.
- [CORE_MOBILE_TERMINALS_CONTRACT.md](./CORE_MOBILE_TERMINALS_CONTRACT.md) — Runtime Expo; backend Docker Core; comunicação só com Core.
- [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) — Tokens globais; onde o DS toca e onde não toca.
- [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md) — Dark default; estados universais; tempo visível; tap 44–48px.
- Pacote **core-design-system** (tokens.ts, typography.ts, spacing.ts) — Fonte única de tokens para Web e Mobile.

---

_Fim do contrato._
