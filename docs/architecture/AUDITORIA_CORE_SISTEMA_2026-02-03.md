## 1️⃣ VISÃO GERAL DO SISTEMA

- **O que o sistema É hoje (repositório atual)**

  - **[CODE]** Portal operacional (`merchant-portal`) que assume **Core financeiro soberano em Docker** (PostgREST) como backend de domínio para: Menu, TPV, KDS, Billing e parte de Orders.
  - **[CODE]** Motor de prontidão operacional (**ORE**) implementado e usado como gate em TPV/KDS/config.
  - **[CODE]** Menu Core implementado com estados operacionais (EMPTY / INCOMPLETE / VALID_UNPUBLISHED / LIVE) e consumido por TPV/KDS/Dashboard.
  - **[CODE]** Billing Stripe via Docker Core.
  - **[PARTIAL]** Soberania financeira: criação de pedidos já via Core, **mas** várias atualizações de pedido ainda via Supabase.
  - **[PARTIAL]** Auth em **quarentena Supabase** (explicitamente marcado como temporário).

- **O que ele NÃO É ainda (apesar dos contratos)**
  - **[DOC ONLY]** “Core Auth” próprio soberano (há contrato, não há implementação real).
  - **[DOC ONLY]/[PARTIAL]** “Modo offline”/degradado robusto quando Core Docker está em baixo (hoje existe só bloqueio via ORE + algumas mensagens, não há fluxo operacional alternativo).
  - **[DOC ONLY]** Enforcement automático global de anti‑Supabase para domínio (existe checklist e contratos; no código ainda há pelo menos uma violação crítica em Orders).
  - **[DOC ONLY]/[PARTIAL]** Engines avançadas derivadas (algumas conceptuais em `ORE_ORGANISM_AND_MENU.md`, `MENU_DERIVATIONS.md`, `OPERATIONAL_READINESS_ENGINE.md`) não estão todas materializadas como motores isolados; muito está embutido em hooks/componentes.

---

## 2️⃣ COMPONENTES IMPLEMENTADOS (REALIDADE)

Classificação conservadora baseada em código real vs contratos:

| Componente                    | Estado               | Notas técnicas                                                                                                                                                               |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker Core (Financeiro)      | **[CODE]**           | Client PostgREST (`dockerCoreFetchClient.ts`), `coreOrSupabaseRpc.ts` força Core; Billing e parte de Orders só via Core.                                                     |
| Menu Core                     | **[CODE]**           | Estado/derivações implementados (`MenuState`, hooks `useMenuItems`, `MenuWriter`, `useDynamicMenu`, `MenuBuilderCore`).                                                      |
| MenuState                     | **[CODE]**           | Estados EMPTY / INCOMPLETE / VALID_UNPUBLISHED / LIVE implementados e usados por ORE e Dashboard.                                                                            |
| ORE (useOperationalReadiness) | **[CODE]**           | Hook/gate implementado e usado em TPV, KDS, config etc; bloqueios e mensagens humanas presentes.                                                                             |
| TPV                           | **[CODE]**           | `TPVMinimal` e TPV real usam ORE, consomem Menu via Core, criam pedidos no Core; preço como snapshot.                                                                        |
| KDS                           | **[CODE]**           | `KDSMinimal` consome pedidos/itens via Core; zero preço na UI, obedece ORE.                                                                                                  |
| QR/Web público                | **[CODE]**           | Rotas e página pública (`PublicWebPage`); depende do Core para dados de menu/pedido (conforme contratos).                                                                    |
| Dashboard (sinal vital)       | **[CODE]**           | `DashboardPortal` usa `useMenuState` como vital; mostra mensagens de estado; não bloqueia operação.                                                                          |
| Config / Sidebar              | **[CODE]**           | Sidebar Admin/Config implementada, estados de navegação reais; várias rotas de config existentes.                                                                            |
| Tasks                         | **[CODE]/[PARTIAL]** | Páginas de Tasks e TaskSystem existem; consumo do Core/documento de Tasks é mais superficial que contratos aspiram.                                                          |
| Stock / Inventory             | **[PARTIAL]**        | Páginas tipo `StockRealPage`, `Purchases*` existem, mas motor soberano de stock/ledger completo não está claramente ao nível dos contratos – uso parcial de Core e Supabase. |
| Relatórios                    | **[PARTIAL]**        | Serviço de reporting (`AdvancedReportingService`) e páginas de Financial/Reports existem mas não exaustivos vs visão em docs.                                                |
| Bootstrap                     | **[CODE]**           | `BootstrapPage`, fluxo de criação de restaurante/menu inicial implementado, ligado ao Core e ORE.                                                                            |
| Tenant resolution             | **[CODE]**           | `TenantContext`, `RestaurantRuntimeContext`, `RuntimeContext` etc. resolvem tenant/restaurantId via Core/URL.                                                                |
| Billing                       | **[CODE]**           | `coreBillingApi` e função Stripe webhook em `supabase/functions` usam exclusivamente Docker Core.                                                                            |
| Auth                          | **[PARTIAL]**        | `useSupabaseAuth` com **banner TEMPORARY**; Docker mode ignora Supabase; Core Auth ainda só em contrato.                                                                     |

