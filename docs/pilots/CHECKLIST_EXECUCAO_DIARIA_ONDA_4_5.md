# Checklist de execução diária — Onda 4 (Valor) e Onda 5

**Data:** 2026-02-01
**Refs:** [ONDA_4_VALOR_E_ONDA_5.md](./ONDA_4_VALOR_E_ONDA_5.md) · [ONDA_5_ESCOPO_CONGELADO.md](./ONDA_5_ESCOPO_CONGELADO.md) · [ONDA_5_TAREFAS.md](./ONDA_5_TAREFAS.md)

Checklist operacional para uso diário. Marca quando concluído. Escolhe **um** foco por semana (negócio ou infra).

---

## Estado validado (2026-02-01)

- Core manda; web documentada; operação separada; Onda 5 escopo congelado.
- Sem demo fake; sem perfis inventados.
- 404 em `get_operational_metrics` / `get_shift_history` → resolvidos aplicando migrations no Docker Core (ver § Infra local).

---

## Bloco 4 — Valor percebido

### 19. Welcome + 3 passos

**Copy aprovado (colar onde entra):**

> Bem-vindo ao ChefIApp.
> Em 3 passos estás a vender no teu restaurante:
>
> 1. Regista o restaurante
> 2. Cria o primeiro produto
> 3. Abre o TPV e faz a primeira venda
>
> Sem instalações complexas. Sem consultoria. Funciona hoje.

- [ ] Colocado no **primeiro ecrã pós-signup** OU no **email automático de boas-vindas** (escolher um).
- [ ] Item 19 marcado em [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md).

---

### 20. Pitch 1 página

**Headline aprovada:**

> Primeira venda em menos de 5 minutos.
> Sala, cozinha e caixa a falar a mesma língua.

**CTA:**

- "Testar 14 dias no meu restaurante"
- ou "Quero instalar no meu restaurante"

- [ ] Incluído numa **landing simples** ou **PDF**.
- [ ] Item 20 marcado no checklist geral.

---

### 21. Preço piloto

**Decisão Onda 4 / P1:**

- Piloto: **14 dias grátis**
- Depois: "Escolhe um plano para continuar sem interrupções"

**Frase única (usar sempre):**

> O piloto é gratuito durante 14 dias. Se fizer sentido, escolhes um plano depois. Se não, paras sem compromisso.

- [ ] Concordado e usado na abordagem.
- [ ] Item 21 marcado no checklist geral.

---

## Bloco 5 — Onda 5

### 22. Definir Onda 5

- [x] Escopo definido e alinhado com [ONDA_5_ESCOPO_CONGELADO.md](./ONDA_5_ESCOPO_CONGELADO.md).
- [ ] Item 22 marcado no checklist geral.

---

### 23. Congelar escopo

- [x] Documento [ONDA_5_ESCOPO_CONGELADO.md](./ONDA_5_ESCOPO_CONGELADO.md) existente e referenciado.
- [x] Stakeholders informados em 2026-02-01.
- [ ] Item 23 marcado no checklist geral.

---

### 24. Executar

- [ ] Kick-off Onda 5 marcado (quando aplicável).
- [ ] Tarefas em [ONDA_5_TAREFAS.md](./ONDA_5_TAREFAS.md) em execução.
- Item 24 fica em aberto por definição (execução contínua).

---

## Infra local (se usares Docker Core)

Se vires 404 no dashboard para métricas / histórico de turnos:

```bash
cd docker-core
make up
make migrate-cash-registers     # obrigatório antes
make migrate-operational-rpcs
```

Depois: recarregar o dashboard. Os 404 de `get_operational_metrics` e `get_shift_history` deixam de aparecer.

---

## Próximo passo único (escolher um por semana)

| Opção                         | Foco                                                           | Ação                                                                                           |
| ----------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **A — Negócio** (recomendado) | Contactar 2 restaurantes, instalar, ver dashboard com uso real | Abrir [ONDA_4_PILOTO_P1.md](./ONDA_4_PILOTO_P1.md) §7 (emails) e §9 (estado).                  |
| **B — Infra**                 | Supabase deploy, URL real, Stripe live                         | [FASE_5_SUPABASE_DEPLOY.md](../implementation/FASE_5_SUPABASE_DEPLOY.md) → FASE B em URL real. |

Fazer os dois ao mesmo tempo dilui foco.

---

## Seguinte (quando quiseres)

1. **Script de conversa com dono** (5 min, sem bullshit) → [SCRIPT_VENDA_PRESENCIAL_5_7_MIN.md](./SCRIPT_VENDA_PRESENCIAL_5_7_MIN.md) — secção "Script exato" com frases aprovadas (headline, preço piloto, CTA).
2. **Copy final da landing Onda 4** → [COPY_LANDING_ONDA_4_FINAL.md](./COPY_LANDING_ONDA_4_FINAL.md) — headline, 3 passos, preço piloto, CTA; colar na landing ou exportar para PDF.
3. **Teste Humano Supremo E2E** — prompt para o antigravity (entrada → restaurante → menu → billing → TPV → KDS → relatório): [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md).

---

_Atualizar este doc à medida que os itens forem concluídos e espelhar 19–24 no [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md)._
