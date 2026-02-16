# Web de Configuração — Rotas (referência central)

**Propósito:** Contrato técnico-operacional de todas as rotas da Web de Configuração do ChefIApp OS. Fonte de verdade do fluxo: `CoreFlow.ts`, `FlowGate.tsx`, `LifecycleState.ts`. Mapa canónico: [ROUTES_WEB_VS_OPERATION.md](../implementation/ROUTES_WEB_VS_OPERATION.md).

---

## Visão geral da Web de Configuração

- **Portal do Dono:** Todas as rotas em `docs/routes/web/*.md` são Web de Configuração. Acesso: utilizador autenticado com `hasOrganization === true` (dono). Não há perfis Gerente/Staff na web como muletas; não há modo trial na lógica de produto (Trial real + Demo Guide).
- **Relação com CoreFlow:** `resolveNextRoute()` trata primeiro auth e bootstrap; depois aplica redirect operacional só para TPV/KDS em `systemState === "SETUP"`. Rotas web nunca são bloqueadas por `systemState`, billing ou dados. `isWebConfigPath(path)` devolve true para `/dashboard`, `/app/dashboard`, `/admin/config*`, `/menu-builder`, `/onboarding/first-product`, `/app/billing`, `/billing/success`. Outras rotas acedidas após login com hasOrg (ex.: `/purchases`, `/financial`) ficam ALLOW porque o gate operacional só atua em `isOperationalPath`.
- **Diferença WEB vs OPERAÇÃO:** WEB = configuração, relatórios, billing, pessoas, compras, reservas, etc. — sempre permitida para hasOrg. OPERAÇÃO = TPV, KDS (e App Staff no telemóvel) — em SETUP redireciona para `/onboarding/first-product`. Ref.: [ROUTES_WEB_VS_OPERATION.md](../implementation/ROUTES_WEB_VS_OPERATION.md).

---

## Tabela-resumo de todas as rotas

| Rota                     | Path(s)                                                                                 | Doc                                                            | Estado            |
| ------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------- |
| Compras                  | `/purchases`                                                                            | [compras.md](web/compras.md)                                   | Parcial           |
| Financeiro               | `/financial`                                                                            | [financeiro.md](web/financeiro.md)                             | Parcial           |
| Reservas                 | `/reservations`                                                                         | [reservas.md](web/reservas.md)                                 | Parcial           |
| Multi-Unidade            | `/groups`                                                                               | [multi-unidade.md](web/multi-unidade.md)                       | Documentado       |
| QR Mesa                  | Config: `/admin/config` (Ubicaciones); Público: `/public/:slug/mesa/:number`            | [qr-mesa.md](web/qr-mesa.md)                                   | Parcial + Público |
| Painel Pedidos Prontos   | `/op/kds` (operacional)                                                                 | [painel-pedidos-prontos.md](web/painel-pedidos-prontos.md)     | Documentado       |
| Pessoas                  | `/admin/config/empleados`                                                              | [pessoas.md](web/pessoas.md)                                   | Funcional         |
| Mentor IA                | `/mentor`                                                                               | [mentor-ia.md](web/mentor-ia.md)                               | Parcial           |
| Billing                  | `/app/billing`, `/billing/success`                                                      | [billing.md](web/billing.md)                                   | Funcional         |
| Configuração Operacional | `/admin/config` (general, ubicaciones, empleados, integrations, etc.) *(legado /config eliminado; redireciona para /admin/config)* | [configuracao-operacional.md](web/configuracao-operacional.md) | Funcional         |
| Presença Online          | `/admin/config` (Geral/Ubicaciones); Público: `/public/:slug`                         | [presenca-online.md](web/presenca-online.md)                   | Funcional         |
| Percepção Operacional    | `/admin/config`                                                                        | [percepcao-operacional.md](web/percepcao-operacional.md)       | Parcial           |
| AppStaff (visão web)     | Dashboard módulo AppStaff (informativo)                                                 | [appstaff-web.md](web/appstaff-web.md)                         | Funcional         |

---

## Princípios de design

- **Nunca return null na web:** Nenhuma rota web termina em `return null`; usar loading ou estado vazio com CTA. Ref.: DashboardPortal, [RETURN_NULL_AUDIT.md](../implementation/RETURN_NULL_AUDIT.md).
- **Nunca bloquear por setup na web:** O redirect para `/onboarding/first-product` aplica-se apenas a rotas operacionais (TPV/KDS). Rotas web são sempre ALLOW para hasOrg.
- **Nunca bloquear por billing na web:** Acesso à web de configuração não depende de plano pago; trial é real.
- **Contrato técnico:** Cada ficheiro em `web/*.md` descreve Tipo, Caminho(s), Objetivo, Quem acessa, Estados do Sistema, Conexão com o Core, Fonte de Dados, Impacto Operacional, Estado Atual e Próximos Passos.

