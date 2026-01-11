# PLANO DE BETA CONTROLADO — ChefIApp

**Período:** Janeiro–Março 2025  
**Objetivo:** 1–3 restaurantes-piloto em produção real  
**Métrica de Sucesso:** NPS > 30 + Zero violações legais + 99.5% uptime

---

## Fase 1: Seleção & Onboarding (Jan 1–14)

### Critérios de Seleção

**Ideais:**
- Casual dining ou dark kitchen (simples operacionalmente)
- Donos/gerentes tech-forward e dispostos a feedback
- Menu < 50 items (fase 1)
- Localização singular (evita complexidade multi-site)
- Dispostos a substituir sistema atual (não "outro paralelo")

**Não-Adequados:**
- ❌ Cadeias com múltiplas locações
- ❌ Compliance complexa (multi-país)
- ❌ Sistemas legados integrados
- ❌ Alto volume (> 300 pedidos/dia)

### Candidatos Potenciais

| Nome | Tipo | Local | Menu | Contato | Status |
|------|------|-------|------|---------|--------|
| Restaurante A | Casual | PT-Lisboa | 35 items | CEO | 🟢 IDEAL |
| Dark Kitchen B | Ghost | ES-Madrid | 20 items | Ops | 🟢 IDEAL |
| Steakhouse C | Premium | BR-SP | 40 items | Manager | 🟡 POSSÍVEL |

### Onboarding Pack

1. **Handbook:** Guia de operação (PT + ES)
2. **Contact:** Slack direto com suporte 24h
3. **Training:** 2 sessões de 1h (Dono + Gerente)
4. **Go-Live:** Segunda (assíncrona, com fallback manual)

---

## Fase 2: Execução & Monitoramento (Jan 15–Feb 28)

### Semana 1–2: Piloto Silencioso

- **Status:** Sistema em operação, mas staff ainda usa legado
- **Propósito:** Testar sem impacto operacional
- **Métricas:** 100% ordens sincronizadas, zero erros críticos

### Semana 3–4: Cutover Parcial

- **Status:** Sistema live, mas com fallback manual rápido
- **Propósito:** Validar decisões em tempo real
- **Métricas:**
  - Tempo de onboarding < 30 min
  - Tempo de confirmação de pedido < 2s
  - Sem erros críticos > 1h

### Semana 5–8: Pleno Funcionamento

- **Status:** Sistema 100% produção
- **Propósito:** NPS, compliance, UX refinement
- **Métricas:**
  - Uptime 99.5%+
  - NPS > 30
  - Zero violações legais
  - Taxa de erro < 0.1%

### Monitoramento Diário

```
Dashboard (Acessível ao restaurante)
├── Pedidos hoje: XX
├── Taxa de erro: X.X%
├── Uptime: 99.X%
├── Tempo médio (onboarding-pagamento): Xs
└── Alertas: [lista]
```

---

## Fase 3: Feedback & Iteração (Mar 1–31)

### Coleta de Feedback

| Canal | Frequência | Responsável |
|-------|-----------|------------|
| Entrevista semanal | 1h | CPO |
| Survey NPS | Semanal | Customer Success |
| Telemetria | Contínuo | Analytics |
| Bugs reportados | On-demand | Suporte |

### Quick-Fix Cycle

- **Critical:** 4h fixo + deploy
- **High:** 24h fixo + deploy
- **Medium:** Sprint planning
- **Low:** Post-beta backlog

### Métricas de Iteração

| Métrica | Baseline | Alvo | Mecanismo |
|---------|----------|------|-----------|
| Time-to-confirm | 3s | < 2s | UI optimization |
| Menu edit latency | 10s | < 5s | Frontend cache |
| Compliance score | - | 95%+ | Enforcement |
| NPS | - | > 40 | Qualitative fixes |

---

## Fase 4: Escala & Go-To-Market (Abr+)

### Decisão Pós-Beta

| Cenário | Decisão |
|---------|---------|
| NPS > 40 + 0 bugs críticos | ESCALA (próx. 10 restaurantes) |
| NPS 30–40 + bugs médios | REFINE (1-2 semanas) |
| NPS < 30 OR bugs críticos | REASSESS (arquitetura/produto) |

### Scale Plan (se GO)

1. **Semana 1–2:** Prepare 5 novos restaurantes
2. **Semana 3–4:** Cutover paralelo (5 novos + 3 pilotos)
3. **Semana 5–8:** Monitore 8 total; prepare próximos 5
4. **Mês 2:** 15+ restaurantes + GTM campaign

---

## Operações de Beta

### Suporte Dedicado

- **Slack Channel:** #chefiapp-beta-pilots
- **Escalation:** CPO (48h) → CEO (24h)
- **SLA:** Resposta em < 2h (crítico)

### Compliance Monitoramento

- **Daily:** Check legal profiles match operação
- **Weekly:** Auditoria de logs HACCP (se aplicável)
- **Monthly:** Legal review (nenhuma violação esperada)

### Billing

- **Modelo:** Gratuito (beta)
- **Pós-Beta:** Preço por restaurante + pedidos (TBD)

---

## KPIs Finais

| KPI | Target | Impacto |
|-----|--------|--------|
| Uptime | 99.5%+ | Confiabilidade |
| Order latency (p99) | < 2s | UX |
| Compliance score | 100% | Legal |
| NPS | > 30 | Product fit |
| Support tickets/day | < 2 | Operações |
| Critical bugs | 0 | Stability |

---

## Timeline

```
Início                                           Fim Beta
|                                                |
Jan ├─ Seleção ──┬─ Onboarding ──┬─ Execução ──┬─ Feedback
    1–14        15–24            25–28       29–31

Fev ├─ Semanas 1–4: Execução + Monitoramento ──┤
    1–28

Mar ├─ Semanas 1–4: Feedback + Quick-fix cycle ──┤
    1–31

Abr → Decisão GO/REFINE/REASSESS
```

---

## Contingency

| Evento | Plano B |
|--------|---------|
| Restaurante 1 sai | Recruta 2 novos |
| Bug crítico em semana 2 | Fix 24h + comunicação |
| Compliance violation | Escalação legal imediata |
| Stripe webhook fails | Manual billing till resolução |

---

## Go-Live Checklist

- [ ] 1–3 restaurantes selecionados
- [ ] Handbook traduzido (PT + ES)
- [ ] Suporte 24h preparado
- [ ] Dashboard de monitoramento live
- [ ] Legal terms assinados
- [ ] Backup manual de operações documentado
- [ ] Router Guard implementado e testado

**Status:** READY FOR EXECUTION

**Próximas Ações:**
1. Selecionar restaurantes (48h)
2. Preparar materials (72h)
3. Go-live Semana 1 de Jan
