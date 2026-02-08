# Decisões Consolidadas — Fase €79

**Data:** 2026-02-01  
**Contexto:** Produto validado tecnicamente e humanamente até ao ponto de venda inicial (€79). Este documento regista decisões conscientes para evitar ruído, refatorações prematuras e falsas lacunas.

---

## 1. Papéis no Core (Decisão Ativa)

**Regra:** O Core é Dono-first.

- **Dono:** único papel relevante nesta fase.
  - Criação de conta
  - Configuração do restaurante
  - Uso do dashboard
  - Ativação de billing
- **Gerente / Staff:**
  - Existência atual = debug / simulação / futuro
  - Não fazem parte do fluxo real de valor nesta fase
  - O modelo correto para estes papéis é um produto separado: **App Staff**

**Decisão:** não expandir lógica, permissões ou UX para Gerente/Staff no Core agora.

---

## 2. Presença Digital (Deliberadamente Fora)

- Presença digital não entrou nas ondas atuais (1–5).
- Não é fundação técnica.
- Não bloqueia venda do Core.

**Posicionamento correto:**

- Presença digital é **módulo de valor**, não infraestrutura.
- Entra em **Onda 6 ou 7**, após:
  - Core validado em uso real
  - App Staff definido
  - Narrativa comercial estabilizada

**Decisão:** adiada conscientemente, não esquecida.

---

## 3. Infraestrutura — O que Entrou vs. O que Ficou de Fora

**Entrou (essencial)**

- Frontend funcional
- Arquitetura de providers correta
- Modo demo / piloto honesto
- Stripe preparado (sem live antes do dinheiro)
- Vercel / build / SPA routing

**Ficou de fora (intencional)**

- Supabase (antes do €79)
- Google Auth
- Webhooks completos
- Observabilidade pesada
- Escala / multi-tenant avançado

**Regra:** infra sobe quando o dinheiro exige, não para "ficar bonito".

---

## 4. Três Adiamentos Explícitos

Nada disto é bug ou esquecimento — são adiamentos estratégicos:

**(A) Modelo mental / copy**

- Linguagem ainda técnica
- UX funcional > narrativa perfeita

**(B) Narrativa comercial**

- Pitch ainda implícito
- História completa entra após 2–3 clientes reais

**(C) App Staff**

- Produto separado
- Público diferente
- Roadmap próprio

**Decisão:** estes três itens entram depois do primeiro dinheiro real, não antes.

---

## 5. Regra de Ouro (Não Negociável)

> Se não bloqueia entendimento humano nem recebimento de €79, não entra agora.

---

## 6. Ligação ao Plano Ativo

- **Plano executável:** [PLANO_FINAL_PRIMEIRO_E79.md](PLANO_FINAL_PRIMEIRO_E79.md)
- **Estado do sistema:** [ESTADO_CONSOLIDADO_SISTEMA.md](ESTADO_CONSOLIDADO_SISTEMA.md)
- **Regra Supabase:** [SUPABASE_QUANDO_ATIVAR.md](SUPABASE_QUANDO_ATIVAR.md)
- **Regra Google Auth:** [AUTH_GOOGLE_QUANDO_ENTRAR.md](AUTH_GOOGLE_QUANDO_ENTRAR.md)

Este documento existe para evitar regressões mentais, não para criar trabalho.

---

**Status:** Registado, fechado e alinhado com o plano €79.
