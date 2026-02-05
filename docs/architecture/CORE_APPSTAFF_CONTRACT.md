# Contrato do AppStaff — Core

## Lei do sistema

**O AppStaff não é um app. É o terminal humano do ChefIApp OS.**

**Plataforma (lei dos 4 terminais):** AppStaff é o terminal humano do OS (trabalha). O terminal pode rodar em **mobile** (iOS/Android, projecto `mobile-app` Expo) ou, **em piloto**, **dentro do merchant-portal** (web, rotas `/garcom` ou equivalentes) para velocidade e menos risco; separação futura em `apps/staff` ou app mobile permanece possível.

**Piloto (escopo actual):** Para o piloto fechado, AppStaff é entregue **no merchant-portal** (web): as rotas de staff renderizam o terminal (Staff Home, Tasks, Orders Lite, KDS Lite, Inventory Lite, Shift/Handover). Não é apenas mensagem «Disponível apenas no app mobile». O Core e os contratos (Identity, Turn, Tasks, Order Status, ACCESS_RULES_MINIMAL) aplicam-se igualmente; RBAC por papel (Owner, Manager, Staff, Kitchen, etc.) governa o que cada um vê e pode fazer.

Este documento é contrato formal no Core. Não é sugestão. O AppStaff é a interface viva do sistema com pessoas: o ponto onde operação, disciplina, informação e feedback se encontram. O sistema fala com humanos através dele; não o contrário.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Definição

| Erro                         | Correto                                 |
| ---------------------------- | --------------------------------------- |
| App de funcionário genérico  | Terminal humano do OS                   |
| Lista de módulos / navegação | Resposta a quatro perguntas do Core     |
| Features soltas              | Seis contratos internos ligados ao Core |

O AppStaff **não** decide regras. O Core decide. O AppStaff **mostra**, **confirma**, **executa** e **reporta**.

---

## 2. Contrato macro (quatro perguntas)

Tudo no AppStaff deriva destas quatro perguntas. Não de navegação. Não de módulos soltos.

1. **Quem é este humano no sistema agora?** → Identity & Presence
2. **O que o sistema espera dele hoje?** → Time, Turn & Duty
3. **O que ele precisa saber agora?** → Operational Awareness + Financial Visibility
4. **O que ele pode (ou não) fazer?** → Task Execution + Communication (contextual)

Cada pergunta é coberta por um ou mais subcontratos. Ver secção 3.

---

## 3. Camadas do contrato (seis subcontratos)

| #   | Contrato              | Pergunta principal                                | Documento                                                                                          |
| --- | --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Identity & Presence   | Quem é este humano?                               | [CORE_APPSTAFF_IDENTITY_CONTRACT.md](./CORE_APPSTAFF_IDENTITY_CONTRACT.md)                         |
| 2   | Time, Turn & Presence | Quando está em turno? Como regista?               | [CORE_TIME_AND_TURN_CONTRACT.md](./CORE_TIME_AND_TURN_CONTRACT.md)                                 |
| 3   | Task & Duty           | O que deve executar? Com que peso?                | [CORE_TASK_EXECUTION_CONTRACT.md](./CORE_TASK_EXECUTION_CONTRACT.md)                               |
| 4   | Operational Awareness | O que está a acontecer agora?                     | [CORE_OPERATIONAL_AWARENESS_CONTRACT.md](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md)                 |
| 5   | Financial Visibility  | Que impacto tem o meu turno? (ver, não controlar) | [CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md](./CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md) |
| 6   | Communication         | Como comunicar sem caos?                          | [CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md](./CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md)         |

---

## 4. Papel do Core vs AppStaff

| Core                 | AppStaff  |
| -------------------- | --------- |
| Decide               | Executa   |
| Valida               | Visualiza |
| Regista              | Confirma  |
| Aplica consequências | Aprende   |

Esta separação impede: abuso, caos, app inchado, perda de controlo.

---

## 5. Modelo mental (resumo visual)

```
Core
 ├─ Identidade
 ├─ Tempo & Turno
 ├─ Tarefas
 ├─ Métricas
 ├─ Financeiro (visibilidade)
 ├─ Comunicação (contextual)
 ↓
AppStaff
 ├─ Perfil
 ├─ Check-in/out
 ├─ Execução de tarefas
 ├─ Consciência operacional (mini KDS, mini TPV)
 ├─ Feedback financeiro (não controlo)
 └─ Comunicação mínima
```

---

## 6. Onde o contrato se aplica

| Área                                                              | Contrato AppStaff aplica?                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **AppStaff (mobile)** — iOS/Android, projecto `mobile-app` (Expo) | Sim. Terminal real: tarefas, mini KDS, mini TPV, check-in, perfil, comunicação.                                          |
| **Web (merchant-portal) — piloto** — rotas `/garcom`, `/garcom/*` | Sim. Terminal staff no piloto: Staff Home, Tasks, Orders Lite, KDS Lite, Inventory Lite, Shift/Handover; RBAC por papel. |
| Dashboard (painel AppStaff no web, fora do piloto)                | Se piloto activo: mesmo que acima; senão: mensagem «Disponível apenas no app mobile» ou redirecionamento.                |
| Dashboard owner/manager (não staff)                               | Não (OUC aplica; AppStaff contract não)                                                                                  |
| Rotas públicas, landing                                           | Não                                                                                                                      |
| Backoffice (config, billing)                                      | Não                                                                                                                      |

