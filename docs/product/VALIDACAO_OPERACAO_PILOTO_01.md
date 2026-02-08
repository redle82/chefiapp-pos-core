# Validação operacional — Piloto 01 (1 restaurante real)

**Objetivo:** Provar valor em uso, não em teoria. Sair com sinais claros: funciona / dói / trava.  
**Contexto:** 1 restaurante piloto, dono disponível 30–60 min, situação simples (1 caixa, 1 cozinha).  
**Regra:** Registo estruturado apenas; não refatorar soberania.

---

## Estado das contenções (48h fluxo feliz)

Antes do piloto, o fluxo técnico está coberto por contenção documentada:

| Bloco | Doc | Estado |
|-------|-----|--------|
| B1 — Cardápio | `B1_MENU_CONTENCAO.md` | ✅ Fallback localStorage quando Core falha; mensagens neutras. |
| B2 — TPV | `B2_TPV_CONTENCAO.md` | ✅ ErrorBoundary em `/op/tpv`; fallback produtos; mensagens neutras. |
| B4 — KDS | `B4_KDS_CONTENCAO.md` | ✅ ErrorBoundary em `/op/kds`; fallback pedidos em rede; "Modo Piloto". |

**Verificação técnica antes do piloto:** usar `docs/product/FLUXO_FELIZ_CHECKLIST.md` (~10–15 min).

---

## Guião do piloto (fluxo completo, sem atalhos)

1. **Signup real** — Novo utilizador, email e palavra-passe.
2. **Criação do restaurante (bootstrap)** — Primeiro restaurante; concluir bootstrap.
3. **Configuração mínima** — Produtos básicos (ex.: 3–5 itens) para conseguir fazer um pedido.
4. **Publicar** — Marcar restaurante como publicado (isPublished).
5. **Operar** — Abrir TPV → criar pedido → ver pedido no KDS.

---

## Registo por etapa

Preencher durante ou logo após a sessão. Uma linha por etapa; anotar só o que aconteceu.

### 1. Signup

| Campo | Notas |
|-------|--------|
| ⏱️ Tempo | _min |
| ❓ Dúvida do utilizador | |
| ❌ Erro ou bloqueio | |
| 😮 "Ah, isto é bom" | |

---

### 2. Bootstrap (criar restaurante)

| Campo | Notas |
|-------|--------|
| ⏱️ Tempo | _min |
| ❓ Dúvida do utilizador | |
| ❌ Erro ou bloqueio | |
| 😮 "Ah, isto é bom" | |

---

### 3. Configuração mínima (produtos)

| Campo | Notas |
|-------|--------|
| ⏱️ Tempo | _min |
| ❓ Dúvida do utilizador | |
| ❌ Erro ou bloqueio | |
| 😮 "Ah, isto é bom" | |

---

### 4. Publicar

| Campo | Notas |
|-------|--------|
| ⏱️ Tempo | _min |
| ❓ Dúvida do utilizador | |
| ❌ Erro ou bloqueio | |
| 😮 "Ah, isto é bom" | |

---

### 5. TPV → pedido → KDS

| Campo | Notas |
|-------|--------|
| ⏱️ Tempo | _min |
| ❓ Dúvida do utilizador | |
| ❌ Erro ou bloqueio | |
| 😮 "Ah, isto é bom" | |

---

## O que observar (lupa)

- Onde o utilizador **para** sem saber o próximo passo.
- Onde **demora mais** do que devia.
- Onde **confia** (“ok, isto parece profissional”).
- Onde pergunta **“e agora?”**.

---

## Saída esperada (preencher após o piloto)

**Fricções reais (lista curta):**
- 
- 

**Vitórias de valor (1–3):**
- 
- 

**Decisão informada (escolher uma ou mais):**
- [ ] UX do TPV primeiro
- [ ] Onboarding mais guiado
- [ ] Configuração inicial demasiado pesada?
- [ ] Outro: _______________

---

## Notas livres

_(Qualquer observação que não caiba nos campos acima.)_
