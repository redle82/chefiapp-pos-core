# Índice — Checklists de implementação

Documento de referência única para as checklists técnicas do roadmap pós-fundação. Ver também: `docs/ROADMAP_POS_FUNDACAO.md`, `docs/ESTADO_CONSOLIDADO_SISTEMA.md`.

**Próximo passo (FASE 5):** FASE C feita; FASE B E2E local PASSOU (2026-02-01). Próximo executável: 1) [Supabase deploy](FASE_5_SUPABASE_DEPLOY.md) → 2) [FASE B em Supabase](FASE_5_FASE_B_SUPABASE_RUNBOOK.md) (URL real) → 3) Se PASSOU → [Primeiro cliente pagante €79](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md). Local = dev-only ([Local ≠ Produção](FASE_5_LOCAL_NAO_PRODUCAO.md)).

---

## Roadmap em fases — Status

| Fase | Nome                       | Status                | Checklist                                                                                  |
| ---- | -------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| 0    | Fundação                   | Fechada               | —                                                                                          |
| 1    | Bootstrap do Restaurante   | Concluída             | [FASE_1_BOOTSTRAP_RESTAURANTE_CHECKLIST.md](FASE_1_BOOTSTRAP_RESTAURANTE_CHECKLIST.md)     |
| 2    | Menu, Inventário e Estoque | Quase completa        | [FASE_2_MENU_INVENTARIO_ESTOQUE_CHECKLIST.md](FASE_2_MENU_INVENTARIO_ESTOQUE_CHECKLIST.md) |
| 3    | Pessoas e Tarefas          | Concluída             | [FASE_3_PESSOAS_TAREFAS_CHECKLIST.md](FASE_3_PESSOAS_TAREFAS_CHECKLIST.md)                 |
| 4    | Presença Digital           | Concluída             | [FASE_4_PRESENCA_DIGITAL_CHECKLIST.md](FASE_4_PRESENCA_DIGITAL_CHECKLIST.md)               |
| 5    | Consolidação               | Documentada (pós-€79) | [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md)                       |

---

## Outros documentos em `implementation/`