---

## Referências oficiais

- **CoreFlow:** `merchant-portal/src/core/flow/CoreFlow.ts` (`isWebConfigPath`, `isOperationalPath`, `resolveNextRoute`)
- **FlowGate:** `merchant-portal/src/core/flow/FlowGate.tsx`
- **LifecycleState:** `merchant-portal/src/core/lifecycle/LifecycleState.ts`
- **Mapa rotas:** [implementation/ROUTES_WEB_VS_OPERATION.md](../implementation/ROUTES_WEB_VS_OPERATION.md)
- **Declaração pós-refatoração:** [DECLARACAO_POS_REFATORACAO_WEB_V1.md](../DECLARACAO_POS_REFATORACAO_WEB_V1.md)
- **Diagrama Web ↔ Core ↔ Operação:** [DIAGRAMA_WEB_CORE_OPERACAO.md](DIAGRAMA_WEB_CORE_OPERACAO.md)
- **Manual Oficial ChefIApp OS:** [MANUAL_OFICIAL_CHEFIAPP_OS.md](../MANUAL_OFICIAL_CHEFIAPP_OS.md)
- **Índice web-config (alternativo):** [web-config/INDEX_WEB_CONFIG.md](../web-config/INDEX_WEB_CONFIG.md)

---

## Landing e páginas de marketing (fonte oficial)

**Contrato canónico (imutável):** [strategy/LANDING_CANON.md](../strategy/LANDING_CANON.md).

- **Landing (única)**: `merchant-portal/src/pages/LandingV2/LandingV2Page.tsx`. URL em dev: **http://localhost:5175/landing-v2** (ou `/v2`). Não existe outro projeto nem outra landing; toda a evolução de marketing faz-se aqui.
- **Blog (TPV restaurantes)**: `merchant-portal/src/pages/Blog/BlogTPVRestaurantesPage.tsx`. Rotas públicas **/blog** e **/blog/tpv-restaurantes** (mesmo conteúdo). Conteúdo honesto sobre TPV/POS para restaurantes, SEO (meta, canonical, JSON-LD Article). Link no navbar e footer da landing.
- **Blog (TPV vs POS fiscal)**: `merchant-portal/src/pages/Blog/BlogTPVVsPOSFiscalPage.tsx`. Rota pública **/blog/tpv-vs-pos-fiscal**. Artigo sobre diferença entre TPV operacional e POS fiscal; ChefIApp em paralelo ao fiscal. Cross-links com o outro artigo e changelog.
- **Blog (Quando abrir e fechar caixa)**: `merchant-portal/src/pages/Blog/BlogQuandoAbrirFecharCaixaPage.tsx`. Rota pública **/blog/quando-abrir-fechar-caixa**. Artigo sobre abertura/fecho de caixa e turno — só o que existe no código (uma caixa, saldo inicial, fecho declarado, Z-Report). Cross-links com os outros artigos.
- **Changelog**: `merchant-portal/src/pages/Changelog/ChangelogPage.tsx`. Rota pública **/changelog**. Lista de alterações reais em produção (sem marketing). Link no footer da landing (Empresa).
- **Segurança e dados**: `merchant-portal/src/pages/Security/SecurityPage.tsx`. Rota pública **/security**. Afirmações verificáveis sobre acesso, dados e privacidade; sem certificações que não existam. Link no footer (Legal).
- **Estado do sistema**: `merchant-portal/src/pages/Status/StatusPage.tsx`. Rota pública **/status**. Página estática de transparência; sem uptime % até haver endpoint público. Link no footer (Suporte).
- **Página Web Pública do restaurante**: `merchant-portal/src/pages/PublicWeb/PublicWebPage.tsx`. Presença online do restaurante (menu público, pedidos web), não marketing do produto ChefIApp™.

---

## Validação paths (2026-02-01)

Paths em `docs/routes/web/*.md` conferidos com `merchant-portal/src/App.tsx`: `/purchases`, `/financial`, `/reservations`, `/groups`, `/mentor`, `/app/billing`, `/billing/success`, `/config` e subpaths existem. `isWebConfigPath` em CoreFlow.ts cobre apenas `/dashboard`, `/app/dashboard`, `/config*`, `/menu-builder`, `/onboarding/first-product`, `/app/billing`, `/billing/success`; `/purchases`, `/financial`, `/reservations`, `/groups`, `/mentor` ficam ALLOW por não serem operacionais (gate só redireciona em SETUP + isOperationalPath). Comportamento documentado está correto.

Última atualização: 2026-02-12.
