# Onda 4 — Piloto P2 (métricas e decisão)

**Data:** 2026-02-01 · **Atualizado:** 2026-02-08  
**Referências:** [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) (Bloco 2) · [ONDA_4_TAREFAS_30_45_DIAS.md](../ONDA_4_TAREFAS_30_45_DIAS.md) · [METRICS_DICTIONARY.md](../architecture/METRICS_DICTIONARY.md)  
**Objetivo:** Itens 10–13: métricas de piloto, template de report, checklist 2 semanas, regra de decisão go/no-go para Onda 5.

**Passo 2 — Medição, não opinião.** Ao fim de 2 semanas de piloto: recolher dados (§10), preencher report (§11), executar checklist (§12), aplicar regra (§13).

**Estado:** Métricas definidas, templates prontos, regra de decisão fechada. Usar quando P1 tiver 2 semanas de dados reais.

---

## 10. Métricas de piloto — Definidas ✅

Métricas a recolher durante o piloto (2 semanas por restaurante).

| # | Métrica | Fonte | Como recolher | Meta (go) |
|---|---------|-------|---------------|----------|
| M1 | **Dias com uso** | Sistema (active_shifts_count) | Contar dias com ≥1 turno aberto | ≥ 10 de 14 dias |
| M2 | **Pedidos totais** | Sistema (orders_created_total) | Dashboard → KPIs snapshot | ≥ 50 pedidos em 14 dias |
| M3 | **Pedidos/dia (média)** | M2 / M1 | Calculado | ≥ 5/dia |
| M4 | **Receita total (€)** | Sistema (payments_amount_cents) | Dashboard → Faturado | Registar (sem limiar mínimo) |
| M5 | **Erros críticos** | Logs + WhatsApp do piloto | Pagamentos falhados, perda de dados, crash | 0 |
| M6 | **Erros não-críticos** | WhatsApp + observação | UI confusa, lentidão, pedidos de ajuda | Listar; ≤ 5 por restaurante |
| M7 | **Satisfação (1–5)** | Pergunta direta ao dono (dia 14) | "De 1 a 5, quão útil é o ChefIApp no dia-a-dia?" | ≥ 4 de média |
| M8 | **Recomendaria? (sim/não)** | Pergunta direta ao dono (dia 14) | "Recomendarias a outro restaurante?" | ≥ 60% sim |
| M9 | **Tempo 1ª venda** | Observação (dia 1 da instalação) | Minutos desde login até 1ª venda fechada no TPV | ≤ 10 min |

**Recolha automática:** M1–M4 via get_operational_metrics RPC ou Dashboard. M5–M6 manual (WhatsApp + log). M7–M9 manual (pergunta + cronómetro dia 1).

- [x] Métricas definidas e documentadas.
- [ ] Métricas comunicadas aos pilotos no dia da instalação.

---

## 11. Template report (2 semanas) — Pronto ✅

Copiar este template para cada restaurante piloto. Preencher ao fim de 2 semanas.

---

### Report Piloto — [NOME DO RESTAURANTE]

**Restaurante:** _______________  
**Contacto:** _______________  
**Período:** ____/____/2026 – ____/____/2026 (14 dias)  
**Data do report:** ____/____/2026  
**Preenchido por:** _______________

#### Resumo operacional

| Indicador | Valor | Meta | Status |
|-----------|-------|------|--------|
| Dias com uso (M1) | __ / 14 | ≥ 10 | ⬜ |
| Pedidos totais (M2) | __ | ≥ 50 | ⬜ |
| Pedidos/dia média (M3) | __ | ≥ 5 | ⬜ |
| Receita total € (M4) | €__ | (registar) | — |
| Erros críticos (M5) | __ | 0 | ⬜ |
| Erros não-críticos (M6) | __ | ≤ 5 | ⬜ |
| Satisfação 1–5 (M7) | __ | ≥ 4 | ⬜ |
| Recomendaria? (M8) | sim / não | — | ⬜ |
| Tempo 1ª venda min (M9) | __ min | ≤ 10 | ⬜ |

#### Feedback qualitativo

**O que correu bem:**
1. _______________
2. _______________
3. _______________

