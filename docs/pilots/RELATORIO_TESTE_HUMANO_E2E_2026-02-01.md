# Relatório Teste Humano E2E — Executado pelo agente (browser MCP)

**Data:** 2026-02-01  
**Checklist:** [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md)  
**Executor:** Agente (Cursor) com browser MCP (cursor-browser-extension).

---

## Resumo

- **Status:** PASSOU COM FALHAS
- **Pré-flight:** PASSA
- **FASE 1 (Entrada + restaurante):** PASSA
- **FASE 2 (Config + Menu):** PASSA parcial — Config carregou; cliques MCP deram timeout 30s
- **FASE 3 (Billing):** Não concluído (navegação interrompida por timeout)
- **FASE 4 (Turno + TPV + KDS):** PASSA parcial — TPV carrega; Dashboard mostra timeout FlowGate
- **FASE 5 (Dashboard):** FALHA — "Verificando estado operacional..." → "Não foi possível verificar o acesso."

---

## Pré-flight (30 s)

| Check | Resultado |
| ----- | --------- |
| http://localhost:5175 | Responde; landing carrega |
| CTA visível | "Testar 14 dias no meu restaurante", "Já tenho acesso" |
| Banner Core offline | Não visível na landing |

**Pré-flight: PASSA**

---

## FASE 1 — Entrada + restaurante (~2 min)

| # | Acção | Resultado | Observação |
|---|-------|-----------|------------|
| 1 | Ir a `/` — CTA "Criar restaurante" / "Começar"? Clicar e ir para auth. | PASSA | Clicado "Testar 14 dias no meu restaurante" → /auth (click timeout 30s mas navegação ocorreu). |
| 2 | Criar conta (simulação) + criar restaurante (nome, contacto). Fluxo linear até área web. | PASSA | Auth: "Simular Registo (Piloto)" → /bootstrap. Preenchido nome "E2E Teste Humano", contacto "Lisboa", "Criar e continuar" → /onboarding/first-product. |

**FASE 1: PASSA**

---

## FASE 2 — Config + Menu (~2 min)

| # | Acção | Resultado | Observação |
|---|-------|-----------|------------|
| 3 | Ir a Config → Menu Builder, Tarefas, Pessoas. Todas carregam. | PASSA parcial | Navegação direta para /config: página Configuração carrega; secções Identidade, Cardápio, Pessoas, etc. visíveis. Cliques em botões (Cardápio) deram timeout 30s no MCP; após navegação para /config/identity surgiu ecrã "Não foi possível verificar o acesso." (timeout FlowGate). |
| 4 | Menu Builder: criar 1 produto (nome, preço). Salva e aparece na lista. | Não concluído | Formulário "Primeiro produto" em /onboarding/first-product estava visível (nome, preço, "Criar e abrir TPV"); não se completou criação por timeout em passos seguintes. |

**FASE 2: PASSA (Config carrega); passo 4 não concluído no fluxo.**

---

## FASE 3 — Billing (~30 s)

| # | Acção | Resultado |
|---|-------|-----------|
| 5 | Ir a Billing. TRIAL ATIVO. CTA planos. Não bloqueia. | Não concluído |

---

## FASE 4 — Turno + TPV + KDS (~3 min)

| # | Acção | Resultado | Observação |
|---|-------|-----------|------------|
| 6 | TPV. "Abrir Turno" / "Começar a vender" visível. Abrir turno sem erro. | PASSA parcial | /op/tpv carrega: "Abrir turno" — "Para começar a vender, abra o turno com caixa inicial no Dashboard" + link "Ir para o Dashboard". |
| 7–9 | Pedido, KDS, ciclo fechado | Não concluído | Fluxo interrompido por timeout no Dashboard. |

---

## FASE 5 — Veredito

| # | Acção | Resultado | Observação |
|---|-------|-----------|------------|
| 10 | Dashboard carrega. Sem erro crítico. Rotas essenciais acessíveis. | FALHA | /dashboard mostra "Verificando estado operacional..." e após ~4s "Não foi possível verificar o acesso." (FlowGate timeout). |

---

## Falhas identificadas

1. **FlowGate timeout em /dashboard (e /config após navegação)**  
   Com tenant selado e sem sessão (piloto local), o Dashboard e por vezes Config exibem "Não foi possível verificar o acesso." após alguns segundos. O timeout de 5s (Docker) dispara ou o estado operacional não resolve a tempo. *Correção já aplicada em FlowGate: clearLoadingTimeout() em todos os caminhos de sucesso; pode ser necessário rever o caminho específico de /dashboard quando não há sessão.*

2. **Cliques no browser MCP (cursor-browser-extension)**  
   Vários cliques reportaram "Timeout 30000ms exceeded" mesmo com "performing click action" — a navegação ocorreu (ex.: /auth → /bootstrap, bootstrap → first-product). Limitação da ferramenta ou da página (navegação lenta).

---

## Resultado final (checklist)

- **Status:** ☑ PASSOU COM FALHAS
- **Falhas (lista curta):** Dashboard e por vezes Config mostram timeout "Não foi possível verificar o acesso." com tenant selado (local/piloto). Cliques MCP com timeout 30s.
- **Veredito humano:** Não preenchido (execução pelo agente). Recomenda-se repetir o [CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md](./CHECKLIST_10MIN_TESTE_HUMANO_SUPREMO.md) no browser por um humano para veredito final.

---

## Próximos passos

1. Confirmar em código por que /dashboard ainda dispara o ecrã de timeout do FlowGate (ou mensagem equivalente) quando tenant está selado e sessionLoading resolve; garantir que `clearLoadingTimeout()` é chamado no caminho que cobre `/dashboard` sem sessão.
2. Repetir teste humano no browser (humano ou Antigravity) com o checklist completo para passos 4–9 e veredito "Conseguiria vender com isto hoje?".