Notas:

- Sempre que uma funcionalidade depende de Supabase **para domínio**, marcar como **[PARTIAL]** ou **[VIOLATION]**; quando é só Auth temporário, é aceite como exceção consciente.
- Sempre que algo assume Core 3001 ativo (Docker Core), isto significa que **falha se Core estiver offline**: TPV/KDS/Config avançada, Billing, Orders.

---

## 3️⃣ O QUE AINDA NÃO EXISTE (SÓ DOC / PARCIAL)

Exemplos de gaps entre arquitetura e código:

- **Core Auth soberano**

  - **[DOC ONLY]** em `CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md` e docs de Auth.
  - Código atual usa `useSupabaseAuth` (quarentena), e Docker mode basicamente ignora autenticação Core.

- **Enforcement completo da Anti‑Supabase**

  - `ANTI_SUPABASE_CHECKLIST.md` define que Supabase **não pode** ser backend de domínio.
  - No código ainda existe Supabase a escrever domínio financeiro (ver secção de violações).

- **ORE como organismo completo, com todos os músculos não‑UI externalizados**

  - `ORE_ORGANISM_AND_MENU.md`, `NON_MUSCLE_INFRASTRUCTURE_CONTRACT.md` descrevem uma separação forte entre organismo (decisão) e músculos (UI/infra).
  - **[PARTIAL]**: muitas decisões já vivem no ORE/hook e em gates (`RequireOperational`), mas ainda há decisões de UX e fallback embutidas em componentes e hooks de alto nível.

- **Modo offline/“Local Human Safe Mode” real**

  - Contratos e docs (e.g. `FASE_5_LOCAL_HUMAN_SAFE_MODE.md` etc.) falam de operação local/degradada.
  - No código atual, **[DOC ONLY]/[PARTIAL]**: quando Core cai, ORE bloqueia e mostra mensagem; não há fluxo offline completo de venda.

- **Engines avançadas de stock, reporting e tarefas**
  - Vários docs em `CORE_CONTRACT_INDEX.md` e docs de stock/reporting descrevem um modelo mais rigoroso de ledger/relatórios.
  - Código de `StockRealPage`, `Purchases*`, `AdvancedReportingService` e Tasks está mais perto de MVP do que do contrato ideal (camadas, derivadas e garantias incompletas).

---

## 4️⃣ DESALINHAMENTOS E PROBLEMAS

Foco em **[VIOLATION]** e desalinhamentos claros entre contrato e código.

### 4.1 Uso indevido de Supabase em domínio

- **`OrderProjection.ts` – VIOLAÇÃO CRÍTICA**
  - Contrato: `CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md` + `ANTI_SUPABASE_CHECKLIST.md` → Supabase **não pode** ser backend de domínio financeiro.
  - **[VIOLATION]**: funções como `persistOrderItem`, `persistRemoveItem`, `persistUpdateItemQty`, `persistOrderStatus` escrevem diretamente em tabelas de domínio via `supabase.from(...)`.
  - Ao mesmo tempo, `persistOrder` (criação do pedido) já foi migrado para Docker Core (`createOrderAtomic`).
  - Resultado: **criamos pedidos no Core** mas **atualizamos partes no Supabase**, quebrando a soberania e abrindo risco de divergência.