---

## 7. Resumo

1. **AppStaff = terminal humano do OS**, não app genérico.
2. **Quatro perguntas** (quem, o que espera, o que precisa saber, o que pode fazer) definem o conteúdo.
3. **Seis subcontratos** formalizam identidade, tempo/turno, tarefas, consciência operacional, visibilidade financeira e comunicação.
4. **Core decide; AppStaff executa.** Nada no AppStaff calcula horas, define regras de check-in ou altera finanças; mostra o que o Core decidiu.

Design sem contrato vira app genérico. Terminal sem contrato vira caos. Este documento é a lei do AppStaff no Core.

---

## 8. Plataforma (decisão fixa + piloto)

| Onde roda AppStaff                    | Observação                                                                                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📱 iOS/Android (`mobile-app`, Expo)   | Terminal real móvel; suportado.                                                                                                                                                                |
| 🌐 **Merchant-portal (web) — piloto** | Durante o piloto, o terminal staff roda no merchant-portal: rotas `/garcom` (e equivalentes) renderizam Staff Home, Tasks, Orders Lite, KDS Lite, Inventory Lite, Shift/Handover; RBAC aplica. |
| Rotas desktop (KDS/TPV dedicados)     | KDS/TPV são terminais distintos; não são AppStaff.                                                                                                                                             |

**Piloto:** No merchant-portal, as rotas de staff **renderizam o terminal** (não apenas mensagem «Disponível apenas no app mobile»). Separação futura em `apps/staff` ou reforço do `mobile-app` permanece possível sem alterar a lei dos 4 terminais.

---

## 9. Implementação canónica (o AppStaff que foi criado no Core)

O AppStaff definido neste contrato e nos seis subcontratos **já existe** em duas formas: (1) **Piloto:** no **merchant-portal** (web), em `merchant-portal/src/pages/AppStaff/` — Staff Home, ManagerDashboard, tarefas, ReflexEngine, StaffContext, Orders Lite, KDS Lite, etc.; (2) **Mobile:** no projecto **`mobile-app`** (Expo, iOS/Android). Durante o piloto, o terminal staff é entregue no merchant-portal; separação futura em `apps/staff` ou reforço do `mobile-app` permanece possível. É este o terminal humano do OS ligado ao Core — não uma lista de módulos soltos nem ecrãs legacy.

| Elemento contratual                                  | Onde está no `mobile-app`                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tarefas** (mostrar, confirmar, executar)           | Tab **Turno** (`staff.tsx`): NowActionCard, acção do momento, completeAction.                                                              |
| **Mini TPV** (contexto pedidos, pagamento)           | Tab **Turno**: QuickPayModal, FinancialVault quando acção = collect_payment. Tab **Cardápio** (`index.tsx`): menu, carrinho, criar pedido. |
| **Mini KDS** (pedidos, estado, tempo)                | Tab **Cozinha** (`kitchen.tsx`): visualização fila/estado. Tab **Pedidos** (`orders.tsx`): lista de pedidos.                               |
| **Check-in / Check-out**                             | Tab **Turno**: ecrã "Iniciar turno" quando fora de turno; "Encerrar turno" no BottomActionBar.                                             |
| **Perfil**                                           | Tab **Conta** (`two.tsx`).                                                                                                                 |
| **Consciência operacional** (atrasos, fila, pressão) | Hooks e componentes (useKitchenPressure, KitchenPressureIndicator, etc.); dados do Core.                                                   |

**Escopo contratual do piloto:** Os tabs visíveis na barra são **Turno, Mesas, Cardápio, Pedidos, Cozinha, Bar/Gestão (por papel), Conta**. Ranking e Conquistas **não** fazem parte do escopo obrigatório do [CORE_MOBILE_TERMINALS_CONTRACT](./CORE_MOBILE_TERMINALS_CONTRACT.md) (mini TPV, mini KDS, tarefas, check-in, perfil, mural, chat técnico); ficam fora da barra por defeito. Qualquer UI que não seja mini TPV, mini KDS ou tarefas ligadas ao Core é legacy até migração (ver [CORE_APPSTAFF_IOS_UIUX_CONTRACT](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md)).

**Runtime e UI/UX:** Comunicação apenas com Docker Core; UI canónica usa tokens do core-design-system. Ver [CORE_MOBILE_TERMINALS_CONTRACT](./CORE_MOBILE_TERMINALS_CONTRACT.md) e [CORE_APPSTAFF_IOS_UIUX_CONTRACT](./CORE_APPSTAFF_IOS_UIUX_CONTRACT.md).

---

## 10. Auditoria (estado actual vs contrato)

Para mapear o que existe, violações e ausências face a estes contratos, e prioridades de correcção, ver:

- **[APPSTAFF_AUDIT_VS_CONTRACTS.md](./APPSTAFF_AUDIT_VS_CONTRACTS.md)** — Auditoria do AppStaff (terminal em `mobile-app`) contra os seis subcontratos; priorização dinheiro / risco / valor.
