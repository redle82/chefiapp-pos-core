# Onda 4 — POS Ultra-Rápido (Touch Light Speed)

**Data:** Fev 2026  
**Referência:** [ONDAS_4_A_7_ESTRATEGIA.md](./ONDAS_4_A_7_ESTRATEGIA.md)  
**Duração:** 30–45 dias

---

## Objetivo

Velocidade absurda + zero fricção + dinheiro rápido.

Entregáveis claros:
- Produto vendável
- Receita
- Feedback real
- Prova de mercado

---

## Princípios

- Uma coisa extremamente bem feita.
- Menos features, mais velocidade.
- Nada que atrase o primeiro pagamento.

---

## Passo a passo (alto nível)

1. **Fluxo único de venda**
   - Abrir mesa
   - Adicionar itens
   - Fechar conta

2. **UI brutalmente rápida**
   - Zero modais desnecessários
   - Gestos e atalhos
   - Tudo a 1–2 toques

3. **Sem IA, sem analytics avançado**
   - Apenas o essencial para vender

4. **Onboarding em 5 minutos**
   - Abrir app
   - Criar restaurante
   - Vender

5. **Primeiros clientes reais**
   - Uso em ambiente real
   - Feedback direto

---

## Output esperado

- POS funcional e rápido
- Primeiros clientes pagantes
- Base validada para expansão

---

## Escopo fechado (feature por feature)

Escopo mínimo para “Touch light speed POS” em 30–45 dias. Tudo o que está fora desta lista fica para Ondas 5–7.

### A. Onboarding (5 minutos)

| ID | Feature | Critério de done |
|----|---------|------------------|
| A1 | Registo / login (email + senha) | Utilizador entra na app em &lt; 1 min. |
| A2 | Criar restaurante (nome, contacto) | Restaurante criado; owner associado. |
| A3 | Primeiro produto (nome, preço) | Pelo menos 1 item no menu; visível no TPV. |
| A4 | (Opcional) Mesa única “Balcão” | Se não houver mesas, venda = balcão. |

### B. Fluxo de venda (1–2 toques)

| ID | Feature | Critério de done |
|----|---------|------------------|
| B1 | Selecionar “mesa” ou balcão | Uma escolha; sem configuração. |
| B2 | Ver lista de produtos (categorias mínimas) | Produtos carregam rápido; toque = adiciona 1 unidade. |
| B3 | Adicionar item ao pedido atual | 1 toque = +1; sem modal; atualização imediata. |
| B4 | Ver pedido atual (resumo + total) | Sempre visível; total correto. |
| B5 | Fechar conta (abrir fluxo de pagamento) | 1 ação; escolha de método (dinheiro / cartão / outro). |
| B6 | Registar pagamento e fechar | Pedido marcado pago; mesa/balcão livre. |

### C. UI / velocidade

| ID | Feature | Critério de done |
|----|---------|------------------|
| C1 | Zero modais no fluxo de venda | Nada bloqueia “produto → conta → pago”. |
| C2 | Atalhos (ex.: +1 quantidade sem abrir ecrã) | Aumentar/diminuir quantidade em 1–2 toques. |
| C3 | Feedback táctil ou visual imediato | Cada toque tem resposta &lt; 200 ms. |

### D. Dados e persistência (já existente na Onda 3)

| ID | Feature | Critério de done |
|----|---------|------------------|
| D1 | Pedidos e pagamentos em base de dados | create_order_atomic, process_order_payment (já existem). |
| D2 | Métricas do dia (receita, nº pedidos) | get_operational_metrics (já existe); mostrar no dashboard ou resumo. |

### E. Fora de escopo (Onda 4)

- Divisão de conta por pessoa (Onda 5+).
- KDS completo / cozinha (manter mínimo: “pedido enviado”; detalhe em Onda 5).
- Múltiplas mesas com mapa (aceitar lista simples ou 1 mesa “Balcão”).
- IA, analytics avançado, relatórios complexos (Onda 6–7).
- Multi-loja, permissões avançadas (Onda 7).

### Critério de fecho da Onda 4

- Um operador consegue: abrir app → criar restaurante + 1 produto → fazer 1 venda (mesa/balcão → itens → pagamento) em &lt; 5 min.
- Um turno real (2–5 h) pode ser operado sem improvisar: vender, fechar contas, ver total do dia.
- Primeiros 2–5 clientes reais usam o fluxo; feedback recolhido.

---

## Referências
- [ONDAS_4_A_7_ESTRATEGIA.md](./ONDAS_4_A_7_ESTRATEGIA.md)
- [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md)
- Componentes existentes de TPV / Menu / KDS
