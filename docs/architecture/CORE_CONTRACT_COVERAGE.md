# Cobertura de Contratos por Área — Fonte única (sem ambiguidade)

**Propósito:** Saber **quem TEM contrato**, **quem NÃO TEM**, e **em que nível**. Resposta binária, seca e inequívoca.

**Estado do núcleo (resumo executivo):** [CORE_STATE.md](./CORE_STATE.md).

---

## Regra de leitura

**“Tem contrato”** significa:

- existe documento do Core que diz que aquilo **DEVE** existir
- e **quem manda**
- e **quem obedece**

**“Não tem contrato”** significa:

- pode existir código
- pode funcionar
- mas **não é governado**
- logo, pode quebrar / divergir / ser ignorado

---

## 🟢 Quem TEM contrato (claro, explícito)

Estes estão sob lei do Core. Não há dúvida.

| #   | Área                           | Documento(s)                                                                                                         | Enforcement / nota                                          | Status                        |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------- |
| 1   | **UI Operacional** (OS visual) | [CORE_OPERATIONAL_UI_CONTRACT.md](./CORE_OPERATIONAL_UI_CONTRACT.md)                                                 | OperationalShell, PanelRoot                                 | **FECHADO**                   |
| 2   | **AppStaff** (execução humana) | [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md) + subcontratos                                              | Identidade, execução, tarefas, métricas, comunicação mínima | **FECHADO** (conceitualmente) |
| 3   | **Banco / Domínio**            | [DATABASE_AUTHORITY.md](./DATABASE_AUTHORITY.md), [MENU_CONTRACT.md](./MENU_CONTRACT.md)                             | Migrações como autoridade; fonte da verdade é o Core        | **FECHADO**                   |
| 4   | **Billing / Subscrição**       | [BILLING_FLOW.md](./BILLING_FLOW.md)                                                                                 | Estados (active, canceled); PaymentGuard                    | **FECHADO PARA MVP**          |
| 5   | **Multi-tenant / Kernel**      | [TENANCY_KERNEL_CONTRACT.md](./TENANCY_KERNEL_CONTRACT.md), [KERNEL_EXECUTION_MODEL.md](./KERNEL_EXECUTION_MODEL.md) | Quem executa o quê; onde roda cada coisa                    | **FECHADO**                   |
| 6   | **Impressão**                  | [CORE_PRINT_CONTRACT.md](./CORE_PRINT_CONTRACT.md)                                                                   | Core manda; UI pede e mostra estado; falha definida         | **FECHADO** (autoridade)      |
| 7   | **Offline / Degraded Mode**    | [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md)                                                               | Core define fila, sync, o que mostrar; UI obedece           | **FECHADO** (autoridade)      |
| 8   | **KDS** (cozinha)              | [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md)                                                                       | Core manda estado/prioridade/SLA; KDS mostra e confirma     | **FECHADO**                   |
| 9   | **TPV** (caixa)                | [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md) + TPV_INSTALLATION_CONTRACT                       | Core manda pedidos/totais/desconto/fecho; TPV executa       | **FECHADO**                   |
| 10  | **Leis invisíveis** (transversal) | [CORE_INVISIBLE_LAWS_INDEX.md](./CORE_INVISIBLE_LAWS_INDEX.md) + 7 contratos (Failure, Truth, Time, Awareness, Authority, Evolution, Silence) | Falha, verdade, tempo, consciência, autoridade, evolução, silêncio/ruído | **FECHADO** (todos os 7 contratos) |

**Se violar → está errado.**

---

## 🟡 Quem TEM contrato PARCIAL (atenção)

Existem, mas não estão completamente fechados.

| #   | Área                           | Coberto por                                                   | O que falta                                      | Situação real                  |
| --- | ------------------------------ | ------------------------------------------------------------- | ------------------------------------------------ | ------------------------------ |
| 11  | **Notificações** (in-app)      | CORE_OPERATIONAL_COMMUNICATION_CONTRACT (alertas contextuais) | Push / offline não contratados                   | **Limitado**                   |
| 12  | **Web pública** (cliente / QR) | Landing: docs Commercial; fora do OUC por decisão             | CORE_PUBLIC_WEB_CONTRACT (se quiser enforcement) | **Externa ao OS** (deliberado) |

---

## 🔵 Quem NÃO é contrato (e nunca foi)

| #   | Área              | Classificação                                                                                                                                                                                                                                      |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | **Design System** | [CORE_DESIGN_IMPLEMENTATION_POLICY.md](./CORE_DESIGN_IMPLEMENTATION_POLICY.md) — **implementação subordinada**. NÃO manda; NÃO define layout; NÃO define hierarquia; NÃO é fonte de verdade. Se alguém tratar como contrato → **erro conceitual**. |

---

## Próximo passo (quando quiser)

- **CORE_FAILURE_MODEL em código:** Concluído: FailureClassifier, KernelContext.executeSafe com failureClass, ProductContext/SyncEngine/OrderProcessingService/CashRegister/MenuBootstrapService com executeSafe e propagação de failureClass; Scene4Beverages e Scene5Cuisine mostram lastError. Opcional: passar executeSafe nos callers de acceptRequest/open/close/injectPreset quando houver UI que os chame.
- **Áreas parciais:** Notificações (push/offline) e Web pública — fechar com contrato completo só quando houver justificação (ex.: push como canal oficial).
- **Enforcement restante:** Impressão (driver, fila), Offline (service worker, UI de estado), leis invisíveis (limiares N/M/K, heartbeat) evolui quando houver cliente real ou dor concreta.
- **Scope:** Ver [SCOPE_FREEZE.md](../strategy/SCOPE_FREEZE.md); foco em billing, onboarding, Now Engine, gamificação mínima.

---

## Tabela resumo (final)

| Área             | Status de contrato | Situação real        |
| ---------------- | ------------------ | -------------------- |
| UI Operacional   | ✅ TEM             | Fechado              |
| AppStaff         | ✅ TEM             | Fechado              |
| Banco / Domínio  | ✅ TEM             | Fechado              |
| Billing          | ✅ TEM             | Fechado (MVP)        |
| Kernel / Tenancy | ✅ TEM             | Fechado              |
| KDS              | ✅ TEM             | Fechado              |
| TPV              | ✅ TEM             | Fechado              |
| Notificações     | ⚠️ PARCIAL         | Limitado             |
| Web pública      | ⚠️ EXTERNA AO OS   | Deliberado           |
| Impressão        | ✅ TEM             | Fechado (autoridade) |
| Offline          | ✅ TEM             | Fechado (autoridade) |
| Design System    | 🔵 IMPLEMENTAÇÃO   | Subordinado          |
| Leis invisíveis  | ✅ TEM (7 contratos) | Fechado (Failure, Truth, Time, Awareness, Authority, Evolution, Silence) |

---

## Frase final (sem ambiguidade)

**Contrato** define o que é lei.
**Implementação** define como cumprir a lei.
**O resto** é território não-governado.

Agora sabe-se exactamente: quem pode quebrar, quem não pode, e onde não vale a pena mexer ainda.
