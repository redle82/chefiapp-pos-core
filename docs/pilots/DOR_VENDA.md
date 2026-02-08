# Definition of Ready para Venda (DoR)

**Data:** 2026-02-02
**Referência:** [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md) · [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md) · [ONDA_5_ESCOPO_CONGELADO.md](./ONDA_5_ESCOPO_CONGELADO.md). **Pré-requisito satisfeito:** Teste Humano Supremo v2.5 (ritual turno) PASSOU — TPV/Dashboard/KDS uma voz; [VERIFICACAO_SISTEMA_E2E_REGISTO.md](./VERIFICACAO_SISTEMA_E2E_REGISTO.md).

Este documento define o que tem de estar verdade para **vender** (piloto pago, primeiro cliente pagante). Não é contrato legal; é critério de decisão de produto.

---

## 1. O que tem de funcionar para vender

- **Entrada única:** Landing com 1 CTA principal que leva a auth/criação de conta sem loop. Percurso previsível.
- **Criação de restaurante:** Fluxo linear: conta → restaurante (nome, contacto, localização) → área web. Sem bloqueio por billing antes de "selar" o restaurante.
- **Configuração operacional:** Rotas Config → Menu Builder, Tarefas, Pessoas carregam (lista vazia ou dados; sem crash, sem tela em branco).
- **Menu Builder:** Criar pelo menos 1 produto (nome, preço), salvar e ver na lista. Sem "Unexpected token" nem ecrã em branco; se backend indisponível, fallback local com mensagem clara.
- **Billing:** Página Billing acessível; estado TRIAL ATIVO (14 dias) visível; CTA para planos existe. Não bloqueia operação (TPV/KDS).
- **Abrir turno:** Antes do TPV, título e CTA claros ("Começar a vender", "Clique aqui para começar a vender AGORA"). Abrir turno com caixa inicial funciona; em falha, mensagem humana (sem jargão RPC).
- **TPV:** Criar pedido (balcão ou mesa), adicionar produto, confirmar. Pedido aparece.
- **KDS:** Pedido do TPV aparece no KDS; marcar como pronto. Estado reflete no sistema.
- **Ciclo fechado:** Voltar ao TPV e ver pedido finalizado/pronto. Ciclo dono → operação → cozinha → dono fechado.
- **Dashboard:** Carrega; sem erro crítico no console; nenhuma rota essencial inacessível.

**Gate:** O [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md) executado por um humano no browser deve resultar em **PASSOU** ou **PASSOU COM FALHAS** (sem bloqueadores). O veredito humano "Eu conseguiria vender com isto hoje?" deve ser **Sim**.

---

## 2. O que pode falhar sem matar a venda

- **Rotas secundárias:** Algumas rotas de config (ex.: Reservas, Multi-unidade, QR Mesa) podem estar em construção ou vazias — desde que não crasham nem mostram mensagem técnica.
- **Métricas vazias:** Dashboard com "Ainda sem vendas hoje" ou copy honesta quando não há dados — aceitável.
- **Billing não cobrado ainda:** Stripe em trial; não é obrigatório cobrar no primeiro dia. Acesso à página Billing e estado TRIAL visível é suficiente.
- **Core em baixo em DEV:** Se o humano testar com Core (3001) em baixo, banner "Servidor operacional offline. Inicie o Docker Core." e fallbacks (ex.: produto guardado localmente) são aceitáveis — desde que não há engano ("parece que funciona" quando não funciona).

---

## 3. O que não pode quebrar nunca

- **Loop de rota:** Voltar à landing sem decisão explícita = FALHA. Uma única porta de entrada para auth.
- **Tela vazia:** Rota que carrega em branco = FALHA.
- **Mensagem técnica visível ao utilizador:** "RPC", "schema", "endpoint", "token", "JSON", "Unexpected token" = FALHA.
- **Demo/piloto como modo principal:** A landing e o fluxo principal não podem apresentar "demo" ou "piloto" como modo principal de uso (secundário, ex.: "Ver demonstração (3 min)", é aceitável).
- **Bloqueador humano:** Qualquer passo do checklist que impeça o dono de criar restaurante → menu → abrir turno → fazer pedido → ver no KDS → fechar ciclo = não está pronto para venda.

---

## 4. Critério de decisão

**Pronto para venda (P1 Piloto real):** Checklist 10 min executado por humano = PASSOU ou PASSOU COM FALHAS (sem bloqueadores) **e** veredito "Sim" à pergunta "Eu conseguiria vender com isto hoje?".

**Não pronto:** Checklist = FALHOU **ou** veredito "Não". Ação: corrigir apenas o bloqueador humano (plano F1–F5 ou isolado), depois repetir checklist; não "melhorar o sistema" em paralelo.

---

## 5. Próximos passos quando DoR estiver satisfeito

- Ativar **P1 Piloto real** ([CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE](./CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md)).
- Iniciar **Onda 5** com uso real ([ONDA_5_ESCOPO_CONGELADO](./ONDA_5_ESCOPO_CONGELADO.md)).
- Não abrir Onda 5 completa nem vender para mais restaurantes antes do DoR estar satisfeito.
