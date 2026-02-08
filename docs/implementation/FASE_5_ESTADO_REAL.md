# FASE 5 — Estado real (baseline pré-Supabase ON)

Documento de referência: congela o estado do sistema antes da viragem para dados reais. Evita regressões silenciosas e define o marco "antes / depois de dinheiro real". Ver: [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md).

**Na sequência:** [FASE A](FASE_5_FASE_A_RESULTADO.md) → [FASE B](FASE_5_FASE_B_TESTE_HUMANO.md) (executar) → [Supabase ON](FASE_5_SUPABASE_DEPLOY.md) → este doc (ritual / dados reais) → [Primeiro cliente pagante](../pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md).

---

## Percentuais por fase (agora)

| Âmbito                      | Percentual | Nota                                                                                                                                                                                                |
| --------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FASE 0–4                    | 100%       | Concluídas.                                                                                                                                                                                         |
| Hardening final             | 100%       | Data Mode em todas as páginas; Ecrã Zero; smoke check.                                                                                                                                              |
| **FASE 5 global**           | **~96%**   | Após triggers reais.                                                                                                                                                                                |
| Passo 1 — Supabase ON real  | 0%         | Intencional; próximo passo (técnico mínimo).                                                                                                                                                        |
| Passo 2 — Data Mode         | 100%       |                                                                                                                                                                                                     |
| Passo 3 — Alertas avançados | ~96%       | order_delayed, order_sla_breach, table_unattended, stock_low, dining_overloaded com trigger; faltam margin_deviation, kitchen_overloaded, employee_absent, stock_rupture_predicted, fiscal_delayed. |
| Passo 4 — Relatórios        | ~97%       | Estrutura sólida, fecho por turno, finanças ok; resumo por mês + resumo por dia + CSV (turnos, diário, mensal).                                                                                     |

**Produto global:** ~93–94% pronto para dinheiro real, sem risco estrutural.

---

## O que está explicitamente fora (os ~10%)

1. **Triggers reais de alertas** (~5–7%) — Parcialmente implementado: order_delayed, order_sla_breach, table_unattended, stock_low e dining_overloaded têm trigger ligado a dados reais (EventMonitor + useEcraZeroState). Ainda sem trigger: margin_deviation, kitchen_overloaded, employee_absent, stock_rupture_predicted, fiscal_delayed.

2. **Relatórios que fecham o ciclo** (~3–4%) — Implementado em Vendas por período: resumo por mês + resumo por dia (agregados como entidade explícita) + export CSV (turnos, resumo por dia, resumo por mês). Fecho por turno, finanças, estrutura certa.

3. **Ritual explícito demo → live** (~2–3%)
   Mensagem clara do tipo "A partir deste momento, tudo aqui passa a ser dinheiro real." (psicológico/operacional; técnico já coberto por Data Mode.)

4. **Histórico externo (dados herdados)** (~4–6%) — Contrato e modelo documentados em [FASE_5_HISTORICO_EXTERNO.md](FASE_5_HISTORICO_EXTERNO.md): dados herdados vs nativos, tipos aceitos (vendas, caixa, CSV, fiscal), modelo (source_system, período, fidelity), ritual "Antes de ligar ao vivo, queres trazer a tua história?". Sem ETL nem UI completa; só contrato e ponto de entrada definido.

Nada disso é arquitetura; é camada final de verdade operacional.

---

## Camadas invisíveis pós-Supabase ON (checklist conceitual)

Estas camadas **não são UI-first nem puramente técnicas**, mas tornam-se críticas no momento em que há dinheiro real, pessoas reais e responsabilidade legal. Devem ser consideradas concluídas **antes ou durante** a ativação do Supabase ON.

### 1. Irreversibilidade operacional

- Pontos claros de **não-retorno** (ex.: abrir turno real, fechar caixa, emitir recibo, ajustar estoque negativo).
- Ações que mudam estado financeiro devem ser explicitamente tratadas como finais.
- Objetivo: evitar estados ambíguos do tipo “acho que fechei” ou “posso refazer depois”.

### 2. Tempo como entidade de negócio

- Dia, turno e período deixam de ser apenas filtros e passam a ser **objetos de responsabilidade**.
- Um dia “não fechado” ou um turno “pendente” deve gerar sinal, alerta ou obrigação.
- Objetivo: permitir governança temporal (quem deixou, quando, por quê).

