# Checklist 10 min — Teste Humano Supremo v1.1

**Uso:** Executar no browser (tu), sem Antigravity. ~10 min. Regista só PASSA/FALHA por passo.

**Regra:** Loop = FALHA. Tela vazia = FALHA. Mensagem técnica visível = FALHA.

---

## Pré-flight (30 s)

- [ ] Abrir <http://localhost:5175> — responde?
- [ ] Core (3001) está up? Se não: `docker compose -f docker-core/docker-compose.core.yml up -d`
- [ ] Se vires banner "Servidor operacional offline. Inicie o Docker Core." → Core em baixo; inicia o Docker Core antes de continuar.
- [ ] Badge de estado do Core visível na sidebar (🟢 ativo / 🟡 instável / 🔴 offline). Nenhuma tela técnica interrompe o fluxo. ☐ PASSA ☐ FALHA

---

## FASE 1 — Entrada + restaurante (~2 min)

| #   | Acção                                                                                                   | PASSA / FALHA   |
| --- | ------------------------------------------------------------------------------------------------------- | --------------- |
| 1   | Ir a `/` — existe CTA "Criar restaurante" / "Começar"? Clica e vai para auth sem voltar à landing.      | ☐ PASSA ☐ FALHA |
| 2   | Criar conta (email fictício) + criar restaurante (nome, contacto). Fluxo linear até entrar na área web. | ☐ PASSA ☐ FALHA |

---

## FASE 2 — Config + Menu (~2 min)

| #   | Acção                                                                                          | PASSA / FALHA   |
| --- | ---------------------------------------------------------------------------------------------- | --------------- |
| 3   | Ir a Config → Menu Builder, Tarefas, Pessoas. Todas carregam (não vazias, sem crash).          | ☐ PASSA ☐ FALHA |
| 4   | Menu Builder: criar 1 produto (nome, preço). Salva e aparece na lista. Sem "Unexpected token". | ☐ PASSA ☐ FALHA |

---

## FASE 3 — Billing (~30 s)

| #   | Acção                                                                              | PASSA / FALHA   |
| --- | ---------------------------------------------------------------------------------- | --------------- |
| 5   | Ir a Billing. Estado TRIAL ATIVO (14 dias). CTA para planos visível. Não bloqueia. | ☐ PASSA ☐ FALHA |

---

## FASE 4 — Turno + TPV + KDS (~3 min)

| #   | Acção                                                                                       | PASSA / FALHA   |
| --- | ------------------------------------------------------------------------------------------- | --------------- |
| 6   | Ir ao TPV. "Abrir Turno" / "Começar a vender" visível. Abrir turno — abre sem erro técnico. | ☐ PASSA ☐ FALHA |
| 7   | Criar pedido (balcão/mesa), adicionar o produto, confirmar. Pedido aparece.                 | ☐ PASSA ☐ FALHA |
| 8   | Ir ao KDS. Pedido aparece. Marcar como pronto.                                              | ☐ PASSA ☐ FALHA |
| 9   | Voltar ao TPV. Pedido em estado finalizado. Ciclo fechado.                                  | ☐ PASSA ☐ FALHA |

---

## FASE 5 — Veredito (~30 s)

| #   | Acção                                                                               | PASSA / FALHA   |
| --- | ----------------------------------------------------------------------------------- | --------------- |
| 10  | Dashboard carrega. Sem erro crítico no console. Nenhuma rota essencial inacessível. | ☐ PASSA ☐ FALHA |

---

## Resultado final

- **Status:** ☐ PASSOU ☐ PASSOU COM FALHAS ☐ FALHOU
- **Falhas (lista curta):** **********\*\***********\_\_\_**********\*\***********
- **Veredito humano:** "Como dono de restaurante, eu conseguiria vender com isto hoje?" ☐ Sim ☐ Não — por quê: **\*\*\*\***\_**\*\*\*\***

---

## Depois de preencher

- Atualizar a secção "Resultado do teste v2" em [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md).
- Opcional: copiar este resultado para [RELATORIO_TESTE_HUMANO_SUPREMO_V1.1_AGENTE.md](./RELATORIO_TESTE_HUMANO_SUPREMO_V1.1_AGENTE.md) (secção 4 — veredito humano).
