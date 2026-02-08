# Roadmap Pós-Fundação — ChefIApp

## Índice
- [Por que isto não estava na arquitetura](#por-que-istoe-não-estava-na-arquitetura)
- [Roadmap em fases](#roadmap-em-fases)
- [Estado de implementação (FASES 1–5)](#estado-de-implementação-fases-15)
- [Maturidade](#maturidade)

---

## Por que isto não estava na arquitetura

A ausência destes elementos no desenho original não foi por esquecimento, mas uma decisão implícita de foco. A arquitetura inicial cobria o produto como sistema, priorizando o núcleo funcional essencial para operar o restaurante de forma digital.

No entanto, três macro-blocos ficaram fora do escopo inicial:

1. **Bootstrap completo do restaurante** — configuração inicial detalhada para colocar o restaurante em funcionamento.
2. **Sistema humano (pessoas e tarefas)** — gestão de equipes, atribuição de funções e acompanhamento de atividades.
3. **Presença digital** — canais de venda online, marketing e interação com clientes.

O verdadeiro erro foi não nomear claramente o público-alvo como exclusivo para o Dono e não prever as ondas posteriores que ampliariam o sistema para além do núcleo inicial.

---

## Roadmap em fases

### FASE 0 — Fundamentos (Fechada)
- **Objetivo:** Estabelecer a base técnica e estrutural do produto.
- **Princípio:** Criar um sistema estável e escalável.
- **Passos:**
  1. Definir arquitetura geral.
  2. Implementar autenticação básica.
  3. Criar modelo de dados inicial.
- **Critério de conclusão:** Produto funcional para uso interno, com base sólida para evolução.
- **Status:** Fechada. Nada a fazer aqui.

### FASE 1 — Bootstrap do Restaurante — **Concluída**
- **Objetivo:** Permitir criar e configurar um restaurante completo para operação.
- **Princípio:** Facilitar o início rápido e sem fricção.
- **Passos:**
  1. Criar restaurante (nome, tipo, país/moeda, timezone).
  2. Instalar módulos essenciais (TPV, KDS).
  3. Configurar pagamentos, impressão e cozinha.
  4. Abrir primeiro turno com caixa inicial.
- **Critério de conclusão:** Restaurante configurado e pronto para operação inicial.
- **Status:** Implementada. BootstrapPage + IdentitySection; ModuleGate; ConfigPayments; ShiftGate + abertura de turno com caixa inicial.

### FASE 2 — Menu e Inventário — **Quase completa**
- **Objetivo:** Gerir produtos, categorias e estoque.
- **Princípio:** Controlar o que é vendido e disponível em tempo real.
- **Passos:**
  1. Criar e editar itens de menu.
  2. Ingredientes e receitas (BOM).
  3. Estoque e alerta de estoque baixo.
- **Critério de conclusão:** Menu completo e estoque sincronizado; "vendo algo e sei se estou a ficar sem isso".
- **Status:** Quase completa. Produtos, ingredientes, BOM e alerta de estoque baixo no Ecrã Zero implementados. Consumo de estoque na venda é responsabilidade futura do Core.

### FASE 3 — Pessoas e Tarefas — **Concluída**
- **Objetivo:** Gerir equipes, funções e fluxos de trabalho.
- **Princípio:** Organizar o sistema humano para eficiência.
- **Passos:**
  1. Cadastrar colaboradores e perfis (código/QR).
  2. Sistema de tarefas ligadas a turnos; checklists.
  3. Permissões (Staff executa; Gerente acompanha; Dono vê tudo).
- **Critério de conclusão:** Equipe operacional com controle de tarefas; "o sistema instrui pessoas sem eu estar lá".
- **Status:** Implementada. gm_restaurant_people; gm_tasks + turn_session_id; gm_shift_checklist_*; rolePermissions; RolesSummarySection. Gamificação adiada.

### FASE 4 — Presença Digital — **Concluída**
- **Objetivo:** Página pública, QR e preparação para extensões.
- **Princípio:** Presença digital não é fundação, é aceleração.
- **Passos:**
  1. Página pública (menu, horários, localização).
  2. QR Code (mesa; menu).
  3. Integração futura (reviews; SEO local; fidelização) documentada.
- **Critério de conclusão:** "O restaurante existe fora da porta."
- **Status:** Implementada. address_text/opening_hours_text; PublicWebPage; PublicPresenceFields; PublicQRSection; FASE_4_EXTENSOES_FUTURAS.md.

### FASE 5 — Consolidação — **Documentada (pós-€79)**
- **Objetivo:** Unificar dados e processos para visão completa.
- **Princípio:** Simplificar decisões e operação. **Condição:** Só depois do €79 (patamar de faturação).
- **Passos:**
  1. **Supabase ON** — Doc e código prontos (backendAdapter, useSupabaseAuth); deploy operacional quando configurar VITE_SUPABASE_*.
  2. **Histórico externo (1.5)** — Contrato e modelo documentados em FASE_5_HISTORICO_EXTERNO.md; ponto de entrada (CSV/API) definido.
  3. **Dados reais** — dataMode (demo/live) em RestaurantRuntime; indicadores "simulação" em Finanças, relatórios e Alertas.
  4. **Alertas avançados** — Filtro por categoria e severidade; catálogo em sync com AlertEngine.createFromEvent.
  5. **Relatórios** — Fecho diário, Vendas por período, export CSV; rotas e permissões owner/manager.
  6. **Hardening** — DataModeBanner em todas as páginas sensíveis + Ecrã Zero.
- **Critério de conclusão:** Produto maduro com controle unificado.
- **Status:** Checklist em `docs/implementation/FASE_5_CONSOLIDACAO_CHECKLIST.md`. Passos 1.5–4 e Hardening implementados/documentados; Passo 1 (Supabase) aguarda deploy quando decisão de negócio (pós-€79). **Teste Humano (FASE B):** E2E objectivo PASSOU em local (2026-02-01); próximo: Supabase deploy → repetir FASE B em URL real → primeiro cliente pagante.

---

## Estado de implementação (FASES 1–5)

| Fase | Nome | Status |
|------|------|--------|
| 0 | Fundação | Fechada |
| 1 | Bootstrap do Restaurante | Concluída |
| 2 | Menu, Inventário e Estoque | Quase completa |
| 3 | Pessoas e Tarefas | Concluída |
| 4 | Presença Digital | Concluída |
| 5 | Consolidação | Documentada (pós-€79) |

**Checklists técnicas:** Todas as fases têm checklists executáveis em `docs/implementation/`. Índice completo: [docs/implementation/INDEX.md](implementation/INDEX.md).

**Ordem de execução:** FASE 1 → FASE 2 → FASE 3 → FASE 4 (concluídas na prática). FASE 5: passos 1.5–4 e Hardening já implementados; Passo 1 (Supabase ON) executa-se no deploy quando a condição "pós-€79" for atendida.

---

## Maturidade

Agora está nomeado. Agora há caminho.

---

As checklists técnicas detalhadas (passo a passo, estado atual, tarefas) estão em `docs/implementation/`. Ver [INDEX.md](implementation/INDEX.md) para listagem e links.
