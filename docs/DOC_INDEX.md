# Índice da documentação — o que é válido hoje

**Última revisão:** 2026-02
**Objetivo:** Classificar docs em contrato ativo, operacional ou histórico. Nada é apagado; o que não é atual fica arquivado ou referenciado.

**👉 Para entender onde estamos agora:** Ver **[ONDE_ESTAMOS_AGORA.md](ONDE_ESTAMOS_AGORA.md)** e **[ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md)** (estrutura, builds marketing vs completo, deploy Vercel).  
**👉 Deploy (só marketing ou completo):** Ver **[DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)**.  
**👉 O que é v1 (declaração oficial):** Ver **[CHEFIAPP_OS_V1_OFFICIAL.md](CHEFIAPP_OS_V1_OFFICIAL.md)**

---

## Como usar este índice

| Camada          | O que é                                                          | Ação                                                    |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| **CONTRATUAL**  | Por que o código é assim; decisões que não se revertem sem custo | Manter → revisar → marcar como CONTRATO ATIVO           |
| **OPERACIONAL** | Como rodar, demonstrar, usar o sistema                           | Consolidar no README principal; demais apontam para ele |
| **HISTÓRICO**   | Refatorações, caminhos descartados, fases anteriores             | Arquivar em `docs/archive/`; não apagar                 |

---

## 1. Documentação CONTRATUAL (ativa)

Estes documentos definem o contrato técnico e de produto. **Não são repetição do código** — explicam o desenho e os limites.

