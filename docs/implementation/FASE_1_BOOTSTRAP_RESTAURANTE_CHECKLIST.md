# FASE 1 — Bootstrap do Restaurante (checklist técnica)

Checklist executável por dev. Dono-only. Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Critério de conclusão da FASE 1:** "Consigo criar um restaurante, abrir o TPV e vender algo."

---

## Passo 1 — Criar restaurante (nome, tipo, país/moeda, timezone)

**Objetivo:** O Dono cria um restaurante com identidade mínima (nome, tipo, país/moeda, timezone) num único fluxo coerente.

**Estado atual no código:**

- `merchant-portal/src/pages/BootstrapPage.tsx`: form nome + contacto; RPC `create_tenant_atomic` ou insert em `gm_restaurants`; valores fixos tipo "Restaurante", país "ES"; navega para `/onboarding/first-product`.
- `merchant-portal/src/pages/Onboarding/sections/IdentitySection.tsx`: form completo (nome, tipo, país, timezone, currency, locale); insert em `gm_restaurants`; presets por país (BR, ES, PT, US).

**Tarefas:**

1. Definir fluxo único: ou BootstrapPage redireciona para onboarding identidade (IdentitySection) antes de first-product, ou IdentitySection é o único passo de "criar restaurante" após auth.
2. Garantir que tipo, país, moeda e timezone estão sempre presentes ao criar restaurante (não usar apenas valores fixos no BootstrapPage).
3. Persistir em `gm_restaurants`: nome, type, country, currency, timezone (e locale se já existir).

**Critério de aceite:** Utilizador autenticado consegue criar um restaurante com nome, tipo, país/moeda e timezone; o registo fica em `gm_restaurants` e o `restaurant_id` fica disponível (localStorage/context) para os passos seguintes.

---

## Passo 2 — Instalar módulos (TPV, KDS)

**Objetivo:** O Dono ativa TPV e/ou KDS para o seu restaurante (checkbox simples: ativo / não ativo).

**Estado atual no código:**

- Páginas TPV e KDS existem: `merchant-portal/src/pages/TPVMinimal/TPVDemoPage.tsx`, `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`.
- Não existe configuração "módulos por tenant" (flags por restaurante).

**Tarefas:**

1. Modelo de dados: adicionar flags por tenant (ex. `gm_restaurants.tpv_enabled`, `kds_enabled` ou tabela `tenant_modules`). Se migrations forem fora de escopo imediato, usar localStorage/context como fallback até haver backend.
2. UI: passo no onboarding ou ecrã de configuração "Instalar módulos" com checkboxes TPV e KDS; guardar preferência.
3. Navegação/guards: só mostrar/aceder a TPV se TPV ativo; idem para KDS.

**Critério de aceite:** Dono pode marcar "TPV ativo" e "KDS ativo"; essa escolha persiste; acesso às páginas TPV/KDS respeita a escolha.

---

## Passo 3 — Configuração mínima (pagamentos, impressão/ecrã, cozinha ligada ao TPV)

**Objetivo:** Configuração mínima para operar: métodos de pagamento (dinheiro, cartão), impressão/ecrã, cozinha ligada ao TPV.

**Estado atual no código:**

- Cozinha já recebe pedidos do TPV (fluxo existente).
- Não existe ecrã dedicado de "métodos de pagamento" ou "impressão/ecrã" por restaurante.

**Tarefas:**

1. Métodos de pagamento: definir onde persistem (ex. config por restaurante em BD ou em config tree). UI mínima: escolher "dinheiro", "cartão" (ou ambos).
2. Impressão/ecrã: preferências mínimas (ex. impressora padrão, ecrã cozinha) — documentar ou implementar conforme prioridade.
3. Cozinha ligada ao TPV: manter/completar integração existente; garantir que venda no TPV reflete no KDS quando KDS está ativo.

**Critério de aceite:** Dono pode indicar métodos de pagamento aceites; opção de impressão/ecrã fica registada ou documentada; venda no TPV reflete na cozinha (KDS) quando aplicável.

---

## Passo 4 — Abrir primeiro turno (caixa inicial, gating do TPV)

**Objetivo:** Antes de usar o TPV, o Dono abre turno com caixa inicial; o TPV só é utilizável com turno aberto.

**Estado atual no código:**

- `merchant-portal/src/core/shift/ShiftContext.tsx`: verifica turno aberto via `CashRegisterEngine.getOpenCashRegister(restaurantId)`; polling com backoff.
- Dashboard e fluxos de abertura de caixa existem (ex. `DashboardPortal`, histórico de turnos).
- Não existe gating explícito na entrada do TPV: "só aceder se turno aberto".

**Tarefas:**

1. Gating na entrada do TPV: se não houver turno aberto, mostrar ecrã "Abrir turno" (caixa inicial) e bloquear uso do TPV até turno estar aberto.
2. Fluxo "Abrir primeiro turno": caixa inicial obrigatória; após abertura, redirecionar para TPV ou manter no dashboard conforme UX definida.
3. Ecrã Zero / alertas: já consideram turno; garantir que "caixa ainda não aberto" aparece quando aplicável.

**Critério de aceite:** Dono não consegue vender no TPV sem turno aberto; ao abrir turno com caixa inicial, pode em seguida usar o TPV para vender.

---

## Conclusão da FASE 1

Validar o critério global:

**"Consigo criar um restaurante, abrir o TPV e vender algo."**

- Criar restaurante: Passo 1.
- Abrir TPV: Passos 2 (TPV ativo) e 4 (turno aberto).
- Vender algo: TPV operacional após Passos 1–4; primeiro produto pode vir do fluxo existente (ex. first-product) ou do menu quando existir.

Ordem recomendada de implementação: 1 → 2 → 3 → 4. Validar após cada passo antes de avançar.
