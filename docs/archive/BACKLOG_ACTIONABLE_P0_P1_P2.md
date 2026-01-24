# Backlog acionável (P0/P1/P2) — ChefIApp POS Core

Data: 2026-01-03
Audiência: CTO reviewer + time técnico
Princípio: cada item deve ser *auditável, revertível, buildável* e não pode criar duplicação/fragmentação.

---

## Como usar este backlog

- **P0**: destrava produção segura (TPV + operação + consistência + a11y mínima + observabilidade básica).
- **P1**: escala controlada (performance, design system completo, enforcement de pricing, cobertura).
- **P2**: diferenciais e expansão comercial (marketplace, API pública, reservas engine, analytics real-time).

Cada issue abaixo contém:
- **Objetivo** (resultado)
- **Escopo** (o que muda)
- **Critérios de aceite** (verificável)
- **Definição de pronto** (DoD)
- **Dependências**
- **Estimativa** (horas)

---

## Épico A — Design System soberano (P0/P1)

### A0 (P0) — Guardrails anti-duplicação (gate rápido)
- **Objetivo**: impedir regressão de duplicação enquanto o design system é consolidado.
- **Escopo**:
  - Documento de regras (UI canon) com “primitives como fonte única”.
  - Check automatizado (CI/script) que falha se:
    - novos arquivos forem adicionados em `merchant-portal/src/ui/components/` (exceto README de depreciação)
    - `merchant-portal/src/ui/design-system/index.ts` reexportar wrappers que colidem com primitives (Button/Card/Input/Badge etc.)
- **Critérios de aceite**:
  - `npm run -s typecheck` passa
  - `npm -w merchant-portal run -s build` passa
  - check falha se alguém tentar reintroduzir duplicação
- **DoD**: regra escrita + check automatizado em pipeline local/CI.
- **Dependências**: nenhuma.
- **Estimativa**: 4–6h.

### A1 (P0) — Tokens críticos (breakpoints, zIndex, transitions, focus)
- **Objetivo**: remover hardcodes críticos e habilitar Modal/Select/a11y.
- **Escopo**:
  - novos tokens: `breakpoints`, `zIndex`, `transitions`, `focus`.
  - substituir hardcodes P0 (transitions/focus/valores gritantes).
- **Critérios de aceite**:
  - nenhum componente P0 usa `transition: 'all 0.2s ease'` hardcoded
  - foco consistente e visível em Button/Input
- **DoD**: tokens exportados + migração mínima aplicada + build ok.
- **Dependências**: A0.
- **Estimativa**: 9–12h.

### A2 (P0) — Unificar exports e remover colisões
- **Objetivo**: acabar com consumo ambíguo (ex.: `Button` em 2–3 lugares).
- **Escopo**:
  - ajustar `ui/design-system/index.ts` para exportar **somente** primitives + tokens (+ domain/layouts se existirem).
  - remover reexports colidentes (`./Button`, `./Card`, `./Input`, `./Badge` etc.)
  - se necessário: `legacy.ts`/`deprecated.ts` explícito para compat.
- **Critérios de aceite**:
  - não existem exports com o mesmo nome em múltiplas camadas
  - build não quebra (ou quebra com migração no mesmo PR)
- **DoD**: imports resolvidos e consistentes.
- **Dependências**: A0, A1.
- **Estimativa**: 6–10h.

### A3 (P0) — Dialog/Modal (operacional TPV)
- **Objetivo**: padronizar confirmações críticas (fechar turno, cancelar, pagamento) com a11y mínima.
- **Escopo**:
  - `Dialog` (ou `Modal`) em primitives:
    - `isOpen`, `onClose`, `title`, `children`, `footer`
    - fecha com `Esc`
    - click fora configurável
    - focus trap + restore focus
    - `aria-modal`, `role="dialog"`, `aria-labelledby`
  - usar `zIndex` token (sem hardcode).
- **Critérios de aceite**:
  - teclado não “escapa” do modal
  - `Esc` fecha
  - sem z-index hardcoded
- **DoD**: story mínima ou exemplo de uso + build ok.
- **Dependências**: A1.
- **Estimativa**: 8–12h.

### A4 (P0) — Select/Dropdown genérico
- **Objetivo**: eliminar dropdowns ad-hoc e padronizar forms.
- **Escopo**:
  - `Select` em primitives com:
    - `options: {label,value}[]`
    - controlado/uncontrolled
    - teclado: setas/enter/escape
    - `aria-expanded`, `role="listbox"`, `role="option"`
  - migrar **1 fluxo real** (ex.: filtro de status/período) para validar.
