# DESIGN_SYSTEM_PERCEPTUAL_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato de unificação perceptiva (Design System como lei perceptiva)
**Local:** docs/architecture/DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md
**Hierarquia:** Subordinado a [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) e [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md)

---

## Princípio

O Design System é a **lei perceptiva** do sistema único: governa identidade, estados e transições de forma que Portal, Menu, TPV e KDS consumam a mesma linguagem e "respirem junto". Não é biblioteca de botões nem tema solto — é contrato visual e comportamental que garante: _"Parece tudo parte do mesmo sistema"_.

---

## Estados globais (percepção)

Todos os apps (Portal, Menu, TPV, KDS) devem usar **de forma idêntica** os seguintes estados de percepção:

| Estado      | Significado                       | Uso                                              |
| ----------- | --------------------------------- | ------------------------------------------------ |
| **loading** | Carregando dados ou ação em curso | Spinner, skeleton, "A carregar…"                 |
| **pilot**   | Em teste / modo piloto            | Indicador visível; pedidos de teste marcados     |
| **billing** | Estado de faturação (DS sensor)   | Banners de trial, active, past_due ou suspended  |
| **empty**   | Vazio, sem dados                  | Lista vazia, "Ainda não há…", CTA claro          |
| **error**   | Erro apresentável ao utilizador   | Mensagem neutra (sem stack); retry ou voltar     |
| **blocked** | Bloqueado (ex.: não publicado)    | "Sistema não operacional", link para desbloquear |

**GlobalUIState (Fase 1.2 do roadmap):** Todos os apps consomem um estado de percepção unificado: `isOperational`, `isPilot`, `isBlocked`, `isLoadingCritical`. Implementação em código fica para sprint seguinte; este contrato define a semântica.

---

## Tons emocionais

Os tons governam a **sensação** do sistema (função, não estética). Tokens passam a representar função:

| Tom             | Significado           | Uso                               |
| --------------- | --------------------- | --------------------------------- |
| **operacional** | Venda, cozinha, caixa | TPV, KDS, pedidos ativos          |
| **alerta**      | Atenção, atraso       | SLA, fila, "atenção"              |
| **neutro**      | Gestão, configuração  | Portal, menu builder, dashboard   |
| **sucesso**     | Concluído, publicado  | Confirmação, "Restaurante aberto" |

Alinhamento com [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md): Normal, Atenção, Crítico, Sucesso, Offline, Bloqueado. Referência futura para tokens por função: `color.operational.primary`, `color.blocked.warning`, `surface.kitchen`, `surface.frontdesk`.

---

## Transições permitidas

**Regra:** Nunca "teletransporte" visual.

- Ao mudar de **Portal → TPV → KDS** (ou entre estados loading / empty / error), deve haver **continuidade perceptiva**: mesmo shell, mesma linguagem de estados, mesma tipografia e espaçamento.
- **Proibido:** Mudança brusca de paleta, layout ou densidade sem transição documentada.
- **Transição Portal → TPV (rota /op/tpv):** Uma mudança deliberada para base operacional (escuro #0a0a0a); dentro do TPV não há segundo corte — loading e conteúdo partilham a mesma base.

O utilizador não deve sentir que "mudou de aplicação"; deve sentir que mudou de **ecrã** dentro do mesmo sistema.

---

## Referências

- [CORE_DESIGN_SYSTEM_CONTRACT.md](./CORE_DESIGN_SYSTEM_CONTRACT.md) — autoridade e cobertura do DS.
- [RESTAURANT_OS_DESIGN_PRINCIPLES.md](./RESTAURANT_OS_DESIGN_PRINCIPLES.md) — dark default, estados universais, tap targets.
- Roadmap Fase 1: critério de conclusão _"Parece um único sistema"_; _"Trocar de Portal → TPV → KDS não causa estranheza"_.
- [DESIGN_SYSTEM_COVERAGE.md](./DESIGN_SYSTEM_COVERAGE.md), [DESIGN_SYSTEM_ENFORCEMENT_LOOP.md](./DESIGN_SYSTEM_ENFORCEMENT_LOOP.md) — enforcement posterior.

---

**Violação = regressão perceptiva; quebra do critério "parece um único sistema".**