| Documento                                                                                                  | Descrição                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[CHEFIAPP_OS_V1_OFFICIAL.md](CHEFIAPP_OS_V1_OFFICIAL.md)**                                               | Declaração oficial do produto v1 (freeze): dois cérebros (Config vs Runtime), escopo, fronteira. Baseline para Fase 1 (1000-ready). **CONTRATO ATIVO.**                                                                                                                                              |
| **[STATE_PURE_DOCKER_APP_LAYER.md](STATE_PURE_DOCKER_APP_LAYER.md)**                                       | Estado PURE DOCKER da app layer; onde Supabase ainda existe e por quê. **CONTRATO ATIVO.**                                                                                                                                                                                                          |
| **[SUPABASE_EM_MODO_DOCKER.md](SUPABASE_EM_MODO_DOCKER.md)**                                               | Por que ainda aparece Supabase em Docker (shim, migração gradual, o que já foi ajustado).                                                                                                                                                                                                           |
| **[SETUP_LINEAR_VS_SYSTEM_TREE.md](SETUP_LINEAR_VS_SYSTEM_TREE.md)**                                       | Decisão: System Tree = mapa/audit; Setup Linear = outra UX (GloriaFood-style). Mapas vs estrada.                                                                                                                                                                                                    |
| **[BACKOFFICE_LINEAR_SPEC.md](BACKOFFICE_LINEAR_SPEC.md)**                                                 | Especificação do Backoffice Linear (sidebar, itens, estados, dependências, o que reaproveitar).                                                                                                                                                                                                     |
| **[contracts/EVENTS_AND_STREAMS.md](contracts/EVENTS_AND_STREAMS.md)**                                     | Event Store, streams, nomenclatura de eventos.                                                                                                                                                                                                                                                      |
| **[contracts/EXECUTION_CONTEXT_CONTRACT.md](contracts/EXECUTION_CONTEXT_CONTRACT.md)**                     | Contexto de execução e fronteiras.                                                                                                                                                                                                                                                                  |
| **[contracts/EXECUTION_FENCE_CONTRACT.md](contracts/EXECUTION_FENCE_CONTRACT.md)**                         | Cercas de execução.                                                                                                                                                                                                                                                                                 |
| **[contracts/DOMAIN_WRITE_AUTHORITY_CONTRACT.md](contracts/DOMAIN_WRITE_AUTHORITY_CONTRACT.md)**           | Autoridade de escrita por domínio.                                                                                                                                                                                                                                                                  |
| **[contracts/STATUS_CONTRACT.md](contracts/STATUS_CONTRACT.md)**                                           | Contrato de status do sistema.                                                                                                                                                                                                                                                                      |
| **[SYSTEM_TREE.md](SYSTEM_TREE.md)**                                                                       | System Tree como mapa vivo do sistema (se ainda refletir o desenho atual).                                                                                                                                                                                                                          |
| **[CHEFIAPP_SYSTEM_MAP.html](CHEFIAPP_SYSTEM_MAP.html)**                                                   | Mapa vivo do ChefIApp (visão, camadas, papéis, SystemTree, rotas, fluxos, offline). Página única abrível no browser.                                                                                                                                                                                |
| **[CHEFIAPP_PRODUCT_DOCTRINE.md](CHEFIAPP_PRODUCT_DOCTRINE.md)**                                           | Doutrina do produto: princípios imutáveis, o que nunca será, alma Task System, contrato com o futuro. Referência máxima acima do código.                                                                                                                                                            |
| **[architecture/TASK_SYSTEM_MATRIX_AND_RITUAL.md](architecture/TASK_SYSTEM_MATRIX_AND_RITUAL.md)**         | Task System: matriz por papel (Dono/Gerente/Garçom/Cozinha/Limpeza), momento do turno, tipos (obrigatórias/operacionais/qualidade/exceção), relação com alertas/saúde, XP.                                                                                                                          |
| **[architecture/MENU_CATALOG_VISUAL_SPEC.md](architecture/MENU_CATALOG_VISUAL_SPEC.md)**                   | Menu digital = catálogo visual de decisão (produto real). Conceito funcional, modelo de dados, layout, UX, tablet, editor do restaurante, decisões críticas e anti-patterns.                                                                                                                        |
| **[architecture/MENU_VISUAL_CONTRACT.md](architecture/MENU_VISUAL_CONTRACT.md)**                           | Contrato visual do menu: RestaurantHeader, MenuCategorySection, MenuDishCard, DishModal; layout, spacing, tipografia, breakpoint tablet 11"; narrativa Seduz → Confirma → Executa.                                                                                                                  |
| **[architecture/MENU_VISUAL_RUNTIME_CONTRACT.md](architecture/MENU_VISUAL_RUNTIME_CONTRACT.md)**           | Lei visual-operacional do menu: cabeçalho fixo, página rola por baixo, “vitrine viva”; conteúdo emerge por detrás; onda na base; proibições (ex.: foto de ambiente no hero); execução técnica de referência. Acima de V1/V2/V3; violação = bug de produto.                                          |
| **[architecture/MENU_HEADER_WAVE_CONTRACT.md](architecture/MENU_HEADER_WAVE_CONTRACT.md)**                 | Contrato do header ondulado: camadas, z-index, fundo (nunca branco atrás da onda), SVG da onda, clip-path; anti-patterns. Subordinado a MENU_VISUAL_RUNTIME_CONTRACT.                                                                                                                               |
| **[architecture/APPSTAFF_VISUAL_CANON.md](architecture/APPSTAFF_VISUAL_CANON.md)**                         | Lei Final do AppStaff: identidade visual congelada (Shell, Top Bar, Home, modos, texto, cor); código que viole deve ser rejeitado. Precedência sobre preferência pessoal e sugestões genéricas. APPSTAFF_LAUNCHER, APPSTAFF_HOME_LAUNCHER e APPSTAFF_APPROOT_SURFACE são subordinados a este Canon. |
| **[architecture/APPSTAFF_LAUNCHER_CONTRACT.md](architecture/APPSTAFF_LAUNCHER_CONTRACT.md)**               | Contrato fundacional do AppStaff Launcher: identidade (não web, não dashboard), regras não negociáveis, frase de validação. **Ler antes de alterar /app/staff/home.** Detalhe em APPSTAFF_HOME_LAUNCHER_CONTRACT.                                                                                   |
| **[architecture/APPSTAFF_HOME_LAUNCHER_CONTRACT.md](architecture/APPSTAFF_HOME_LAUNCHER_CONTRACT.md)**     | AppStaff Home = launcher operacional (não dashboard): função, anti-patterns, hierarquia visual, “parece app” vs “parece web”. Subordinado a APPSTAFF_LAUNCHER_CONTRACT e APPSTAFF_BASELINE.                                                                                                         |
| **[architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md](architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md)** | Contrato congelado AppRootSurface: AppStaffHome nunca volta a ser dashboard; proibido banners, texto explicativo, scroll global. Anti-regressão. Subordinado a APPSTAFF_LAUNCHER e APPSTAFF_HOME_LAUNCHER.                                                                                          |
| **[GUIA_VALIDACAO_RUNTIME.md](GUIA_VALIDACAO_RUNTIME.md)**                                                 | Critérios de validação do runtime (trial vs real).                                                                                                                                                                                                                                                  |
| **[BILLING_PRODUCT_MODE_CONTRACT.md](BILLING_PRODUCT_MODE_CONTRACT.md)**                                   | Contrato: como a confirmação de pagamento/contrato ativa productMode live (futuro).                                                                                                                                                                                                                 |
| **[SANDBOX_TPV_PILOT_CONTRACT.md](SANDBOX_TPV_PILOT_CONTRACT.md)**                                         | Contrato: sandbox TPV em modo piloto (pedidos reais com limites ou mesa piloto — futuro).                                                                                                                                                                                                           |
| **[MODO_TRIAL_EXPLICATIVO_SPEC.md](MODO_TRIAL_EXPLICATIVO_SPEC.md)**                                       | Modo Trial Explicativo (Demo Guide): System Tree como modo de leitura (não tela principal); copy por seção; onde some/reaparece.                                                                                                                                                                    |

---

## 2. Documentação OPERACIONAL / produto

