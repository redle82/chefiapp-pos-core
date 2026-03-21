# Enterprise Offer Packaging

**Propósito:** Oferta Enterprise como produto vendável — definição de produto, pricing, copy de landing e funil de vendas.  
**Ref:** [PRICING_AND_PACKAGES.md](./PRICING_AND_PACKAGES.md), [SEGMENTED_SALES_FUNNEL.md](./SEGMENTED_SALES_FUNNEL.md)

---

## PHASE 1 — PRODUCT DEFINITION (Offer Sheet)

### Enterprise Offer Sheet

| Campo | Conteúdo |
|-------|----------|
| **Nome** | ChefIApp Enterprise |
| **Tipo** | Software-as-a-Service (POS + comando central financeiro) |

#### Who it is for

- **Chains** — 4+ locais, gestão centralizada, necessidade de uma verdade financeira
- **Franchises** — Franqueados com reporting obrigatório ao franqueador
- **Multi-location operators** — Donos ou gestores com 4–20+ restaurantes
- **Grupos hoteleiros** — Restauração com F&B consolidado

#### Core promise

> **Integridade financeira + consolidação + faturação.**

Uma única visão da verdade: vendas, discrepâncias e reconciliação por local e por dia. Dashboard central com risk intelligence, heatmap semanal e export consolidado. Faturação e auditoria prontas para contabilidade e compliance.

#### Pain points solved

| Dor | Solução |
|-----|---------|
| Dados fragmentados por local | Consolidação diária automática |
| Discrepâncias escondidas | Risk score + alertas + heatmap |
| Relatórios manuais para contabilidade | Export CSV consolidado com ratio e status |
| Falta de visibilidade central | Dashboard Enterprise com breakdown por restaurante |
| Auditorias e fiscalização | RBAC completo, trilha de auditoria, faturação clara |
| Caos operacional multi-local | Workforce Orchestrator + KDS + POS unificados |

#### Why now

- **Risco** — Leakage e discrepâncias crescem com o número de locais; quanto mais tarde, mais caro corrigir
- **Leakage** — Sem consolidação, perdas passam despercebidas até à auditoria
- **Caos** — Sistemas distintos por local = relatórios manuais e erros
- **Auditorias** — Contabilidade e fiscalidade exigem provas e rastreabilidade
- **Crescimento** — Escalar sem visibilidade financeira é arriscado

---

## PHASE 2 — PRICING & PACKAGES

### Tiers (EUR)

| Tier | Mensal | Anual (-20%) | Incluído | Bloqueado (upsell) |
|------|--------|--------------|----------|--------------------|
| **Starter** | €29 | €279 (€23,25/mês) | 1 local, POS, KDS, fechamento de caixa | Workforce, Intelligence, multi-local |
| **Growth** | €59 | €567 (€47,25/mês) | Até 3 locais, Workforce Orchestrator, tarefas, turnos | Intelligence, API, Enterprise dashboard |
| **Enterprise** | €99 | €950 (€79,17/mês) | Locais ilimitados, Intelligence, consolidação, risk score, API, suporte prioritário | — |

### Detalhe por tier

#### Starter (single location)

- 1 local
- POS + KDS + pagamentos
- Fechamento de caixa
- **Bloqueado:** Workforce, analytics, multi-local, API

#### Growth (multi-location)

- Até 3 locais
- Tudo do Starter
- Workforce Orchestrator
- Tarefas automáticas, check-in, turnos
- **Bloqueado:** Dashboard de consolidação, Risk Intelligence, API pública, suporte prioritário

#### Enterprise (consolidation + invoices + risk intelligence)

- Locais ilimitados
- Tudo do Growth
- **Dashboard Enterprise:** consolidação diária por local
- **Risk Intelligence:** score 0–100, heatmap semanal, alertas tendência/escalação
- **Export consolidado:** CSV com resumo org, breakdown, heatmap
- **API documentada**
- **Suporte prioritário**
- RBAC completo, auditoria, faturação pronta para contabilidade

### Upsell triggers

| Situação | Trigger | Acção |
|----------|---------|-------|
| Growth com 4.º local | Tentar adicionar local | "Migrar para Enterprise" |
| Necessidade de relatório consolidado | Acesso a /admin/enterprise | "Enterprise inclui consolidação" |
| Discrepâncias frequentes | Pedido de reconciliação manual | "Risk Intelligence detecta e previne" |
| Integração externa | Pedido de API | "Enterprise inclui API documentada" |

---

## PHASE 3 — LANDING COPY

### Hero

**Headline:**
> Comando central para a sua rede. Uma verdade financeira.

**Subheadline:**
> Consolidação diária, risk intelligence e faturação pronta. Para cadeias, franchisados e operadores multi-local.

### 5 bullet benefits

1. **Consolidação diária automática** — Vendas, discrepâncias e status por local num só dashboard  
2. **Risk score 0–100** — Detecte tendências e escalações antes de auditores ou contabilidade  
3. **Heatmap semanal** — Visualize discrepâncias por local e dia; identifique padrões  
4. **Export consolidado** — CSV com resumo org, breakdown por restaurante e heatmap para contabilidade  
5. **API + suporte prioritário** — Integrações, migrações e suporte dedicado

### ROI section (example numbers)

**Cenário: 6 locais, €150k/mês de faturação**

