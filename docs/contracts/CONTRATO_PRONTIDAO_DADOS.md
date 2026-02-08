# Contrato de Prontidão de Dados (Readiness Contract)

**Data:** 2026-02-01
**Tipo:** Contrato Web ↔ Core — quando chamar e quando não chamar
**Hierarquia:** Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](../architecture/CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md)
**Contexto:** [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](../pilots/PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md)

---

## Princípio (uma frase)

A **Web de Configuração** só pode chamar o Core quando o Core tem dados suficientes para responder de forma coerente; caso contrário, a UI deve **explicar**, mostrar **CTA** e **nunca** ficar em branco.

---

## Regras (hard)

| Regra                              | O que significa                                                                                                                                                                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Não chamar RPC antes da hora**   | Não invocar `get_operational_metrics`, `get_shift_history` (ou equivalentes) se não há pedidos/turnos; o Core pode não ter migrations/RPCs ou devolver vazio; a UI não deve assumir sucesso.                                           |
| **Se não há dados, dizer por quê** | Copy de dono: "Ainda sem vendas hoje", "Crie o primeiro produto", "Abra um turno para começar". Nunca tela vazia sem explicação.                                                                                                       |
| **Nunca tela em branco**           | Qualquer rota da Web de Configuração (Menu, Tarefas, Pessoas, Presença Online, Billing, Compras, Financeiro, etc.) deve carregar com estado coerente: lista vazia + CTA ou mensagem humana. 404 silencioso / null = falha de contrato. |
| **Menu primeiro**                  | O humano precisa de pelo menos 1 produto no menu antes de operação real. Menu Builder deve salvar 1 produto sem falhar (endpoint certo, erro tratado, sem Unexpected token `<`).                                                       |

---

## O que está integrado ao Core (hoje)

- Criação de restaurante (tenant, persistência real).
- TPV: abrir turno (quando RPC existe), criar pedidos, eventos.
- KDS: recebe pedidos do TPV, atualiza estado.
- Billing: lê `billing_status`, trial reconhecido.

---

## O que exige gates de prontidão

- **Dashboard / métricas:** não chamar métricas se não há pedidos/turnos; mostrar copy honesta.
- **Menu Builder:** tratar 404/HTML como backend indisponível ou conflito; fallback ou mensagem clara ([MENU_FALLBACK_CONTRACT.md](../architecture/MENU_FALLBACK_CONTRACT.md)).
- **Rotas Web “novas” (Compras, Financeiro, Reservas, Multi-unidade, QR Mesa, etc.):** se não há tabela/RPC no Core, a página deve mostrar estado vazio + explicação + CTA, nunca branco.

---

## Critério de cumprimento

- Nenhuma rota da Web de Configuração carrega em branco.
- Nenhuma chamada ao Core assume sucesso sem tratar falha ou vazio.
- O fluxo humano: criar restaurante → criar 1 produto → abrir turno → fazer pedido → ver no KDS → fechar o ciclo, sem intervenção técnica e sem loops.

---

## Referências

- [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](../pilots/PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md) — F1–F5 e prioridade 72h.
- [MENU_FALLBACK_CONTRACT.md](../architecture/MENU_FALLBACK_CONTRACT.md) — menu quando Core não responde.
- [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](../pilots/TESTE_HUMANO_SUPREMO_E2E_PROMPT.md) — gate de validação.

**Violação = sensação de sistema quebrado; confiança zero.**