### 3. Confiança psicológica do Dono

- O sistema deve comunicar claramente quando assume responsabilidade (“a partir daqui é dinheiro real”).
- O Dono não deve sentir culpa técnica nem medo silencioso ao usar o sistema.
- Objetivo: transformar o software num aliado de confiança, não apenas numa ferramenta.

**Nota:** estas camadas não exigem refactor estrutural; exigem nomeação explícita, contratos claros e pequenos rituais de UI/UX.

---

## O que não pode regredir após Supabase ON

- **Data Mode:** indicador "simulação" em todas as páginas de dados quando `dataMode === "demo"`; Ecrã Zero com indicador; nenhum indicador em `dataMode === "live"`.
- **Permissões:** rotas de relatórios e alertas restritas a owner/manager conforme rolePermissions.
- **Narrativa:** o sistema não mente sobre a natureza dos dados (demo vs live).
- **Fundamento técnico:** RestaurantRuntime com `dataMode` derivado de `productMode`; backendAdapter Docker vs Supabase; migrations como fonte de verdade do schema.

---

## Contrato

**A partir do Supabase ON, o sistema passa a refletir dinheiro real.**

Este documento define o baseline "pré-dinheiro". A sequência recomendada:

1. FASE_5_ESTADO_REAL.md (este doc) ✅
2. FASE 5 — Passo 1: Supabase ON real (ordem correta abaixo)
3. Triggers reais de alertas
4. Relatórios agregados + CSV
5. Ritual demo → live (UI + copy)

### Passo 1 — Supabase ON real (técnico): escopo fechado

- **Env real** — `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Vercel/Netlify ou `.env`).
- **Projeto Supabase** — Criar em [supabase.com](https://supabase.com); obter URL e anon key.
- **Migrations** — Aplicar `supabase/migrations/` (Dashboard SQL Editor ou `supabase db push`).
- **Auth** — Configurar redirect URLs no Supabase Dashboard.
- **Conexão** — Já no código (`backendAdapter`, `supabaseClient`, `useSupabaseAuth`).
- **Sem mexer em UI.** Sem ritual ainda (ritual vem logo depois).

Checklist executável: [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md) — Fase técnica 1/3.

### Ordem correta para Passo 1 (Supabase ON real)

Não ligar Supabase como quem liga um motor — ligar como quem assume responsabilidade.

1. **Supabase ON técnico mínimo** — env, migrations, auth, conexão (Fase técnica 1/3). Preparação silenciosa.
2. **Ritual explícito de irreversibilidade** — ex.: "abrir primeiro turno real"; o sistema diz "Daqui não se volta. Isto conta."
3. **Só depois:** dados reais começam a contar.

**Inalterável:** Se inverter 2 e 3, perdes confiança. Se pular 2, crias medo silencioso.

O que falta não é sistema — é o momento em que o sistema diz: _Agora sou responsável._

### Fase 2/3 — Ritual de irreversibilidade (implementado)

Antes de passar a "live" (`setProductMode("live")`), o sistema mostra um modal com o contrato: _"A partir deste momento, tudo aqui passa a ser dinheiro real. Daqui não se volta."_ O utilizador deve confirmar. Implementado em: **DashboardPortal** (card Estado do sistema — "Ativar ao vivo"), **BackofficePage** ("Ativar operação ao vivo"). Componente: `merchant-portal/src/components/operational/IrreversibilityRitualModal.tsx`.

### Fase 3/3 — Dados reais começam a contar (estado, sem código novo)

Após **Fase 1** (Supabase ON técnico: env, migrations, auth) e **Fase 2** (ritual confirmado → `productMode === "live"`), os dados reais já fluem: `dataMode` fica `"live"`, o `DataModeBanner` não aparece, e todas as leituras/escritas vão para o backend configurado (Supabase quando `VITE_SUPABASE_URL` é um projeto real). Nenhuma alteração de código é necessária para 3/3 — é o estado natural após 1+2. Validação: login com Supabase ativo, confirmar ritual, verificar que não há barra "simulação" e que os dados persistem no projeto Supabase.

---

Última atualização: 2026-02-01.