**O que correu mal ou foi confuso:**
1. _______________
2. _______________
3. _______________

**Pedidos de melhoria (top 3):**
1. _______________
2. _______________
3. _______________

#### Veredicto deste restaurante

- [ ] **GO** — Usa regularmente, satisfeito, sem bloqueadores.
- [ ] **CONDICIONAL** — Usa mas com fricções; precisa de ajustes específicos: _______________
- [ ] **NO-GO** — Não usa ou "não usaria de novo"; motivo: _______________

---

*(fim do template — copiar e colar por restaurante)*

---

## 12. Checklist 2 semanas — Pronto ✅

Executar ao fim de 14 dias de piloto (global, não por restaurante).

### Semana 1 (dias 1–7)

- [ ] Dia 1: Cada restaurante fez ≥1 venda no TPV (M9 registado).
- [ ] Dia 3: Check-in WhatsApp — perguntar "Está tudo operacional? Algum problema?"
- [ ] Dia 3: Verificar no Dashboard se há pedidos e turnos registados (M1, M2).
- [ ] Dia 7: Check-in rápido — perguntar se houve erros ou confusões (M6).

### Semana 2 (dias 8–14)

- [ ] Dia 10: Check-in WhatsApp — "Como está a correr? Precisa de ajuda?"
- [ ] Dia 10: Verificar métricas automáticas (M1–M4) no Dashboard de cada piloto.
- [ ] Dia 14: Recolher M7 (satisfação 1–5) e M8 (recomendaria?) por WhatsApp ou chamada.
- [ ] Dia 14: Preencher template §11 para cada restaurante.

### Consolidação (dia 14–15)

- [ ] Todos os reports §11 preenchidos (um por restaurante).
- [ ] Feedback qualitativo consolidado (padrões: top 3 positivos, top 3 negativos).
- [ ] Métricas agregadas calculadas (totais e médias de M1–M9).
- [ ] Dados prontos para aplicar regra §13.

---

## 13. Regra de decisão (go/no-go Onda 5) — Definida ✅

### Critérios de decisão

| # | Critério | GO | NO-GO |
|---|----------|-----|--------|
| C1 | Restaurantes com ≥1 venda real | ≥ 2 de 5 instalados | < 2 |
| C2 | Erros críticos (M5) — total, todos os pilotos | 0 | ≥ 1 |
| C3 | Satisfação média (M7) | ≥ 4.0 | < 3.5 |
| C4 | "Recomendaria?" sim (M8) | ≥ 60% | < 40% |
| C5 | Feedback qualitativo | Maioria positiva; melhorias executáveis | Bloqueadores ("não usaria de novo") |
| C6 | Dias com uso média (M1) | ≥ 8 de 14 | < 5 |

### Regra

- **GO** se: C1 + C2 + C3 + C6 todos cumpridos, e nenhum C5 bloqueador.
- **NO-GO** se: C2 falha (erro crítico) OU C1 falha (< 2 restaurantes usam).
- **CONDICIONAL** se: C3 ou C4 na zona cinzenta (3.5–4.0 ou 40–60%) → reunião para decidir ajustes antes de avançar.
- **Em caso de dúvida:** Prolongar piloto +7 dias com os mesmos restaurantes; repetir métricas. Se continuar ambíguo → NO-GO (iterar produto antes de escalar).

### Processo

1. Dia 15: Consolidar reports §11 e métricas agregadas.
2. Dia 15–16: Aplicar tabela de critérios C1–C6.
3. Resultado: anotar aqui → GO / CONDICIONAL / NO-GO.
4. Se GO → marcar kick-off Onda 5 (validação com uso real).
5. Se NO-GO → criar lista de 3 ajustes prioritários; prazo 7 dias; repetir piloto.

- [x] Regra de decisão definida e documentada.
- [ ] Data da reunião de decisão: ____/____/2026 (dia 15 após início do P1).
- [ ] Resultado: ⬜ GO / ⬜ CONDICIONAL / ⬜ NO-GO

---

**Estado atual do Piloto P2:** Templates completos e prontos para uso. Executar quando P1 tiver 2 semanas de dados reais.

*Ao preencher, marcar os itens 10–13 no [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) como concluídos.*
