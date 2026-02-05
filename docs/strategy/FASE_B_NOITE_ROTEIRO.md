# Fase B — Roteiro da Noite (Sábado à Noite)

**Isto é o teste.** Humanos, dispositivos reais, caos controlado. Não é script E2E. É o que se faz numa noite real de teste.

---

## Antes de começar

- [ ] **2 restaurantes** criados e com menu (produtos, categorias).
- [ ] **Docker Core** a correr; merchant-portal a correr (ex.: `npm run dev` → http://localhost:5175).
- [ ] **Dispositivos:** 1 tablet ou telemóvel (TPV Mini), 1 ecrã ou portátil (KDS), 1 portátil ou PC (TPV principal / caixa). Opcional: 2º telemóvel para QR Web.
- [ ] **Impressora** ligada (cozinha e/ou caixa) se tiveres; senão, anotar "sem impressão" e seguir.
- [ ] **Pessoas:** mínimo 2 (um faz TPV/caixa, outro KDS; ou um faz dois papéis em janelas diferentes).

---

## Roteiro — 3 blocos de ~15 min

### Bloco 1 — O rush (entrada de pedidos)

**Objetivo:** Simular abertura e primeiros pedidos em paralelo nos 2 restaurantes.

| Hora (ex.) | Quem     | Ação                                                                                                                    | Onde               |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 0:00       | Pessoa 1 | Login Restaurante A. Abrir caixa (se tiver fluxo de abertura).                                                          | TPV principal      |
| 0:02       | Pessoa 1 | Criar pedido manual: mesa 1, 2 cafés, 1 croissant. Confirmar. Imprimir comanda (se tiver).                              | TPV                |
| 0:04       | Pessoa 2 | Login Restaurante A (ou B). Abrir KDS. Ver o pedido da mesa 1? Marcar "em preparação".                                  | KDS                |
| 0:06       | Pessoa 1 | **Em paralelo:** no tablet/telemóvel, abrir TPV Mini (Restaurante A). Criar outro pedido: mesa 2, 3 cervejas. Enviar.   | TPV Mini           |
| 0:08       | Pessoa 2 | No KDS: o pedido da mesa 2 aparece? Marcar mesa 1 "pronto", mesa 2 "em preparação".                                     | KDS                |
| 0:10       | Pessoa 1 | Trocar para **Restaurante B** (selector de tenant). Criar pedido: mesa 1, 1 pizza. Confirmar.                           | TPV                |
| 0:12       | Pessoa 2 | No KDS do Restaurante B (ou outro browser): pedido da pizza aparece?                                                    | KDS                |
| 0:14       | Pessoa 1 | **QR Web:** no telemóvel, abrir link QR do Restaurante A (página pública). Adicionar 1 água ao carrinho. Enviar pedido. | QR Web (telemóvel) |
| 0:16       | Pessoa 2 | O pedido do QR aparece no TPV ou no KDS do Restaurante A?                                                               | TPV / KDS          |

**Anotar:** Onde ficou confuso? Onde não apareceu nada (sistema em silêncio)? Onde travou?

---

### Bloco 2 — Erros humanos (voltar atrás, cancelar, clicar errado)

**Objetivo:** Provocar erros reais e ver se o operador consegue recuperar.

| Hora (ex.) | Quem     | Ação (erro intencional)                                                                                              | O que verificar                                   |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 0:18       | Pessoa 1 | No TPV: abrir um pedido ainda aberto e carregar em **Pagar** por engano (antes de fechar).                           | Consegue cancelar / reverter? Ou fica preso?      |
| 0:20       | Pessoa 2 | No KDS: marcar um pedido como **Pronto** quando ainda não está. Depois: consegue voltar atrás (ex. "em preparação")? | Há reversão ou fica errado?                       |
| 0:22       | Pessoa 1 | Adicionar item errado a um pedido (ex. 2x café em vez de 1). Depois remover 1 ou editar quantidade.                  | O total atualiza? A cozinha vê a correção?        |
| 0:25       | Pessoa 1 | Simular atraso: esperar 30 s sem fazer nada com um pedido "em preparação". O KDS mostra tempo/estado claro?          | Operador sabe que está à espera?                  |
| 0:28       | Pessoa 2 | Se tiver impressão: enviar impressão de um pedido. Se falhar (impressora off): o que aparece no ecrã?                | Mensagem em português? Pedido continua registado? |

**Anotar:** Onde ficou inseguro ("não sei se guardou")? Onde travou sem mensagem?

---

### Bloco 3 — Confluência (2 restaurantes, vários pedidos ao mesmo tempo)

**Objetivo:** Sobrecarga leve: vários pedidos em paralelo nos 2 restaurantes.

| Hora (ex.) | Quem     | Ação                                                                                                  | O que verificar                                                       |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0:30       | Pessoa 1 | Restaurante A: criar 2 pedidos seguidos (mesa 3 e mesa 4). Restaurante B: criar 1 pedido (mesa 2).    | Nenhum pedido desaparece? Totais corretos por restaurante?            |
| 0:35       | Pessoa 2 | KDS A: marcar 2 pedidos "pronto" em sequência. KDS B: marcar 1 "em preparação".                       | Estados consistentes? Nada some?                                      |
| 0:38       | Pessoa 1 | TPV: pagar 1 pedido do Restaurante A e 1 do B. (Abrir caixa/fiscal se aplicável.)                     | Fiscal regista? Algo bloqueia?                                        |
| 0:42       | Ambos    | Parar. Rever: houve algum pedido perdido? Algum total errado? Algum ecrã em branco ou silêncio total? | Critério: passou se nenhum pedido perdido e mensagens compreensíveis. |

**Anotar:** Pedido perdido = falha crítica. Total errado sem forma de corrigir = falha crítica. Silêncio (ecrã branco, sem mensagem) = falha crítica.

---

## Ficha de observação (preencher na noite)

| Momento (bloco/hora) | O que aconteceu | Travar? (sim/não) | Inseguro? (sim/não) | Sistema em silêncio? (sim/não) |
| -------------------- | --------------- | ----------------- | ------------------- | ------------------------------ |
|                      |                 |                   |                     |                                |
|                      |                 |                   |                     |                                |
|                      |                 |                   |                     |                                |

**No fim:** Passou no teste? (Nenhum pedido perdido; operador concluiu fluxo entrada → cozinha → pago; mensagens compreensíveis.) Sim / Não.

---

## Resumo

- **Isto** é o teste de sábado à noite: 2 restaurantes, TPV + TPV Mini + KDS + QR Web, impressão e fiscal quando existirem, erros humanos de propósito.
- **Não** é um script automatizado. É um roteiro para pessoas executarem e anotarem onde dói.
- **Critério de sucesso:** Nenhum pedido perdido; fluxo completo possível; sem stack traces na UI; sem bloqueio sem mensagem.

Referência: [EXECUTION_ORDER_B_A_C.md](./EXECUTION_ORDER_B_A_C.md) — Fase B.