| Sem ChefIApp Enterprise | Com ChefIApp Enterprise |
|-------------------------|--------------------------|
| Relatórios manuais: 8h/semana | Consolidação automática: 0h |
| Discrepâncias descobertas em auditoria | Risk score e alertas em tempo real |
| Custo estimado de leakage: 0,5% = €750/mês | Redução de leakage: recuperação estimada €400–600/mês |
| Tempo de reconciliação: 2–3 dias/mês | Export em segundos |

**ROI:** Recuperação de €400+/mês em leakage + 8h/semana de tempo de gestão ≈ **€99/mês pagam-se em <1 semana**.

### FAQ

**O que acontece se pausar a faturação?**  
Acesso ao dashboard é suspenso. Dados ficam retidos 90 dias. Reativação restaura acesso imediato.

**A reconciliação é obrigatória?**  
O ChefIApp não força reconciliação. O dashboard Enterprise mostra discrepâncias e risk score; a acção é sua. Recomendamos revisão semanal para compliance.

**O que acontece se o trial acabar?**  
Pode escolher um plano pago ou encerrar. Dados exportáveis em CSV antes do encerramento.

**Enterprise inclui integração com a minha contabilidade?**  
Export CSV consolidado é compatível com Excel e a maioria dos softwares de contabilidade. Integrações directas (API) disponíveis sob consulta.

### CTA texts

**WhatsApp:**
> Olá! Tenho X locais e preciso de consolidação financeira central. O plano Enterprise inclui dashboard e risk intelligence? Podemos agendar uma demo?

**Demo request:**
> Agendar demo Enterprise — quero ver o dashboard de consolidação e o risk score em acção.

---

## PHASE 4 — SALES FLOW (7-step funnel)

### Step 1 — Country landing

- Utilizador chega a `/gb`, `/es`, `/br` ou `/us`
- Hero + pricing resumido
- Segmento detectado ou escolhido: `?segment=enterprise`

**Script:** "Chegou à landing do país. Vê o ChefIApp como sistema operativo para restaurantes."

---

### Step 2 — Pricing

- Página de preços com 3 tiers: Starter, Growth, Enterprise
- Enterprise destacado com badge "Para redes"
- Preço mensal e anual (-20%) visíveis

**Script:** "Vê os 3 planos. Clica em Enterprise para mais detalhes ou em 'Agendar demo'."

---

### Step 3 — Enterprise tease

- Bloco dedicado ao Enterprise: "Comando central para redes"
- 5 bullets de benefícios
- CTA: "Agendar demo" / "Falar com vendas"

**Script:** "Lê os benefícios Enterprise. Se tem 4+ locais ou precisa de consolidação, este é o plano indicado."

---

### Step 4 — WhatsApp CTA

- Botão "Falar por WhatsApp" com mensagem pré-preenchida
- Mensagem inclui: nome, país, nº de locais, interesse em Enterprise

**Script:** "Clica no WhatsApp. Mensagem abre com template. Edita e envia."

---

### Step 5 — Qualification questions (5 perguntas)

1. **Quantos locais tem actualmente?** (1 / 2–3 / 4–6 / 7+)
2. **Qual o maior desafio financeiro hoje?** (Dados fragmentados / Discrepâncias / Relatórios manuais / Auditorias)
3. **Que sistemas usa por local?** (POS único / POS diferente por local / Mistura)
4. **Qual o timing para decisão?** (Imediato / 1–3 meses / Avaliação)
5. **Quem decide a compra?** (Eu / Sócio / Contabilidade / Comité)

**Script:** "Vendas ou SDR faz estas 5 perguntas por WhatsApp ou call. Classifica: quente / morno / frio."

---

### Step 6 — Proposal template outline

1. **Contexto** — Resumo da conversa e necessidades
2. **Solução proposta** — ChefIApp Enterprise
3. **Incluído** — Locais ilimitados, consolidação, risk intelligence, API, suporte
4. **Preço** — €99/mês ou €950/ano (economia 20%)
5. **Próximos passos** — Trial 14 dias ou setup assistido (opcional)
6. **Assinatura** — Link checkout ou contrato

**Script:** "Proposta em 1 página. Inclui link de checkout ou pedido de assinatura."

---

### Step 7 — Close + onboarding next steps

- Cliente paga ou assina
- Recebe email de boas-vindas + link de onboarding
- Onboarding: criar org, adicionar locais, configurar primeiros restaurantes
- Primeira consolidação disponível após 24h de dados

**Script:** "Fechado. Envio email com próximos passos. Setup em 24–48h. Primeira consolidação no dashboard em 24h."

---

## PHASE 5 — OUTPUT SUMMARY

| Artefacto | Localização |
|-----------|-------------|
| Offer Sheet | Secção Phase 1 deste documento |
| Pricing table | Secção Phase 2 |
| Landing copy blocks | Secção Phase 3 |
| Funnel steps + scripts | Secção Phase 4 |

---

## Referências

- [PRICING_AND_PACKAGES.md](./PRICING_AND_PACKAGES.md) — Planos e preços oficiais
- [SEGMENTED_SALES_FUNNEL.md](./SEGMENTED_SALES_FUNNEL.md) — Funis por vertical
- [COUNTRY_DEPLOYMENT_SYSTEM.md](./COUNTRY_DEPLOYMENT_SYSTEM.md) — Landings por país
- [CRM_AUTOMATION.md](./CRM_AUTOMATION.md) — Pipeline Lead → Qualified → Demo → Trial → Paid
