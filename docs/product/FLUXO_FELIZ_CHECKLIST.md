# Checklist — Fluxo feliz (verificação técnica)

**Objetivo:** Verificar em ~10–15 min que o fluxo Landing → Signup → Produto → Publicar → TPV → Pedido → KDS está operacional antes do piloto real.
**Quando:** Antes da sessão do piloto (VALIDACAO_OPERACAO_PILOTO_01.md) ou após alterações em B1/B2/B4.

---

## Pré-requisitos

- [ ] App a correr (ex.: `npm run dev` no merchant-portal).
- [ ] Core disponível (opcional para teste de fallback: pode desligar para ver mensagens neutras).

---

## Passos (assinalar conforme executa)

### 1. Landing e auth

- [ ] Abrir `/` → landing visível.
- [ ] Ir para signup (ex.: `/auth?mode=signup`) → formulário visível.
- [ ] Criar conta (email + palavra-passe) → redirecionamento para dashboard ou onboarding.

### 2. Bootstrap e menu

- [ ] Completar bootstrap se pedido (criar primeiro restaurante).
- [ ] Ir ao cardápio (ex.: `/menu-builder` ou link do dashboard).
- [ ] Criar pelo menos 1 produto (nome, preço, estação) → mensagem de sucesso ou lista atualizada; sem "Failed to fetch".
- [ ] Refresh da página → produto continua visível (persistência Core ou fallback B1).

### 3. Publicar

- [ ] Publicar restaurante (isPublished) a partir do dashboard/onboarding.
- [ ] Rotas `/op/tpv` e `/op/kds` deixam de mostrar bloqueio ("Sistema não operacional") e mostram TPV/KDS.

### 4. TPV

- [ ] Abrir `/op/tpv` → TPV visível, não ecrã branco nem fallback de erro.
- [ ] Lista de produtos visível (Core ou fallback B2).
- [ ] Adicionar 1 produto ao carrinho e registar pedido → confirmação; sem crash nem mensagem técnica exposta.

### 5. KDS

- [ ] Abrir `/op/kds` → KDS visível (lista de pedidos ou "Nenhum pedido ativo").
- [ ] Com Core up: pedido criado no TPV aparece no KDS (pode demorar até 30s pelo polling).
- [ ] Com Core down: não aparece "Failed to fetch"; lista vazia ou mensagem neutra.

### 6. Resiliência (opcional)

- [ ] Com Core em baixo: cardápio mostra produtos (fallback B1) e não "Failed to fetch".
- [ ] Com Core em baixo: TPV mostra fallback neutro ou lista vazia; KDS idem.
- [ ] Nenhuma mensagem técnica (Docker, Supabase, stack) visível ao utilizador.
- [ ] Estados loading/empty/error: mensagens neutras (sem status HTTP, PGRST ou stack); carrinho vazio não aparece como "Erro" (ref. GLOBAL_UI_STATE_MAP).

---

## E2E (opcional)

Para regressão automática de partes do fluxo (não o fluxo completo):

- **Na raiz:** `npm run test:e2e` — corre todos os E2E do merchant-portal (Playwright).
- **Só navegação:** `npm run test:e2e:navigation` — sovereign-navigation.spec.ts (Landing → /app → FlowGate → /auth).
- **Publicar → operar:** incluído em `test:e2e`; publish-to-operational.spec.ts valida bloqueio sem publicar e, com login + restaurante publicado, TPV/KDS visíveis.

O fluxo feliz completo (Signup → Menu → Publicar → TPV → Pedido → KDS) continua a ser verificado manualmente com os passos acima.

---

## Resultado

| Resultado | Ação |
|----------|------|
| Todos os passos ok | Fluxo pronto para piloto; usar VALIDACAO_OPERACAO_PILOTO_01.md na sessão. |
| Falha em 1–2 passos | Anotar em qual passo; corrigir ou documentar como risco conhecido antes do piloto. |
| Múltiplas falhas | Rever B1/B2/B4 ou ambiente (Core, rede). |

---

## Referências

- B1: `docs/product/B1_MENU_CONTENCAO.md`
- B2: `docs/product/B2_TPV_CONTENCAO.md`
- B4: `docs/product/B4_KDS_CONTENCAO.md`
- Piloto: `docs/product/VALIDACAO_OPERACAO_PILOTO_01.md`
- Estados globais UI: `docs/product/GLOBAL_UI_STATE_MAP.md`
