# Checklist P0 / P1 / P2 — Teste Humano real

**Roteiro do teste humano e referência do checklist.** Use este documento na execução do teste humano (abrir app, fingir dono, marcar Ok/Confuso/Bloqueia).

**Objetivo:** Transformar o sistema que já está correto num sistema impossível de usar errado.

- Nada de ideias novas.
- Nada de refactors grandes.
- Só fricção real → prioridade clara → correção cirúrgica.

**Referências:** [BACKLOG_72H_POS_TESTE_HUMANO.md](./BACKLOG_72H_POS_TESTE_HUMANO.md) · [ONDA_5_ESCOPO_CONGELADO.md](./ONDA_5_ESCOPO_CONGELADO.md)

---

## Premissa (importante)

Este checklist assume que:

- **ORE está correto** ✅
- **Bootstrap está correto** ✅
- **DEV Mode morreu** ✅

Logo, **qualquer problema agora é humano, não técnico.**

---

## 🔴 P0 — Bloqueadores absolutos

Se 1 item destes falhar, o dono perde confiança. **Tem de corrigir antes de qualquer piloto.**

### P0.1 — "Posso vender agora?" não pode gerar dúvida

- Em qualquer ecrã principal, o estado tem de ser **óbvio em ≤ 3 segundos**
- Sem ler documentação
- Sem interpretar cores ambíguas

**✔️ Critério de sucesso:** Um dono consegue responder _sim_ / _não_ sem clicar em nada.

---

### P0.2 — Se não pode vender, o sistema diz exatamente porquê

- **Uma única causa principal** (sem listas confusas)
- Linguagem humana:
  - ❌ "Estado operacional inválido"
  - ✅ "O turno ainda não está aberto"

**✔️ Critério:** A frase começa sempre com algo que o dono pode fazer _agora_.

---

### P0.3 — Toda ação bloqueada tem saída imediata

Exemplos:

- Caixa fechada → botão **Abrir turno**
- Restaurante não publicado → **Ir para ativação**
- Módulo não ativo → **Ver módulos**

- ❌ Nunca mostrar erro sem ação
- ❌ Nunca mandar "falar com suporte" como primeira opção

---

### P0.4 — Nada "carrega para sempre"

- Loading > 3–5 s → **mensagem clara**
- Sem spinner infinito
- Sem silêncio

**✔️ Critério:** Mesmo com backend em baixo, o utilizador sabe o que está a acontecer.

---

## 🟡 P1 — Fricções humanas

Não quebram o produto, mas desgastam confiança.

### P1.1 — Copy ainda demasiado "interna"

Exemplos a caçar:

| Evitar       | Preferir            |
| ------------ | ------------------- |
| Configuração | Preparar            |
| Estado       | Pronto / Não pronto |
| Módulo       | Funcionalidade      |
| Ativação     | Começar a usar      |

---

### P1.2 — O sidebar ainda parece "organizador", não reflexo

- O dono pode achar que clicar ali resolve algo
- Na verdade só reflete decisões do ORE

**Ajuste típico:**

- Ícones com estados mais explícitos
- Menos navegação "exploratória"
- Mais leitura rápida

---

### P1.3 — A primeira venda ainda parece "processo"

**Ideal:**

- Parece um **ritual curto**, não onboarding
- 1–2 decisões, não 6

---

## 🟢 P2 — Polimento (depois do piloto)

Só mexer nisto **depois de uso real**.

- Microanimações de confirmação
- Feedback emocional ("Pronto para vender 🍽️")
- Ajustes visuais de hierarquia
- Otimização de atalhos

---

## Como usar este checklist (na prática)

1. Abre a app em localhost
2. Fecha o editor
3. Finge que és **dono**, não dev
4. Passa ecrã por ecrã
5. Marca cada item como:
   - **✅ Ok**
   - **⚠️ Confuso**
   - **❌ Bloqueia**

**👉 Tudo ❌ vira tarefa imediata**
**👉 Tudo ⚠️ entra no backlog do piloto**

---

## Resultado da auditoria (Dashboard — 2025-02-01)