- **FASE_2_OWNER_ONLY_WEB.md** — Refatoração: web de configuração exclusiva do Dono; eliminação explícita de perfis Gerente/Staff na web; checklist técnica. Ref.: [CONTRATO_OWNER_ONLY_WEB](../contracts/CONTRATO_OWNER_ONLY_WEB.md).
- **ROUTES_WEB_VS_OPERATION.md** — Mapa de rotas WEB (configuração) vs OPERAÇÃO (TPV/KDS); guard padrão; regra “nunca return null na web”; /demo e /demo-guiado. Ref.: CoreFlow.ts.
- **[DECLARACAO_POS_REFATORACAO_WEB_V1.md](../DECLARACAO_POS_REFATORACAO_WEB_V1.md)** — Declaração oficial pós-refatoração (v1 congelada): eliminado (DEMO, perfis Gerente/Staff na web); estado canónico; /demo-guiado Opções A/B; veredito. Ref.: CONTRATO_TRIAL_REAL, CONTRATO_OWNER_ONLY_WEB.
- **RETURN_NULL_AUDIT.md** — Auditoria de `return null` perigosos; correções para nunca ecrã vazio.
- **Web de Configuração (rotas documentadas):** [../web-config/INDEX_WEB_CONFIG.md](../web-config/INDEX_WEB_CONFIG.md) — Índice e documentos por rota (Compras, Financeiro, Reservas, Multi-Unidade, QR Mesa, Painel Pedidos Prontos, Mentor IA, Presença Online). Um doc por rota com path, guard, SystemState, Core, backend e UI.
- **Rotas Web (contrato técnico-operacional):** [../routes/README_WEB_ROUTES.md](../routes/README_WEB_ROUTES.md) — README central e 13 docs em `docs/routes/web/*.md` (compras, financeiro, reservas, multi-unidade, qr-mesa, painel-pedidos-prontos, pessoas, mentor-ia, billing, configuracao-operacional, presenca-online, percepcao-operacional, appstaff-web). Template de 10 secções: Tipo, Caminho(s), Objetivo, Quem acessa, Estados do Sistema, Conexão com o Core, Fonte de Dados, Impacto Operacional, Estado Atual, Próximos Passos.
- **Diagrama Web ↔ Core ↔ Operação:** [../routes/DIAGRAMA_WEB_CORE_OPERACAO.md](../routes/DIAGRAMA_WEB_CORE_OPERACAO.md) — diagrama mestre (ASCII + Mermaid): Dono → Web Config → Core → TPV/KDS/App Staff/Público.
- **Manual Oficial ChefIApp OS:** [../MANUAL_OFICIAL_CHEFIAPP_OS.md](../MANUAL_OFICIAL_CHEFIAPP_OS.md) — índice único: fluxo e rotas, Core e contratos, implementação, piloto, regras absolutas, como usar.
- **API_ERROR_CONTRACT.md** — Contrato de erro de API (fetch layer): se Content-Type !== application/json, devolver erro tipado BACKEND_UNAVAILABLE; nunca quebrar a tela com "Unexpected token '<'". Implementação: dockerCoreFetchClient.ts.
- **LOCAL_DATA_CONTRACT.md** — Contrato de dados local: tabelas locais, rotas que leem/escrevem, efémero vs persistente, o que será sincronizado, o que nunca sai do restaurante; contrato mínimo para rotas "Parcial".
- **FASE_5_SUPABASE_DEPLOY.md** — Variáveis de ambiente e checklist de deploy Supabase (FASE 5 Passo 1, opcional).
- **FASE_5_DATA_MODE.md** — Contrato data_mode (demo vs live) e onde tocar no código (FASE 5 Passo 2).
- **FASE_5_ALERTAS_AVANCADOS.md** — Catálogo de alertas avançados e pontos de extensão (FASE 5 Passo 3).
- **FASE_5_RELATORIOS.md** — Estado atual e tarefas de relatórios (FASE 5 Passo 4); fecho diário, finanças, rotas e permissões.
- **FASE_5_HARDENING_SMOKE_CHECK.md** — Smoke check manual do Hardening final (Data Mode em todas as páginas + Ecrã Zero).
- **FASE_5_FASE_A_RESULTADO.md** — Resultado do Teste Global Técnico LOCAL (FASE A); PASSOU em 2026-02-01.
- **FASE_5_FASE_B_TESTE_HUMANO.md** — Checklist e critérios do Teste Humano (FASE B); executar após FASE A.
- **FASE_5_FASE_B_CHECKLIST_POS_FASE_C.md** — Checklist FASE B (pós-FASE C): validar sensação humana com Core OFF; regras, cenário, veredito e encerramento.
- **FASE_5_FASE_B_SUPABASE_RUNBOOK.md** — Runbook: executar FASE B em URL real (Supabase); pré-requisitos, checklist, E2E opcional, próximo passo (primeiro cliente pagante).
- **FASE_5_FASE_B_RESULTADO.md** — Resultado do Teste Humano (FASE B); FALHOU em 2026-02-01 (impossibilidade operacional); ver FASE_5_COMO_INICIAR_1_MINUTO.
- **FASE_5_COMO_INICIAR_1_MINUTO.md** — Como iniciar em 1 minuto (local): script `./start-local.sh` ou `npm run start:local`; doc para dev/piloto.
- **FASE_5_FASE_C_LOCAL_HUMAN_SAFE_MODE.md** — Local Human Safe Mode: contrato (4 regras), checklist; zero erro técnico na UI.
- **FASE_5_DEMO_GUIADO_3_MIN.md** — Demo Guiado de 3 minutos: roteiro (4 passos), copy e CTAs; fluxo fechado Pedido → KDS → Caixa → Fecho.
- **FASE_5_FLUXO_TOTAL_CHECKLIST.md** — Fluxo total executável: configuração web → TPV/KDS → tarefas → pedido → trial 14 dias → Billing e pagamento Stripe demo (10 fases).
- **FASE_5_BOOTSTRAP_LINEAR.md** — Bootstrap linear: passos fixos (1–2), indicador "Passo X de Y — A configurar o seu restaurante", copy e checklist de implementação.
- **FASE_5_AUDITORIA_ROTAS_VIDA.md** — Auditoria de rotas (Opção C): listagem de rotas e fase(s) em que cada uma é permitida (Vida do Restaurante).
- **FASE_5_LOCAL_NAO_PRODUCAO.md** — Declaração oficial: Local ≠ Produção; local é dev-only; dono real entra por URL; FASE B repete-se em Supabase.
- **FASE_5_ESTADO_REAL.md** — Estado real (baseline pré-Supabase ON): percentuais, o que está fora, o que não pode regredir, contrato.
- **FASE_5_HISTORICO_EXTERNO.md** — Ingestão de histórico externo (FASE 5 Passo 1.5): dados herdados vs nativos, tipos aceitos, modelo, ritual "trazer a tua história".
- **FASE_4_EXTENSOES_FUTURAS.md** — Pontos de extensão para reviews, SEO local e fidelização (FASE 4 Passo 3).
- **WEB*QR_MESA*\*.md** — Detalhes de implementação QR mesa/menu.
- **APPSTAFF*2.0*\*.md** — Rastreio e próximos passos do App Staff 2.0.

---

## Ordem de execução (referência)

1. FASE 1 → FASE 2 → FASE 3 → FASE 4 (concluídas na prática).
2. FASE 5: executar quando a condição de negócio "pós-€79" for atendida.

Última atualização: 2026-02-01.