- **Critérios de aceite**:
  - fluxo real usando o Select
  - navegação por teclado funcional
- **DoD**: componente + uso real + build ok.
- **Dependências**: A1.
- **Estimativa**: 6–12h.

### A5 (P0) — A11y mínima transversal (Button/Input/Toast/Alert)
- **Objetivo**: elevar o piso de produção sem virar “projeto infinito”.
- **Escopo**:
  - Button:
    - `type="button"` default
    - `aria-label` obrigatório quando não houver texto (assert em dev)
  - Input:
    - `aria-invalid` e `aria-errormessage` quando houver erro
    - label/id consistente
  - Alerts/Toasts:
    - roles + `aria-live` adequados
- **Critérios de aceite**:
  - nenhum componente interativo “mudo” para leitor de tela
  - teclado funciona nos componentes P0
- **DoD**: alterações aplicadas em primitives + componentes que expõem UI crítica.
- **Dependências**: A1, A3.
- **Estimativa**: 16–24h.

### A6 (P0) — Storybook (setup + primitives only)
- **Objetivo**: habilitar iteração rápida e documentação viva.
- **Escopo**:
  - `.storybook/`
  - stories para: Button, Input, Card, Dialog, Select, InlineAlert, Toast
  - page com tokens (cores/tipografia/spacing)
- **Critérios de aceite**:
  - `npm run storybook` sobe
  - ≥6 stories úteis
- **DoD**: Storybook roda em dev local e pode ser plugado no CI.
- **Dependências**: A2–A5 (parcialmente; pode iniciar antes, mas fecha depois).
- **Estimativa**: 16–24h.

### A7 (P1) — Consolidar duplicatas (remover legacy)
- **Objetivo**: reduzir manutenção e evitar divergência visual.
- **Escopo**:
  - deprecar/migrar `ui/components/*` e wrappers duplicados.
  - remover exports conflitantes definitivamente.
- **Critérios de aceite**:
  - `ui/components/` sem novos arquivos e com migração completa do que for necessário
  - zero duplicação de Button/Card/Input/Badge
- **DoD**: imports limpos + build ok.
- **Dependências**: A0–A6.
- **Estimativa**: 16–24h.

---

## Épico B — Observabilidade operacional (P0)

### B0 (P0) — Logging estruturado mínimo
- **Objetivo**: parar de depender de `console.*` como observabilidade.
- **Escopo**:
  - definir formato mínimo de log (contexto + correlation id + event_type + severity).
  - adaptar os pontos críticos (boot, auth, TPV actions, erros de RPC).
- **Critérios de aceite**:
  - logs críticos têm estrutura consistente
  - erros críticos têm stack + contexto
- **DoD**: guideline + util + aplicado nos fluxos críticos.
- **Dependências**: nenhuma.
- **Estimativa**: 8–12h.

### B1 (P0) — Captura de exceções (Sentry ou equivalente)
- **Objetivo**: produção não pode ser “cega”.
- **Escopo**:
  - integrar ferramenta (frontend + server)
  - mapear release/version
  - sanitização básica (sem PII)
- **Critérios de aceite**:
  - exceções chegam ao painel com source maps
  - evento de teste validado
- **DoD**: integração ativa + doc de operação.
- **Dependências**: B0.
- **Estimativa**: 6–10h.

### B2 (P0) — Métricas mínimas (counters/latência)
- **Objetivo**: medir saúde do TPV (latência RPC, falhas, retries, boot time).
- **Escopo**:
  - definir 5–10 métricas mínimas
  - emitir eventos/metrics nos pontos críticos
- **Critérios de aceite**:
  - métricas coletadas e consultáveis
- **DoD**: dashboard mínimo ou export compatível.
- **Dependências**: B0.
- **Estimativa**: 10–16h.

---

## Épico C — Performance & Boot (P0/P1)

### C0 (P0) — Snapshotting / materialização de projeções
- **Objetivo**: boot não pode crescer linearmente com histórico local.
- **Escopo**:
  - snapshot do EventStore a cada N eventos
  - projeções persistidas/read-models materializados
- **Critérios de aceite**:
  - boot time para “histórico grande” reduzido significativamente
  - não altera invariantes de verdade (event sourcing continua auditável)
- **DoD**: estratégia implementada + migração sem perda.
- **Dependências**: nenhuma.
- **Estimativa**: 12–16h.

### C1 (P0) — Bundle analysis + split por domínio
- **Objetivo**: remover unknowns (bundle size, chunks) e separar TPV/Staff.
- **Escopo**:
  - plugin visualizer
  - lazy imports de rotas de alto peso (TPV, AppStaff)
