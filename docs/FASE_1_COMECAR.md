# Fase 1 — Começar (Teste Humano E2E)

**Objetivo:** Executar o teste humano obrigatório até ao critério **"Agora vejo."**  
**Ref:** [PLANO_FINAL_PRIMEIRO_E79.md](PLANO_FINAL_PRIMEIRO_E79.md) Fase 1 · [VALIDACAO_TESTE_HUMANO_E2E.md](VALIDACAO_TESTE_HUMANO_E2E.md)

---

## ✅ Resultado — Fase 1 fechada

**Critério de fecho cumprido:** *"Agora vejo."* (2026-02-22)

Próximo passo: **Fase 2** — [FASE_2_PAGAMENTOS.md](FASE_2_PAGAMENTOS.md) (Stripe + SumUp Europa + PIX Brasil).

---

## 1. Preparar o ambiente

Num terminal, na raiz do repo:

```bash
pnpm --filter merchant-portal run dev
```

Aguardar até ver algo como `Local: http://localhost:5175/`.  
(Ou usar a porta indicada se tiveres `PORT` definido.)

---

## 2. Executar o teste (na ordem)

Abre no browser: **http://localhost:5175/**

**Nota:** A landing pode ser `/` (OfficialLandingPage) ou, se o TPV trial estiver noutra entrada, **/app/trial-tpv**. Os CTAs "Explorar primeiro" e "Começar agora" devem levar ao trial e a `/auth` respetivamente.

| # | Ação | Confirmar |
|---|------|-----------|
| 1 | Abrir `/` | TPV trial visível, overlay, preço 79 €/mês, botões "Começar agora" e "Explorar primeiro", barra "Modo Trial" |
| 2 | Clicar **"Explorar primeiro"** | Overlay desaparece; TPV utilizável; criar 1 pedido trial; barra "Modo Trial" visível |
| 3 | Clicar **"Começar agora"** | Navega para `/auth`; sem crash nem ecrã branco |
| 4 | Em `/auth` | Página de login/signup renderiza; sem erro de useContext |
| 5 | (Opcional) Criar conta | Bootstrap → 1 produto → TPV → 1 pedido → `/app/billing`; preço visível, "Ativar agora" ativo |
| 6 | Nova aba anónima | Repetir passos 1 → 3; trial e CTAs funcionam igual |

---

## 3. Critério de fecho

Quando tudo estiver conforme o esperado, escrever literalmente (num comentário, commit ou doc):

> **"Agora vejo."**

Só depois avançar para **Fase 2** ([VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md)).

---

## 4. Se falhar

Anotar: URL, botão clicado, o que apareceu vs o esperado.  
Depois corrigir copy, CTA ou gating — não alterar arquitetura sem prova.

---

**Checklist completo:** [VALIDACAO_TESTE_HUMANO_E2E.md](VALIDACAO_TESTE_HUMANO_E2E.md)
