# Contrato de Comunicação Operacional — AppStaff

## Lei do sistema

**Comunicação operacional ≠ WhatsApp. Chat livre é erro.**

Este documento é subcontrato do [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md). O “chat” do AppStaff deve ser contextual, escasso e orientado a eventos. Não grupos soltos, não conversa infinita, não ruído social.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Regra de ouro

| Permitido                                                                                          | Proibido (no contrato) |
| -------------------------------------------------------------------------------------------------- | ---------------------- |
| Contextual (ligado a tarefa, incidente, alerta)                                                    | Grupos soltos          |
| Escasso (mensagens curtas, objectivo claro)                                                        | Conversa infinita      |
| Orientado a eventos (tarefa gera comentário, incidente gera thread, alerta permite resposta curta) | Ruído social           |

---

## 2. Exemplos de uso correcto

- **Tarefa** → Comentário ou thread ligado à tarefa (ex.: “bloqueio”, “pedir ajuda”, “concluído com nota”).
- **Incidente** → Thread ligada ao incidente (ex.: alerta de caixa, atraso crítico). Resposta curta ou acção (confirmar, escalar).
- **Alerta do sistema** → Resposta curta possível (ex.: “recebido”, “a tratar”). Não abrir conversa livre.

O Core (ou módulo de comunicação) define quando existe “thread” e quem pode responder. O AppStaff expõe e envia; não inventa canais.

---

## 3. O que o AppStaff faz

- **Mostra** alertas e notificações do sistema (ex.: tarefa nova, incidente, aviso do gerente).
- **Permite** comentário/thread ligado a tarefa ou incidente quando o Core permitir.
- **Permite** resposta curta a alertas quando o Core permitir (ex.: botão “recebido”, campo de texto curto).
- **Envia** mensagens ao Core; não armazena “chat” como produto independente.

---

## 4. O que o AppStaff não faz

- Criar grupos de conversa livre.
- Oferecer “chat geral” sem contexto (tarefa, incidente, alerta).
- Armazenar histórico de conversa como fim em si (o histórico pode existir no Core ligado a tarefa/incidente; o AppStaff mostra o que o Core expor).

---

## 5. Prioridade de implementação

- **Fase mínima:** Alertas do sistema + notificações de tarefas. Sem chat.
- **Fase seguinte:** Comentário em tarefa (ex.: “bloqueio”, “concluído com nota”) e thread em incidente.
- **Nunca (contrato):** Chat livre, grupos soltos, “WhatsApp interno”.

---

## 6. Resumo

- Comunicação no AppStaff é contextual, escassa e orientada a eventos.
- Tarefa e incidente podem ter comentário/thread; alertas podem ter resposta curta.
- Sem grupos soltos, sem conversa infinita, sem ruído social. O Core pode definir canais e regras; o AppStaff obedece e expõe.
