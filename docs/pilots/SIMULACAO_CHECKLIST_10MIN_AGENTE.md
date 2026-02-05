# Simulação do checklist 10 min — Teste Humano Supremo v1.1 (agente)

**Data:** 2026-02-02
**Base:** Código + docs + E2E (sem browser). Não substitui execução humana no browser.
**Checklist:** [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md)

---

## Regra usada

Loop = FALHA. Tela vazia = FALHA. Mensagem técnica visível = FALHA.

---

## Pré-flight (30 s)

- **5175 responde?** Sim — E2E e pré-flight já confirmaram 200.
- **Core (3001) up?** Depende do ambiente. Se em baixo, o banner "Servidor operacional offline. Inicie o Docker Core." aparece (CoreUnavailableBanner); não é bug de dados.
- **Veredito simulado:** PASSA se ambos up; se Core em baixo, iniciar Docker antes de continuar.

---

## FASE 1 — Entrada + restaurante

**Passo 1 — Ir a `/`, CTA "Criar restaurante" / "Começar", clicar e ir para auth sem voltar à landing**

- Landing (Hero.tsx): CTA principal **"Testar 14 dias no meu restaurante"** → `/auth`. Secundários: "Ver o sistema a funcionar (3 min)", "Já tenho acesso" → `/auth`. Uma porta única para auth; `/demo` redireciona para `/auth` (App.tsx).
- E2E: landing → auth e CTA visível em `/auth` (fluxo-total.spec.ts).
- **Veredito simulado:** **PASSA** — 1 CTA principal, percurso previsível, sem loop.

**Passo 2 — Criar conta (email fictício) + criar restaurante (nome, contacto). Fluxo linear até área web**

- Auth (AuthPage), bootstrap (BootstrapPage), first-product (FirstProductPage). Fluxo selado por FlowGate e AppDomainWrapper (tenantId, sealed).
- E2E: bootstrap e first-product carregam com status < 500 (fluxo-total.spec.ts).
- **Risco:** Se Supabase/auth ou Core falharem, pode haver bloqueio. Com infra ok, fluxo é linear.
- **Veredito simulado:** **PASSA** (assumindo auth + Core ok).

---

## FASE 2 — Config + Menu

**Passo 3 — Config → Menu Builder, Tarefas, Pessoas. Todas carregam (não vazias, sem crash)**

- Rotas: `/menu-builder`, `/config/people`, `/tasks`. E2E fase-a: rotas protegidas carregam ou redirecionam sem 500. F3/F4: TaskReader, RestaurantPeopleReader, RestaurantPeopleSection tratam backend indisponível e estado vazio — lista vazia ou mensagem humana, sem crash.
- **Veredito simulado:** **PASSA** — rotas carregam; estado vazio é aceitável.

**Passo 4 — Menu Builder: criar 1 produto (nome, preço). Salva e aparece na lista. Sem "Unexpected token"**

- MenuBuilderCore: handleCreate → createMenuItem; em falha de backend (isBackendUnavailable) guarda em fallback local e mostra "Produto guardado localmente (servidor indisponível)". ProductReader/MenuWriter tratam resposta não-JSON (ISOLAMENTO_BUG_MENU_BUILDER_P0).
- **Risco:** Com Core em baixo, produto pode só aparecer em fallback local (mensagem explícita). Com Core up, produto vai para BD e lista.
- **Veredito simulado:** **PASSA** — sem Unexpected token; produto salvo (backend ou fallback) e visível na lista.

---

## FASE 3 — Billing

**Passo 5 — Ir a Billing. Estado TRIAL ATIVO (14 dias). CTA para planos visível. Não bloqueia**

- BillingPage: useSubscription, estados TRIAL/ACTIVE, STATUS_LABELS, CTA checkout/portal.
- **Veredito simulado:** **PASSA** — página existe, estado e CTA coerentes com trial.

---

## FASE 4 — Turno + TPV + KDS

**Passo 6 — TPV. "Abrir Turno" / "Começar a vender" visível. Abrir turno sem erro técnico**

- ShiftGate: título "Começar a vender", botão "Clique aqui para começar a vender AGORA", formulário caixa inicial (€), RPC open_cash_register_atomic. Em sucesso: feedback "Turno aberto! A carregar o TPV..."; em erro: mensagem clara (sem jargão RPC).
- **Risco:** Se Core (3001) em baixo, RPC falha e aparece mensagem de erro; não é tela vazia.
- **Veredito simulado:** **PASSA** — CTA e copy alinhados com checklist v2; abrir turno funciona com Core up.

**Passos 7–9 — Criar pedido no TPV, ver no KDS, marcar pronto, voltar ao TPV, ciclo fechado**

- Rotas `/op/tpv/*`, `/op/kds`. Fluxo TPV → pedido → KDS → pronto → TPV coberto por E2E e contrato operacional.
- **Veredito simulado:** **PASSA** — fluxo implementado; com ambiente ok o ciclo fecha.

---

## FASE 5 — Veredito

**Passo 10 — Dashboard carrega. Sem erro crítico no console. Nenhuma rota essencial inacessível**

- E2E: /app/dashboard e rotas protegidas carregam ou redirecionam (fase-a-global-tecnico.spec.ts). Fase B: sem palavras proibidas nas páginas públicas; copy humana (fase-b-teste-humano.spec.ts).
- **Veredito simulado:** **PASSA**.

---

## Resultado final (simulado)

- **Status:** **PASSOU** (com Core + auth operacionais).
- **Falhas (lista curta):** Nenhuma nos passos simulados. Único ponto de atenção: se Core (3001) estiver em baixo, passos 4 e 6 podem mostrar fallback/mensagem de erro em vez de persistência real; não é FALHA do checklist (sistema não engana).
- **Veredito humano simulado:** "Como dono de restaurante, eu conseguiria vender com isto hoje?" — **Sim**, desde que 5175 e 3001 estejam up e o fluxo auth → restaurante → menu → billing → turno → TPV → KDS seja percorrido uma vez no browser.

---

## Onde ter atenção no teste real (humano no browser)

1. **Passo 1:** O texto exato do CTA é **"Testar 14 dias no meu restaurante"**, não "Criar restaurante" nem "Começar"; conta como 1 CTA principal para auth.
2. **Passo 4:** Com Core em baixo, esperar mensagem do tipo "Produto guardado localmente (servidor indisponível)" e produto na lista — isso é PASSA.
3. **Passo 6:** Confirmar que o botão diz **"Clique aqui para começar a vender AGORA"** e que, após abrir turno, aparece feedback claro antes de entrar no TPV.

---

## Próximo passo

Executar o [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md) no browser e preencher o resultado real. Atualizar depois a secção "Resultado do teste v2" no [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md).