- **Critérios de aceite**:
  - relatório de bundle gerado
  - TPV/AppStaff não entram no first load quando não usados
- **DoD**: build ok + relatório arquivado (artefato CI opcional).
- **Dependências**: nenhuma.
- **Estimativa**: 6–10h.

### C2 (P1) — Virtualização e memo estratégico no TPV
- **Objetivo**: listas longas não podem degradar UI.
- **Escopo**:
  - memoização por `orderId`
  - virtualização (ex.: `react-window`) para listas grandes
- **Critérios de aceite**:
  - re-render reduzido sob eventos frequentes
  - UX mantém responsividade
- **DoD**: medição local (profiling) + regressão coberta por teste/benchmark simples.
- **Dependências**: C1.
- **Estimativa**: 8–16h.

### C3 (P0) — Política de retenção/compactação offline
- **Objetivo**: evitar crescimento infinito no IndexedDB.
- **Escopo**:
  - retenção (ex.: 30 dias) + compactação/snapshot para histórico antigo
- **Critérios de aceite**:
  - storage local não cresce indefinidamente
- **DoD**: job/rotina documentada + fallback seguro.
- **Dependências**: C0.
- **Estimativa**: 6–10h.

---

## Épico D — Pricing/Billing enforcement (P0/P1)

### D0 (P0) — Fail-closed gates no backend
- **Objetivo**: feature gates não podem ser “só UI”.
- **Escopo**:
  - enforcement no backend (rotas/RPC) para planos/limites
  - padronizar erro/feedback
- **Critérios de aceite**:
  - tentativa de uso sem plano falha no backend
  - UI reflete erro de forma clara
- **DoD**: testes mínimos para gates + docs.
- **Dependências**: nenhuma.
- **Estimativa**: 10–14h.

---

## Épico E — Staff App (P0/P1)

### E0 (P0) — Centralizar matriz de roles (RBAC)
- **Objetivo**: eliminar roles hardcoded espalhadas.
- **Escopo**:
  - matriz central (roles → capabilities)
  - refatorar checks críticos para consumir matriz
- **Critérios de aceite**:
  - não existem checks hardcoded nos fluxos críticos
- **DoD**: matriz documentada + aplicada.
- **Dependências**: nenhuma.
- **Estimativa**: 6–12h.

### E1 (P1) — Exceções operacionais (cancel/override) robustas
- **Objetivo**: operações reais exigem exceções auditáveis.
- **Escopo**:
  - fluxos de cancelamento/override com trilha/auditoria
- **Critérios de aceite**:
  - operação gera eventos/auditoria
- **DoD**: pronto para uso em produção.
- **Dependências**: B0/B1 (recomendado).
- **Estimativa**: 12–20h.

---

## Épico F — Expansão (P2)

### F0 (P2) — Public API (OpenAPI)
- **Objetivo**: tornar integração externa viável.
- **Escopo**:
  - especificação OpenAPI dos endpoints públicos
- **Critérios de aceite**:
  - spec gerada e versionada
- **DoD**: spec publicada + validação mínima.
- **Dependências**: nenhuma.
- **Estimativa**: 16–24h.

### F1 (P2) — Marketplace adapters
- **Objetivo**: integrar plataformas de delivery.
- **Escopo**:
  - adaptadores (Just Eat/Glovo/Uber Eats/Deliveroo) conforme arquitetura existente
- **Critérios de aceite**:
  - integração E2E em sandbox
- **DoD**: adaptadores + testes + docs.
- **Dependências**: F0 (recomendado), observability (B1).
- **Estimativa**: 160–240h (4 adaptadores).

### F2 (P2) — Reservas (engine de disponibilidade)
- **Objetivo**: impedir overbooking com locks temporais.
- **Escopo**:
  - engine de disponibilidade + lock temporal
- **Critérios de aceite**:
  - sem corrida de estados/overbooking
- **DoD**: testes de concorrência + docs.
- **Dependências**: observability (B1).
- **Estimativa**: 40–60h.

---

## Resumo de execução recomendado

- **Sequência P0 (primeiro ciclo)**:
  1) A0 → A1 → A2 → A3 → A4 → A5 → A6
  2) B0 → B1 → B2
  3) C1 → C0 → C3
  4) D0
  5) E0

- **Critério “P0 completo”**:
  - tokens P0 existem e são usados
  - Dialog/Select padrão existem
  - exports não colidem
  - a11y mínima implementada
  - Storybook rodando
  - observability mínima ativa (erros + logs + métricas)
  - boot não degrada linearmente em histórico grande (snapshot/projeções)