### 4.2 Lógica implícita / UI a decidir o que deveria ser do ORE

- Em geral, ORE cobre readiness para TPV/KDS/config, mas ainda se encontram padrões como:
  - Componentes individuais a fazer **checks diretos de Docker/Core** (e.g. `isDockerCoreAvailable`) para mostrar/ocultar coisas, em vez de sempre passar pelo ORE.
  - Mensagens e pequenos “gates” locais em páginas de config/UX que replicam decisões que podiam estar centralizadas no ORE.
- Classificação: **[PARTIAL]** em termos de adesão ao princípio “ORE decide, UI só mostra”.

### 4.3 Rotas e contratos

- Em geral, `App.tsx` está **alinhado** com `ROTAS_E_CONTRATOS.md`, **mas**:
  - Algumas rotas novas/experimentais (ex.: páginas específicas de demos/mentoria/sistema interno) não têm contrato explícito com o mesmo detalhe dos docs.
  - Classificação: **rotas com contrato genérico** – cobertas pelo espírito de Portal/Operacional, não por docs específicos.

### 4.4 Menu / Preço / Soberania operacional

- TPV utiliza produtos vindos do Menu Core (via Core Docker) e guarda um snapshot de preço no pedido → **respeita “preço nunca recalculado fora do menu”** no fluxo real do TPV.
- KDS não exibe preço → **respeita `MENU_DERIVATIONS`**.
- Não foi encontrado recalculo de preço ad‑hoc na UI.
- O risco atual está mais em **dependências parciais de Supabase** do que em recalcular preço.

---

## 5️⃣ ROTAS

Comparação de alto nível entre `App.tsx` e `ROTAS_E_CONTRATOS.md`:

### 5.1 Rotas que batem com contratos ([CODE] + contrato claro)

| Rota / Grupo                                    | Estado     | Fonte/Contrato principal                                   |
| ----------------------------------------------- | ---------- | ---------------------------------------------------------- |
| `/`, `/landing`, páginas públicas               | **[CODE]** | `ROTAS_E_CONTRATOS.md` + docs de Landing                   |
| `/auth`, `/login`, `/signup`, `/demo`           | **[CODE]** | Auth & Entry contract; demo path documentado               |
| `/bootstrap`                                    | **[CODE]** | Contrato de bootstrap/onboarding                           |
| `/app/dashboard`, `/dashboard`                  | **[CODE]** | Portal Management + Dashboard contrato                     |
| `/config/*` (location, people, etc.)            | **[CODE]** | Portal/Config contracts; estados EMPTY/INCOMPLETE mapeados |
| `/menu-builder`                                 | **[CODE]** | `MENU_CORE_CONTRACT`, `MENU_OPERATIONAL_STATE`             |
| `/op/tpv`, `/op/kds`                            | **[CODE]** | Operacional + ORE; gates ORE ativos                        |
| `/op/cash`, `/op/staff`                         | **[CODE]** | Operacional; gates via ORE/RequireOperational              |
| `/public/*` (QR / Web público)                  | **[CODE]** | Contratos de Public Web / QR                               |
| `/app/billing`                                  | **[CODE]** | Core Billing & Payments contract                           |
| `/tasks`, `/people`, `/purchases`, `/financial` | **[CODE]** | Portal Management; docs de Tasks/Finance                   |

### 5.2 Rotas sem contrato específico (mas cobertas por contratos gerais)

Rotas como:

- `/owner/*`, `/manager/*`, `/employee/*`, `/system-tree`, `/mentor`
  - **[CODE]** em `pages`, mas em `ROTAS_E_CONTRATOS.md` aparecem mais como agrupamentos genéricos ou nem sempre com contrato tão detalhado.
  - Classificação: **“rotas com contrato genérico”** – cobertas pelo espírito de Portal/Operacional, não por docs específicos.

### 5.3 Rotas com comportamento diferente do documentado

