# CRM Automation

**Propósito:** Pipeline Lead → Qualified → Demo → Trial → Paid com scripts WhatsApp, sequências de email, follow-up de demo e nudges de trial.  
**Ref:** [GLOBAL_COMMERCIAL_OS.md](./GLOBAL_COMMERCIAL_OS.md)

---

## 1. Pipeline

```
Lead → Qualified → Demo → Trial → Paid
```

| Etapa | Critérios de entrada | Critérios de saída | Automação |
|-------|----------------------|--------------------|-----------|
| **Lead** | Form preenchido, chat, WhatsApp | BANT verificado ou rejeitado | Welcome email, notificação vendas |
| **Qualified** | BANT aprovado, segmento confirmado | Demo agendada ou rejeitado | Atribuição SDR, task "Agendar demo" |
| **Demo** | Demo agendada ou realizada | Trial iniciado ou perdido | Reminder 24h, follow-up pós-demo |
| **Trial** | Onboarding completado, trial ativo | Checkout ou churn | Nudges d+1, d+7, d+11 |
| **Paid** | Checkout concluído | — | Confirmação, onboarding pago |

---

## 2. WhatsApp Scripts

### 2.1 Novo lead (resposta imediata)

> Olá! Obrigado pelo interesse no ChefIApp.
>
> Em que tipo de restaurante trabalha?
> - Pequeno (1–2 locais)
> - Multi-local (2–5 casas)
> - Cadeia / Enterprise (6+ locais)
>
> Responda e agendamos uma demo de 15 min, ou comece o trial grátis aqui: [link]

**Variante EN:**
> Hi! Thanks for your interest in ChefIApp.
>
> What type of restaurant do you run?
> - Small (1–2 locations)
> - Multi-location (2–5 locations)
> - Chain / Enterprise (6+ locations)
>
> Reply and we'll schedule a 15-min demo, or start a free trial here: [link]

### 2.2 Lead qualificado — pedir demo

> [Nome], já temos a info do seu restaurante.
>
> Que tal uma demo de 15 min para ver o ChefIApp em acção?
> [Link Calendly]
>
> Ou prefere outro horário? Responda com a sua disponibilidade.

### 2.3 Pós-demo — trial

> Obrigado pela demo! Esperamos que tenha gostado.
>
> Pode iniciar o trial de 14 dias aqui: [link]
>
> Qualquer dúvida, responda a esta mensagem.

### 2.4 Trial d+1 — check-in

> [Nome], como correu o primeiro dia com o ChefIApp?
>
> Precisa de ajuda com o setup ou primeira venda?
>
> Responda aqui ou aceda ao centro de ajuda: [link]

### 2.5 Trial d+7 — valor

> Já passou uma semana no trial. Como está a correr?
>
> Lembrete: pagamento em 2 toques, mapa vivo e tarefas automáticas estão activos.
>
> Quer agendar uma chamada para tirar dúvidas? [Link]

### 2.6 Trial d+11 — conversão

> O seu trial termina em 3 dias.
>
> Para continuar com todas as funcionalidades, escolha o seu plano: [link]
>
> Se tiver dúvidas, responda a esta mensagem.

---

## 3. Email Automation Sequences

### 3.1 Welcome (Lead)

**Assunto:** ChefIApp — Obrigado por se inscrever

> Olá [Nome],
>
> Obrigado pelo interesse no ChefIApp OS. O nosso sistema ajuda restaurantes a operar em menos tempo, com menos erros e mais controlo.
>
> **Próximo passo:** [Agendar demo de 15 min] ou [Começar trial grátis]
>
> Cumprimentos,  
> Equipa ChefIApp

**Trigger:** Novo lead criado  
**Delay:** Imediato

### 3.2 Qualified — Pedir demo

**Assunto:** Demo ChefIApp — 15 min para ver o sistema em acção

> Olá [Nome],
>
> Com base no que partilhou, o ChefIApp pode ajudar o [tipo de restaurante] a:
> - Reduzir tempo de pagamento para segundos
> - Ver o estado do salão em tempo real
> - Automatizar tarefas quando a casa está calma
>
> **Agende uma demo de 15 min:** [Link Calendly]
>
> Cumprimentos,  
> [Nome SDR]

**Trigger:** Lead marcado Qualified  
**Delay:** 1 hora após qualificação

### 3.3 Demo agendada — Reminder 24h

**Assunto:** Lembrete: Demo ChefIApp amanhã às [hora]

> Olá [Nome],
>
> Confirmamos a sua demo amanhã, [data], às [hora].
>
> Prepare 15 minutos para ver:
> - TPV em acção (pagamento 2 toques)
> - Mapa vivo do salão
> - KDS e tarefas automáticas
>
> [Link para entrar na chamada]
>
> Até breve,  
> Equipa ChefIApp

**Trigger:** Demo agendada  
**Delay:** 24 horas antes da demo

### 3.4 Pós-demo — Follow-up

