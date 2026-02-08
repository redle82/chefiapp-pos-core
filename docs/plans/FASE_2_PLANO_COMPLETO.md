# Fase 2 — Consolidação Operacional Total (100%)

**Objetivo da Fase 2:** Transformar o núcleo validado (Fase 1) em sistema utilizável diariamente por um restaurante real — dispositivos físicos, pessoas, turnos, pagamentos e observabilidade humana — sem quebrar o Core.

**Regra-mãe:** Nada mexe em pedido/estado Core sem contrato novo.

**Referências:** [FASE_1_VEREDITO_FINAL.md](../FASE_1_VEREDITO_FINAL.md), [FLUXO_DE_PEDIDO_OPERACIONAL.md](../contracts/FLUXO_DE_PEDIDO_OPERACIONAL.md), [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md).

---

## Tabela de subfases e pesos

| Subfase | Nome | Peso |
|---------|------|------|
| 2.1 | Superfícies e instalação real | 25% |
| 2.2 | Pessoas, turnos e papéis | 20% |
| 2.3 | Caixa, pagamentos e fecho | 25% |
| 2.4 | Observabilidade operacional humana | 15% |
| 2.5 | Uso real prolongado + freeze | 15% |
| | **Fase 2 completa** | **100%** |

---

## 2.1 — Superfícies e instalação real (25%)

**Objetivo:** Definir onde cada superfície vive, em que dispositivo e com que papel — e instalar de verdade.

**Escopo:**

- **2.1.1 Contrato de Superfícies Operacionais** — [OPERATIONAL_SURFACES_CONTRACT.md](../contracts/OPERATIONAL_SURFACES_CONTRACT.md): matriz Dashboard / TPV / KDS / AppStaff (pode / não pode).
- **2.1.2 Instalação física real** — TPV em desktop dedicado; KDS em tablet/monitor de cozinha; AppStaff em telemóvel. Sem ambiguidade “instalar no browser de configuração”.
- **2.1.3 Gate de instalação** — `/app/install` passa a registar dispositivo, atribuir papel (TPV, KDS, Staff), bloquear uso indevido. Ver [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md).

**Critério de sucesso:** Cada superfície funciona apenas no seu papel; não há TPV “meio dashboard” nem KDS “explicativo”.

### 2.1 — Resultado (FASE 2.1)

- **Data da conclusão (implementação):** 2026-02-03
- **Escolha registada:** Instalação: PWA (um PWA único; atalhos `/op/tpv` e `/op/kds`). Ver [TERMINAL_INSTALLATION_RITUAL.md](../contracts/TERMINAL_INSTALLATION_RITUAL.md) secções 5 (Instalação PWA) e 6 (Checklist de validação por terminal).
- **Checklist por terminal:** TPV [x] / KDS [x] — URL fixa, fullscreen, reconnect, reload, perda de foco.
- **Resultado do teste canónico:** PASSOU (executado 2026-02-03).
  - TPV instalado (PWA) → cria pedidos normalmente. [x]
  - KDS instalado (PWA) → recebe e processa pedidos. [x]
  - Dashboard → observa sem interferir. [x]
  - Nenhuma superfície mostra UI "errada" para o seu papel. [x]
  - Nenhum ajuste no Core foi necessário. [x]
- **Violações corrigidas na implementação:**
  - **CoreUnavailableBanner** e **BillingBanner** não devem aparecer em TPV/KDS (OPERATIONAL_SURFACES_CONTRACT). Resolução: `CoreUnavailableBanner` retorna `null` quando `pathname.startsWith('/op/tpv')` ou `pathname.startsWith('/op/kds')`; em `AppContentWithBilling`, `BillingBanner` só é renderizado quando `!isOperationalSurface`.
  - TPVMinimal/KDSMinimal: sem InstallAppPrompt; KDS já com zero preços na UI. Dashboard: sem ações de execução (apenas links para /op/tpv e /op/kds).

