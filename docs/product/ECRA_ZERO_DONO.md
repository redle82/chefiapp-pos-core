# Ecrã Zero do Dono

**Objetivo:** Dar controlo imediato em ≤ 10 segundos, sem interpretação. É o primeiro ecrã após login para o Dono.

**Fonte de verdade:** Este documento. Contrato para estado → regra → botão no código.

---

## 1. O que o Dono vê (exatamente)

### Linha 1 — Frase única (estado)

Uma frase, grande, inevitável. Nunca números. Só juízo.

| Estado | Frase |
|--------|--------|
| Verde | **Está tudo sob controlo hoje.** |
| Amarelo | **Há pontos a acompanhar hoje.** |
| Vermelho | **Há algo crítico que precisa de atenção.** |

### Linha 2 — Motivo resumido (1 linha, opcional)

Apenas se não estiver verde. Máx. 1 motivo. Não lista. Não dashboard.

Exemplos: "Caixa ainda não aberto.", "Vendas abaixo do esperado neste horário.", "Fila da cozinha acima do normal.", "Turno sem responsável ativo."

### Linha 3 — Gesto único

Um único botão, sempre no mesmo lugar. O botão não muda de posição, só o texto.

| Estado | Texto do botão |
|--------|----------------|
| Verde | Ver resumo do dia |
| Amarelo | Ver o que precisa de atenção |
| Vermelho | Agir agora |

---

## 2. O que o Dono NÃO vê no Ecrã Zero

Não vê: listas, gráficos, cards, tabs, filtros, menus, staff, configurações, histórico, métricas detalhadas. Tudo isso só aparece depois do clique.

---

## 3. Regra de ouro

Se o Dono precisa pensar, o ecrã falhou. Ele deve: abrir, ler, sentir, decidir. Sem raciocinar.

---

## 4. Regra de estado (código)

- **Vermelho:** existe pelo menos um alerta crítico (severity `critical`, status active/escalated). Motivo = título do primeiro alerta crítico.
- **Amarelo:** existe pelo menos um alerta ativo (não crítico). Motivo = título do primeiro alerta ativo.
- **Verde:** nenhum alerta ativo/crítico.

Dados: AlertEngine `getCritical` e `getActive` (Onda 5). Não cria nova arquitetura. Não depende de Supabase ligado.

---

## 5. Onde entra no sistema

- É o primeiro ecrã após login quando o papel é Dono (owner).
- Rota: mesmo `/dashboard` (ou `/app/dashboard`); o Dono vê primeiro o Ecrã Zero; ao clicar no botão, vê o dashboard completo (portal de sistemas).
- Vermelho + botão "Agir agora" → navega para `/app/alerts`.

---

## 6. Referências

- [DECISOES_CONSOLIDADAS_FASE_E79.md](../DECISOES_CONSOLIDADAS_FASE_E79.md) — Dono-first, modelo mental
- [GLOBAL_UI_STATE_MAP.md](GLOBAL_UI_STATE_MAP.md) — Mapa de estado da UI
