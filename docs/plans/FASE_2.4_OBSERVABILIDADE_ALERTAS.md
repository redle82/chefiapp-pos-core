# FASE 2.4 — Observabilidade operacional humana (15%)

**Objetivo:** Transformar ruído em consciência, não ansiedade.

**Referências:** [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md), [OPERATIONAL_ALERTS_CONTRACT.md](../contracts/OPERATIONAL_ALERTS_CONTRACT.md), [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](../contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md).

---

## Escopo

| Item | Descrição |
|------|-----------|
| **2.4.1** | Contrato de Alertas Operacionais — severidade real (info / warn / critical), TTL, agregação; separar estado, incidente, histórico. |
| **2.4.2** | Dashboard honesto — Sem banners dramáticos, sem contadores brutos; só sinais acionáveis. |

**Critério de sucesso:** Operador entende o sistema; não ignora alertas; não entra em pânico.

---

## Checklist executável (2.4)

### Contrato (2.4.1)

- [x] **OPERATIONAL_ALERTS_CONTRACT.md** criado em [docs/contracts/OPERATIONAL_ALERTS_CONTRACT.md](../contracts/OPERATIONAL_ALERTS_CONTRACT.md): severidade (info/warn/critical), TTL, agregação, estado vs incidente vs histórico.
- [ ] **Implementação futura:** entidades de alerta com severidade e TTL; UI de alertas activos limitada a 1–3 na primeira dobra; histórico noutra página. (Opcional nesta fase.)

### Dashboard honesto (2.4.2)

- [x] **CoreUnavailableBanner:** mensagem curta, acção "Tentar novamente" + link Ajuda; sem drama. (Já alinhado.)
- [x] **OperationalMetricsCards:** SETUP/sem dados com texto contextual; ACTIVE com métricas. (Já alinhado.)
- [x] **OPERATIONAL_SURFACES_CONTRACT:** TPV/KDS não mostram estado de sistema (banners escondidos em /op/tpv e /op/kds). (Já aplicado.)
- [ ] **Auditoria:** rever outros banners (BillingBanner, DataModeBanner, etc.) e garantir que cada um tem acção clara ou contexto; remover ou suavizar mensagens dramáticas. (Verificação contínua.)

---

## Ficheiros chave

| Ficheiro | Uso |
|----------|-----|
| [docs/contracts/OPERATIONAL_ALERTS_CONTRACT.md](../contracts/OPERATIONAL_ALERTS_CONTRACT.md) | Contrato Fase 2.4: severidade, TTL, agregação, Dashboard honesto. |
| [docs/contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md](../contracts/OPERATIONAL_DASHBOARD_V2_CONTRACT.md) | Primeira dobra, estado operacional, o que nunca aparece. |
| [merchant-portal/src/ui/design-system/CoreUnavailableBanner.tsx](merchant-portal/src/ui/design-system/CoreUnavailableBanner.tsx) | Banner Core offline; acionável. |
| [merchant-portal/src/components/Dashboard/OperationalMetricsCards.tsx](merchant-portal/src/components/Dashboard/OperationalMetricsCards.tsx) | Métricas do dia; contexto por estado. |
| [docs/ops/OBSERVABILITY_POST_CUT.md](../ops/OBSERVABILITY_POST_CUT.md) | Anti-spam; eventos a registar. |

---

## Registo do resultado

- **Data da conclusão (contrato + verificação):** 2026-02-03
- **2.4.1 Contrato:** [x] OPERATIONAL_ALERTS_CONTRACT.md criado.
- **2.4.2 Dashboard honesto:** [x] Verificação: CoreUnavailableBanner e OperationalMetricsCards alinhados; TPV/KDS sem banners de sistema.
- **Notas:** Implementação de entidades de alerta com TTL e UI de lista de incidentes fica para fase posterior; contrato define o alvo.

Registar também em [FASE_2_PLANO_COMPLETO.md](FASE_2_PLANO_COMPLETO.md) na secção **2.4 — Observabilidade operacional humana**, subsecção **2.4 — Resultado**.