---

## 2.2 — Pessoas, turnos e papéis (20%)

**Objetivo:** O sistema passa a entender quem está a operar.

**Escopo:**

- **2.2.1 Turnos reais** — Abrir turno, operador responsável, encerrar turno, associar pedidos a turnos. Sem fiscal; só verdade interna.
- **2.2.2 Papéis humanos** — Dono, Gerente, Operador TPV, Cozinha, Staff; ligados a dispositivo, turno e ações permitidas.
- **2.2.3 Header operacional completo** — Ex.: “Restaurante X — Turno aberto — Caixa João”. Responsabilidade, não estética.

**Critério de sucesso:** Todo pedido tem quem, quando, em que turno; não existem ações “anónimas”.

### 2.2 — Resultado (FASE 2.2)

- **Data da conclusão:** 2026-02-03
- **2.2.1 Turnos:** Fonte única no Core (`gm_cash_registers`); TPV/ShiftGate abrem; Dashboard e KDS chamam `refreshShiftStatus()` ao montar. Encerrar turno: TPV (closeCashRegister), Dashboard (ShiftCard / AdminSidebar "Encerrar Turno"). Pedidos associados a `cash_register_id`. [x]
- **2.2.2 Papéis:** `opened_by` nunca anónimo: ShiftGate e TPVMinimal usam "Operador TPV" quando não há utilizador; TPV completo usa currentOperatorId. [x]
- **2.2.3 Header:** Dashboard em OPERATIONAL_OS mostra restaurante (headerTitle), estado (Operação Pronta | Core ON | Turno Aberto) e "Operador actual" quando turno aberto (OPERATIONAL_HEADER_CONTRACT). [x]
- **Teste canónico:** Abrir turno (TPV ou ShiftGate) → criar pedido → Dashboard/KDS mostram turno aberto e operador; encerrar turno explícito no TPV ou Dashboard. [x]

---

## 2.3 — Caixa, pagamentos e fecho (25%)

**Objetivo:** Fechar o ciclo económico sem ainda entrar em fiscal pesado.

**Escopo:**

- **2.3.1 Caixa operacional** — Total por turno, total por método, diferença esperado vs real.
- **2.3.2 Pagamentos (gateado)** — Ordem: (1) Fecho manual, (2) Registo de pagamento, (3) Integração de pagamento, (4) Automação. Nunca saltar passos.
- **2.3.3 Fecho de turno** — Relatório simples, assinatura humana, histórico imutável.

**Critério de sucesso:** Um restaurante consegue fechar um dia; o sistema não mente; diferenças ficam visíveis.

### 2.3 — Resultado (FASE 2.3)

- **Data da conclusão (implementação):** 2026-02-03
- **2.3.1 Caixa:** Total por turno e por método via `get_shift_history` (sales_by_method); esperado vs declarado e diferença no Dashboard. [x]
- **2.3.2 Pagamentos:** PaymentEngine cash/card (simulado); process_order_payment; sem integração externa. [x]
- **2.3.3 Fecho:** CloseCashRegisterModal com total esperado, declarado, diferença e observação obrigatória se ≠ 0; Dashboard só leitura, link "Fechar no TPV". [x]
- **Teste canónico:** PASSOU (2026-02-03). Smoke automático passos 1–4; teste manual recomendado. Ver [FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md](FASE_2.3_CAIXA_PAGAMENTOS_FECHO.md).

---

## 2.4 — Observabilidade operacional humana (15%)

**Objetivo:** Transformar ruído em consciência, não ansiedade.

**Escopo:**

- **2.4.1 Contrato de Alertas Operacionais** — [OPERATIONAL_ALERTS_CONTRACT.md](../contracts/OPERATIONAL_ALERTS_CONTRACT.md): severidade real (info / warn / critical), TTL, agregação; separar estado, incidente, histórico.
- **2.4.2 Dashboard honesto** — Sem banners dramáticos, sem contadores brutos; só sinais acionáveis.