- Não foram identificadas discrepâncias grosseiras tipo “/demo devia ser uma coisa e é outra completamente distinta”.
- O exemplo `/demo` hoje aponta para um fluxo de demonstração coerente com os docs de Demo/Onboarding.
- Se há divergências, são de detalhe (texto/copy, sequência de passos), não de **intenção arquitetónica**.

---

## 6️⃣ RISCOS ATUAIS

### 6.1 Riscos técnicos

- **Dependência crítica do Docker Core (porta 3001)**

  - Se Docker Core estiver em baixo, **TPV/KDS/Config/ Dashboard dependentes de Core falham**.
  - ORE detecta e bloqueia com mensagens, mas **não existe modo offline real** → risco de downtime total.

- **OrderProjection parcialmente migrado (Supabase + Core)**

  - Criação de pedidos no Core, mas atualizações em Supabase.
  - **Risco alto** de divergência de estado entre sistemas.

- **Auth ainda em Supabase**

  - Enquanto Core Auth não existir, o sistema depende de um provedor externo com semântica diferente das regras de soberania.

- **Infra de stock/reporting/tasks menos formal que docs**
  - Implementação mais MVP; se tomada como “pronta”, pode não respeitar todas as invariantes esperadas pelos contratos de ledger/relatórios.

### 6.2 Riscos de produto

- **Core offline = restaurante parado**

  - Não há “modo caderno”/safe mode; o contrato fala disso, o código não.
  - Qualquer instabilidade de Core impacta diretamente a operação.

- **Áreas de config/rotas menos polidas (Tasks/People/Stock)**

  - Degradam confiança: telas vazias, erros pouco humanos, dependência de dados perfeitos.

- **Auth temporário**
  - Fluxos de onboarding/coexistência de tenants podem ter esquinas estranhas por causa da dependência Supabase.

### 6.3 Riscos de escalar equipa

- **Arquitetura muito bem documentada, mas enforcement parcial**

  - Novos devs podem ler contratos e assumir que tudo já está “blindado”; não está – há exceções importantes (Orders/Supabase).
  - Falta tooling automático (lint/grep) para bloquear uso de Supabase em domínio.

- **Conceitos avançados (ORE, organism, muscles)**
  - Não estão sempre isolados em módulos claros; parte vive em componentes/hook misturados, o que aumenta a curva de aprendizagem.

### 6.4 Riscos de produção real (restaurante aberto)

- **Risco 1 – Core down**: restaurante sem TPV/KDS se Core cair.
- **Risco 2 – Inconsistência financeira**: misturar Supabase/Core em Orders torna mais difícil auditar vendas/pagamentos.
- **Risco 3 – Auth externo**: dependência em Supabase Auth, com impacto se política/estado externo mudar.
- **Risco 4 – Áreas secundárias**: Tasks/Stock/Reports menos robustos podem não suportar operações reais intensivas (mas não bloqueiam primeira venda).

---

## 7️⃣ VEREDITO FINAL

| Nível                     | Pronto?             | O que BLOQUEIA / condiciona                                                                                                                                            |
| ------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Uso interno**           | **Sim**             | Com a nota de que a violação em `OrderProjection` deve ser corrigida o quanto antes.                                                                                   |
| **Restaurante real (P1)** | **Sim, mas frágil** | Core Docker tem de estar sempre estável; `OrderProjection` ainda em violação; não há modo offline.                                                                     |
| **Escala B2B**            | **Não**             | Falta eliminar Supabase de domínio (Orders), implementar Core Auth, reforçar stock/reporting, criar tooling de enforcement arquitetural e modos de falha mais seguros. |

Recomendações imediatas:

1. Priorizar **P0 técnico**: migração completa de `OrderProjection` para Docker Core e varredura anti‑Supabase em domínio.
2. Desenhar e implementar um **modo degradado aceitável** quando Core estiver down (observabilidade + decisão clara de operação/não operação).
3. Definir roadmap para **Core Auth** e remoção progressiva da dependência de Supabase Auth.
4. Reforçar stock/reporting/tasks para aproximar o código dos contratos canónicos antes de escalar para B2B.