| Item | Dashboard  | Notas                                                                                                                                     |
| ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P0.1 | ✅ Ok      | Estado visível: banner "O turno ainda não está aberto", card Estado do sistema, EcraZero (verde/amarelo/vermelho).                        |
| P0.2 | ✅ Ok      | Uma causa humana: "O turno ainda não está aberto. Abra o turno no TPV para poder vender." BlockingScreen alinhado.                        |
| P0.3 | ✅ Ok      | Caixa fechada → botão **Abrir turno** leva a `/op/tpv` (ShiftGate/ShiftOpenForm). BlockingScreen SHIFT\_\* → "Abrir turno" → `/op/tpv`.   |
| P0.4 | ✅ Ok      | GlobalLoadingView com `longDelay`/`longMessage`; Dashboard usa 5s → "A demorar mais do que o habitual. A verificar ligação...".           |
| P1.1 | ✅ Parcial | Card: "Estado do sistema" → "Pronto para vender?"; "Checklist de Configuração" → "Preparar restaurante". Resto (Módulo, etc.) em backlog. |
| P1.2 | ⚠️ Backlog | Sidebar "Em uso hoje" / "Pronto para ativar" / "Em evolução" — ícones com estados mais explícitos em backlog.                             |
| P1.3 | ⚠️ Backlog | "Primeira venda em poucos passos" (6 passos) — reduzir a 1–2 decisões em backlog.                                                         |

**Correções P0 aplicadas:**

1. **DashboardPortal.tsx** — Banner caixa fechada: texto único "O turno ainda não está aberto. Abra o turno no TPV para poder vender."; botão "Abrir turno" → `navigate("/op/tpv")` (em vez de `/dashboard`).
2. **BlockingScreen.tsx** — NO_OPEN_CASH_REGISTER e SHIFT_NOT_STARTED: título "O turno ainda não está aberto", descrição "Abra o turno no TPV...", ação "Abrir turno" → `/op/tpv`.
3. **GlobalLoadingView.tsx** — Props opcionais `longDelay` e `longMessage`; após longDelay ms mostra longMessage (evita loading infinito sem explicação).
4. **DashboardPortal.tsx** — Loading de readiness: `longDelay={5000}`, `longMessage="A demorar mais do que o habitual. A verificar ligação..."`.

**PILOT-BLOCKER (Bootstrap members):**

5. **BootstrapPage.tsx** — Guard antes de INSERT em `gm_restaurant_members`: quando backend é Docker, não tenta escrita (Core pode não ter tabela). `canWriteMembers = getBackendType() !== BackendType.docker`; se `!canWriteMembers`, Logger.info e skip — sem 404, sem mock, sem warning. Para piloto real (Docker com tabela provisionada): adicionar depois `runtime.canWriteMembers` ou probe.

---

## Auditoria ao Dashboard (execução do plano — 2026-02-03)

Aplicado o checklist ao ecrã principal do dono (Dashboard). Resultado:

| Item | Resultado  | Notas                                                                                                                             |
| ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| P0.1 | ✅ Ok      | "Posso vender?" visível em ≤3s: card "Pronto para vender?", banner turno fechado, EcraZero (verde/amarelo/vermelho).              |
| P0.2 | ✅ Ok      | Uma causa humana: "O turno ainda não está aberto. Abra o turno no TPV para poder vender."; BlockingScreen com copy alinhada.      |
| P0.3 | ✅ Ok      | Caixa fechada → botão "Abrir turno" → `/op/tpv`. BlockingScreen com ação "Abrir turno" → `/op/tpv`.                               |
| P0.4 | ✅ Ok      | GlobalLoadingView com `longDelay={5000}` e `longMessage="A demorar mais do que o habitual. A verificar ligação..."`.              |
| P1.1 | ⚠️ Backlog | Card "Pronto para vender?" e "Preparar restaurante" já alinhados. Resto (sidebar "Estado do sistema", "Módulo", etc.) em backlog. |
| P1.2 | ⚠️ Backlog | Sidebar "Em uso hoje" / "Pronto para ativar" / "Em evolução" — ícones/estados mais explícitos em backlog.                         |

**Conclusão:** Dashboard conforme P0. Nenhuma alteração P0 necessária. P1.1 e P1.2 ficam em backlog.

**Lista concreta de alterações P0:** Nenhuma (todos os itens P0.1–P0.4 avaliados como Ok no código atual).