**Critério de sucesso:** Operador entende o sistema; não ignora alertas; não entra em pânico.

### 2.4 — Resultado (FASE 2.4)

- **Data da conclusão:** 2026-02-03
- **2.4.1 Contrato:** [OPERATIONAL_ALERTS_CONTRACT.md](../contracts/OPERATIONAL_ALERTS_CONTRACT.md) criado — severidade (info/warn/critical), TTL, agregação, estado vs incidente vs histórico.
- **2.4.2 Dashboard honesto:** CoreUnavailableBanner e OperationalMetricsCards já alinhados; TPV/KDS sem banners de sistema (OPERATIONAL_SURFACES_CONTRACT). Ver [FASE_2.4_OBSERVABILIDADE_ALERTAS.md](FASE_2.4_OBSERVABILIDADE_ALERTAS.md).

---

## 2.5 — Uso real prolongado + freeze (15%)

**Objetivo:** Provar que tudo funciona sob vida real, não laboratório.

**Escopo:**

- 1 restaurante real, 1–2 TPVs, 1 KDS, ≥ 1 semana (pico + vazio).
- Registo diário obrigatório: [USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md).

**Critério de sucesso:** Nenhuma falha soberana repetida; operadores não rejeitam o sistema; nenhuma mentira financeira; logs limpos.

**Freeze da Fase 2:** Após sucesso — nova tag (ex.: `operational-phase-2-freeze-v1`), atualizar [ROLLBACK_OPERATIONAL_FREEZE.md](../ops/ROLLBACK_OPERATIONAL_FREEZE.md) § 6, congelar estrutura.

### 2.5 — Resultado (FASE 2.5)

- **Estado:** Piloto a executar conforme [USO_REAL_PROLONGADO_PILOTO.md](../ops/USO_REAL_PROLONGADO_PILOTO.md).
- **Checklist e freeze:** Ver [FASE_2.5_USO_REAL_FREEZE.md](FASE_2.5_USO_REAL_FREEZE.md). Após sucesso do piloto: tag `operational-phase-2-freeze-v1`, preencher ROLLBACK_OPERATIONAL_FREEZE § 6.
- **Data de conclusão:** *(preencher após piloto e freeze)*

---

## Percentual total após Fase 2

| Marco | % total do produto |
|-------|--------------------|
| Fase 1 | ~65% |
| Fase 2 completa | ~90% |

Os últimos 10%: fiscal profundo, multi-país, escala enterprise, integrações externas.

---

## Próxima decisão

Fase 2 em curso:

- ~~**2.1** — Superfícies e instalação~~ ✅ (executado 2026-02-03; TPV instala)
- ~~**2.2** — Pessoas e turnos~~ ✅ (concluído 2026-02-03)
- ~~**2.3** — Caixa e pagamentos~~ ✅ (implementação 2026-02-03; teste canónico a executar)
- ~~**2.4** — Observabilidade e alertas~~ ✅ (contrato 2026-02-03; Dashboard já alinhado)
- **2.5** — Uso real prolongado + freeze ← próximo

---

## Teste de resistência: simulação 7 dias (só Core)

Contrato e scripts para simular 7 dias de restaurante exclusivamente contra o Docker Core (PostgREST), sem UI:

- [WEEKLY_RESTAURANT_SIMULATION_CONTRACT.md](../contracts/WEEKLY_RESTAURANT_SIMULATION_CONTRACT.md)
- [scripts/simulate-restaurant-week.sh](../../scripts/simulate-restaurant-week.sh)
- [scripts/validate-week-simulation.sql](../../scripts/validate-week-simulation.sql) e [scripts/validate-week-simulation.sh](../../scripts/validate-week-simulation.sh)

**Marco:**  
*Teste de resistência de 7 dias executado com sucesso — Core aprovado para operação contínua.* (Execução: 2026-02-03.)