**Assunto:** Obrigado pela demo, [Nome]

> Olá [Nome],
>
> Obrigado pela demo de hoje. Esperamos que tenha gostado do ChefIApp.
>
> **Próximo passo:** Inicie o trial de 14 dias grátis: [link]
>
> Se tiver dúvidas, responda a este email ou agende uma chamada: [link]
>
> Cumprimentos,  
> [Nome SDR]

**Trigger:** Demo marcada como realizada  
**Delay:** 2 horas após fim da demo

### 3.5 Trial d+1

**Assunto:** Como está a correr o primeiro dia com o ChefIApp?

> Olá [Nome],
>
> Esperamos que o primeiro dia com o ChefIApp tenha corrido bem.
>
> **Dica:** A primeira venda demora menos de 10 minutos a configurar.
>
> Precisa de ajuda? [Centro de ajuda] | [Agendar chamada]
>
> Cumprimentos,  
> Equipa ChefIApp

**Trigger:** Trial ativo, 1 dia após onboarding completado  
**Delay:** 24 horas

### 3.6 Trial d+7

**Assunto:** Uma semana no ChefIApp — como está?

> Olá [Nome],
>
> Já passou uma semana no trial. Como está a correr?
>
> Lembrete das funcionalidades que tem activas:
> - Pagamento em 2 toques
> - Mapa vivo do salão
> - Tarefas automáticas quando a casa está calma
>
> Quer tirar dúvidas? [Agendar chamada]
>
> Cumprimentos,  
> Equipa ChefIApp

**Trigger:** Trial ativo, 7 dias após início  
**Delay:** 7 dias

### 3.7 Trial d+11 — Conversão

**Assunto:** O seu trial termina em 3 dias

> Olá [Nome],
>
> O seu trial do ChefIApp termina em 3 dias.
>
> Para manter todas as funcionalidades, escolha o seu plano: [link para pricing]
>
> Dúvidas? Responda a este email.
>
> Cumprimentos,  
> Equipa ChefIApp

**Trigger:** Trial ativo, 11 dias após início (trial_ends_at - 3 dias)  
**Delay:** 11 dias

### 3.8 Conversão paga — Confirmação

**Assunto:** Bem-vindo ao ChefIApp — Plano ativado

> Olá [Nome],
>
> O seu plano ChefIApp [Plano] está activo.
>
> Próximos passos:
> - Aceda ao painel: [link]
> - Configure pagamentos (se ainda não o fez)
> - Consulte a documentação: [link]
>
> Obrigado por confiar no ChefIApp.
>
> Cumprimentos,  
> Equipa ChefIApp

**Trigger:** Webhook Stripe checkout.session.completed  
**Delay:** Imediato

---

## 4. Demo Follow-Up System

### 4.1 Fluxo pós-demo

1. **0–2h:** Email de agradecimento + link trial
2. **24h:** Se não iniciou trial — WhatsApp ou 2º email
3. **48h:** Se não iniciou trial — task SDR "Ligar"
4. **7 dias:** Se não iniciou — marcar como "Demo perdida" ou "Re-engagement"

### 4.2 Templates de follow-up manual (SDR)

**Chamada pós-demo (sem trial):**
> "Olá [Nome], chamo da ChefIApp. Teve alguma dúvida após a demo? Posso ajudar a configurar o trial em 10 minutos."

**Email de re-engagement (demo há 7 dias):**
> "Olá [Nome], vimos que ainda não iniciou o trial. Quer agendar 10 min para configurar em conjunto? [Link]"

---

## 5. Trial Activation Nudges

| Momento | Canal | Mensagem |
|---------|-------|----------|
| d+0 (onboarding completo) | In-app | "Trial activo! Faça a primeira venda em 10 min." |
| d+1 | Email + WhatsApp | "Como correu o primeiro dia?" |
| d+3 | In-app | "Dica: Use o mapa vivo para ver urgências." |
| d+7 | Email | "Uma semana no ChefIApp" |
| d+10 | WhatsApp | "Trial termina em 4 dias. Quer conversar?" |
| d+11 | Email | "Trial termina em 3 dias" |
| d+13 | Email + WhatsApp | "Último dia de trial. Escolha o seu plano." |

---

## 6. Triggers técnicos (implementação CRM)

| Evento | Fonte | Ação |
|--------|-------|------|
| Form submit | Landing / Form | Criar Lead; enviar Welcome email |
| BANT aprovado | SDR manual | Mover para Qualified; enviar "Pedir demo" |
| Calendly booked | Calendly webhook | Mover para Demo; agendar Reminder 24h |
| Demo completed | SDR ou integração | Enviar Pós-demo; criar task "Trial check" |
| Onboarding completed | Core / webhook | Mover para Trial; agendar d+1, d+7, d+11 |
| trial_ends_at - 3d | Cron / workflow | Enviar Trial d+11 |
| Stripe checkout success | Webhook | Mover para Paid; enviar Confirmação |