Onde está o “como usar” e “como demonstrar”. O **README principal** fica na **raiz do repositório** (`/README.md`).

| O que procurar                                                    | Onde está                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| Visão geral do produto, status, quick start                       | **[README.md](../README.md)** (raiz)                   |
| Landing page (marketing) — Ponto de entrada comercial             | **[LANDING_PAGE_MINIMA.md](LANDING_PAGE_MINIMA.md)**   |
| Landing refinamentos — Melhorias nível Toast                      | **[LANDING_REFINAMENTOS.md](LANDING_REFINAMENTOS.md)** |
| Dashboard modo venda — UX transformada para produto               | **[DASHBOARD_MODO_VENDA.md](DASHBOARD_MODO_VENDA.md)** |
| Demo Guide rápida (5 min) — System Tree, Dashboard, TPV v2, Tasks | **[DEMO_GUIDE_5MIN.md](DEMO_GUIDE_5MIN.md)**           |
| Demo Guide completa (30 min) — Menu Builder, KDS, Tasks, Estoque  | **[DEMO_GUIDE_V1.md](DEMO_GUIDE_V1.md)**               |
| Como rodar testes massivos / auditoria                            | `npm run test:massive`; ver **[testing/](testing/)**   |
| Troubleshooting, fixes conhecidos                                 | **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**           |

Documentos operacionais redundantes com o README devem **apontar para o README** no topo, por exemplo:

> Este conteúdo foi consolidado no [README.md](../README.md). Mantido apenas para referência histórica.

---

## 3. Documentação HISTÓRICA (arquivada)

Refatorações, decisões descartadas, fases experimentais. **Não apagar** — são memória do projeto.

| Local                                                      | Conteúdo                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------ |
| **[docs/archive/](archive/)**                              | Documentos já movidos para arquivo; decisões e refactors passados. |
| **Header em MDs arquivados**                               | Incluir: `Status: ARCHIVED` e `Reason: superseded by [doc].md`     |
| **[ARQUIVAMENTO_REALIZADO.md](ARQUIVAMENTO_REALIZADO.md)** | Status do processo de arquivamento e estatísticas                  |

Exemplos de candidatos a arquivar (se ainda estiverem na raiz de `docs/`): notas de refactor por fase, designs abandonados, fluxos antigos de onboarding. Movê-los para `docs/archive/` em vez de apagar. Ver [CANDIDATOS_A_ARCHIVE.md](CANDIDATOS_A_ARCHIVE.md) para lista completa.

---

## 4. Outros índices e pastas

| Recurso                  | Uso                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| **[INDEX.md](INDEX.md)** | Índice geral por objetivo (design, navegação, integração). Complementar a este DOC_INDEX.                |
| **architecture/**        | Visões de arquitetura e decisões técnicas.                                                               |
| **testing/**             | Estratégia de testes, resultados, guias de QA.                                                           |
| **audit/**               | Auditorias, one-pagers, roadmap executável.                                                              |
| **roadmap/**             | Roadmaps e planos de produto. Ver **[ANALISE_ROADMAP.md](ANALISE_ROADMAP.md)** para análise consolidada. |

---

## 5. Resumo executivo

- **Estado atual (cara do projeto):** [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md) — Estrutura, build só marketing vs completo, deploy Vercel (marketing-only e full).
- **Deploy Vercel:** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) — Passo a passo para deploy só marketing (Root=merchant-portal, build:marketing, dist-marketing) e build completo.
- **Onde estamos:** [ONDE_ESTAMOS_AGORA.md](ONDE_ESTAMOS_AGORA.md) — Resumo e links para estado e deploy.
- **Fase fechada + next:** [FASE_FECHADA_NEXT.md](FASE_FECHADA_NEXT.md) — O que está feito e próximos passos.
- **Estado histórico (jan 2026):** [ESTADO_ATUAL_2026_01_28.md](ESTADO_ATUAL_2026_01_28.md) — Checkpoint anterior
- **Transformação produto:** [TRANSFORMACAO_PRODUTO_COMPLETA.md](TRANSFORMACAO_PRODUTO_COMPLETA.md) — Resumo da transformação de técnico para produto
- **Sessão completa:** [SESSAO_TRANSFORMACAO_PRODUTO.md](SESSAO_TRANSFORMACAO_PRODUTO.md) — Resumo executivo desta sessão
- **Contrato ativo:** [STATE_PURE_DOCKER_APP_LAYER.md](STATE_PURE_DOCKER_APP_LAYER.md) + [contracts/](contracts/) + SYSTEM_TREE e GUIA_VALIDACAO_RUNTIME quando aplicável.
- **Uso e Demo Guide:** README na raiz + DEMO_SCRIPT e TROUBLESHOOTING conforme necessário.
- **Histórico:** tudo que não descreve o estado atual → `docs/archive/` com header ARCHIVED; nada é eliminado.

Atualize este índice quando classificar novos documentos ou mover algo para arquivo.
