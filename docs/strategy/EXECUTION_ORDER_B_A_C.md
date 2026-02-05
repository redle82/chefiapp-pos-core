# Ordem de Execução B → A → C

**Propósito:** Âncora de decisão. A ordem existe para provar o sistema no mundo real antes de endurecer engenharia e só depois fechar narrativa. Evita decisões tipo "vamos fazer Auth agora porque parece bonito". Referências: [NEXT_ACTIONS.md](./NEXT_ACTIONS.md), [TESTE_HUMANO_POS_NASCIMENTO.md](../TESTE_HUMANO_POS_NASCIMENTO.md).

---

## Fase B — Stress Test Humano

**Não é "uso real leve".** É ensaio geral: simular um sábado à noite com caos controlado. Objetivo: encontrar **dor humana** (UX quebrado, confusão, silêncio do sistema), não bug técnico. Tudo o que não aparece em testes automatizados.

### Cenário obrigatório

- **2 restaurantes** ativos em simultâneo
- **TPV Mini** (tablet/celular) + TPV principal
- **KDS Mini** + KDS principal
- **Fiscal** ativo
- **Impressão** (cozinha e caixa)
- **QR Web** funcionando em Android e iOS
- **Múltiplos pedidos concorrentes**
- **Erros humanos intencionais:** voltar atrás, cancelar, repetir item, clicar no botão errado, atrasar deliberadamente

### Fluxo completo de um pedido

1. **QR** — Cliente abre QR na mesa (Web), monta carrinho, envia pedido.
2. **TPV** — Pedido entra no TPV (ou TPV Mini); operador confirma/ajusta; pode imprimir comanda.
3. **KDS** — Pedido aparece no KDS (principal e/ou Mini); cozinha marca estados (em preparação, pronto).
4. **Fiscal** — Evento fiscal registado (abertura de caixa, venda, fecho); integração AT quando aplicável.
5. **Impressão** — Comanda cozinha, talão caixa, ou ambos; fila e estado visíveis para o operador.

### Componentes que precisam estar operacionais

| Componente                 | Função mínima                                                          |
| -------------------------- | ---------------------------------------------------------------------- |
| Docker Core                | Backend único para orders, stock, fiscal, billing (já enforced).       |
| Auth (Supabase temporário) | Login/sessão para TPV, KDS, config.                                    |
| TPV / TPV Mini             | Criar e gerir pedidos; ver total; pagar; imprimir.                     |
| KDS / KDS Mini             | Receber pedidos; marcar estados; visibilidade em tempo (quase) real.   |
| Fiscal                     | Registar vendas; não bloquear fluxo em falha recuperável.              |
| Impressão                  | Fila no Core; comanda e/ou talão; mensagem clara se impressora falhar. |
| QR Web                     | Página pública por restaurante; carrinho; submissão para fila/TPV.     |

### Pontos de confusão humana (por etapa)

- **QR:** "O pedido foi mesmo enviado?" — Feedback imediato (número, "a chegar à cozinha") ou mensagem de erro clara.
- **TPV:** "Qual restaurante estou? Qual mesa?" — Contexto visível sem procurar. "O que faço se carreguei em pagar por engano?" — Cancelar ou reverter com um passo.
- **KDS:** "Quem vê o pedido primeiro — principal ou Mini?" — Comportamento consistente; não desaparecer pedidos.
- **Fiscal:** "Falhou o fiscal — posso continuar?" — Sim, com aviso; nada de travar caixa sem mensagem.
- **Impressão:** "A impressora não imprime — o pedido foi perdido?" — Pedido continua no sistema; mensagem "impressão em fila" ou "erro de impressora; pedido registado".

### Critérios de sucesso e falha

| Resultado           | Definição                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Passou no teste** | Nenhum pedido perdido; operador consegue concluir um serviço completo (entrada → cozinha → pago) mesmo com erros humanos e atrasos; mensagens de erro são compreensíveis (não stack traces). |
| **Falha aceitável** | Atraso de alguns segundos; impressão atrasada; um refresh manual; mensagem técnica mas com saída clara ("continuar em demonstração" ou equivalente).                                         |
| **Falha crítica**   | Pedido desaparece; total errado sem forma de corrigir; ecrã branco ou silêncio total; bloqueio sem mensagem.                                                                                 |

### Sinais para humanos (mínimos)

- **Durante o fluxo:** Estado do pedido visível (ex.: "A chegar à cozinha", "Em preparação", "Pago"). Nada de IDs internos como única informação.
- **Em falha:** Uma frase em português: o que falhou e o que o utilizador pode fazer (ex.: "Impressora indisponível; o pedido foi registado. Pode imprimir mais tarde.").
- **Sem:** Stack traces, códigos de erro técnicos ou logs de debug na UI.

### Fora de escopo da Fase B

- Billing SaaS (subscrições, planos) — não é critério para "noite passou".
- Multi-unidade avançado (vários locais, consolidação).
- Core Auth (continua Supabase Auth temporário).
- Novas features ou refactors; apenas o que já existe, com ajustes mínimos de UX se necessário.

---

## Fase A — Consolidação Técnica

**Só faz sentido depois do teste humano.** Com dados reais da noite (onde doeu, onde travou), priorizar:

- **Core Auth soberano** — Substituir Supabase Auth; sessão e identidade no Core.
- **Modo degradado / safe-mode** — Quando Core ou rede falha, mensagem clara e caminho de saída (não ecrã morto).
- **Observabilidade real** — Health, alertas, audit trails; suficiente para operar e debugar em produção.

Ideal para: restaurantes reais, compliance, venda B2B séria, longa vida do produto.

---

## Fase C — Narrativa

**Só deve ser escrita quando a verdade já doeu.** Depois de B (noite de caos) e A (consolidação), documentar:

- **Documento executivo** — O que é o sistema, por que é diferente (soberania, Restaurant OS).
- **Roadmap claro** — P3, P4, P5 alinhados ao que foi aprendido.
- **Posicionamento** — "Restaurant OS soberano" para parceiros e investidores.

Ideal para: parcerias, investimento, venda institucional.
