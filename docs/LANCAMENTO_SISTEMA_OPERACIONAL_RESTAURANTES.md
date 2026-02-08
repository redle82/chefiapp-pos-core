# Lançamento: Sistema Operacional para Restaurantes

**Data:** 2026-01-29
**Objetivo:** O que falta para lançar o produto como **sistema operacional para restaurantes** que instala o TPV, tem app staff, KDS e aparece como **um ícone no desktop**.

---

## 1. Visão do produto

- **O que é:** Um sistema operacional para restaurantes.
- **O que o dono vê:** Um ícone no desktop (ou no telemóvel) que abre o “ChefIApp”.
- **O que está dentro:** TPV (vendas/caixa), App Staff (garçom/salão), KDS (cozinha), Cardápio, Configuração, etc. — tudo no mesmo sistema, ativado por módulos.

**Já temos feito:** Dashboard modo venda, Landing, Demo, TPV mínimo, KDS mínimo, AppStaff mínimo, PWA (manifest + standalone), Billing webhook → live, Config (identidade, localização, horários) em modo Docker, narrativa “sistema operacional”.

---

## 2. O que já está pronto (resumo)

| Área                 | Estado | Notas                                                                   |
| -------------------- | ------ | ----------------------------------------------------------------------- |
| **Landing**          | ✅     | Ponto de entrada comercial em `/`                                       |
| **Demo**             | ✅     | Tour em `/demo` — “Ver como funciona”                                   |
| **Dashboard**        | ✅     | Modo venda, módulos TPV / KDS / AppStaff / Cardápio visíveis            |
| **TPV**              | ✅     | TPVMinimal em `/tpv`, ModeGate (demo/piloto/live), dockerCoreClient     |
| **KDS**              | ✅     | KDSMinimal em `/kds-minimal`, mesmo padrão                              |
| **App Staff**        | ✅     | AppStaffMinimal em `/garcom` (staff/garçom)                             |
| **Cardápio**         | ✅     | MenuBuilderMinimal em `/menu-builder`                                   |
| **Config**           | ✅     | Identidade, Localização, Horários com dockerCoreClient em Docker        |
| **PWA / “Um ícone”** | ✅     | manifest.json, display standalone, ícones 48–512; install prompt em TPV |
| **Billing**          | ✅     | Webhook Stripe → `product_mode = live` no Core                          |
| **Modos**            | ✅     | demo / piloto / live; aviso “Modo piloto” no TPV                        |
| **Backend Docker**   | ✅     | Config e onboarding usam dockerCoreClient em modo Docker                |

Ou seja: o **núcleo** (TPV + Staff + KDS + um ícone no desktop via PWA) já existe. O que falta é **embalar para lançamento** e **primeira experiência fluida**.

---

## 3. O que falta para lançamento (checklist)

### 3.1 Experiência “um ícone no desktop”

| #   | Tarefa                                                                                                                                                                                                                                                                          | Prioridade | Esforço   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| 1   | **Promover “Instalar app” no primeiro uso** — Após login ou após ativar TPV/KDS, mostrar um CTA claro “Adicionar ao ecrã” / “Instalar ChefIApp” (reaproveitar `beforeinstallprompt` já usado no TPV) a partir do Dashboard ou da primeira vez que entra em `/tpv` ou `/garcom`. | Alta       | 0.5–1 dia |
| 2   | **Nome e ícone consistentes** — Garantir que o manifest e o nome na instalação digam “ChefIApp” (ou “ChefIApp — Sistema Operacional”) e que o ícone seja reconhecível no desktop/ecrã inicial.                                                                                  | Média      | 0.5 dia   |
| 3   | **start_url inteligente** — `start_url: "/"` está ok; opcional: após instalação a partir de `/tpv`, guardar preferência para abrir direto no TPV (localStorage + redirect).                                                                                                     | Baixa      | 0.5 dia   |

### 3.2 Onboarding (primeira vez no sistema)

| #   | Tarefa                                                                                                                                                                                                                                             | Prioridade | Esforço     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| 4   | **Fluxo “primeira venda em &lt;10 min”** — Guia linear: Identidade → Localização → Horários → Cardápio (mínimo) → “Abrir TPV” / “Fazer primeira venda”. Documentado em FASE 2; implementar passos em sequência (wizard ou checklist no Dashboard). | Alta       | 1–2 semanas |
| 5   | **Menu de exemplo ou demo** — Opção “Usar menu de exemplo” no onboarding para restaurante conseguir fazer primeira venda sem criar produtos à mão.                                                                                                 | Alta       | 2–3 dias    |
| 6   | **Config acessível** — Já existe `/config` (identidade, localização, horários). Garantir que “Configuração” no Dashboard leve para `/config` e que o copy diga “Configurar restaurante” (não só “Config”).                                         | Média      | 0.5 dia     |

### 3.3 Produto “fechado” para o cliente

| #   | Tarefa                                                                                                                                                                                                                          | Prioridade | Esforço   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- |
| 7   | **Remover / esconder modo “demo” em produção** — Em build de produção, não mostrar ModeIndicator nem permitir trocar para demo; ou mostrar só “Demo” como link separado (ex.: “Ver demo” na Landing), não dentro do app logado. | Alta       | 0.5–1 dia |
| 8   | **Mensagem clara quando módulo não está ativo** — Já existe “Disponível para ativação”. Reforçar: “Ative TPV / KDS / App Staff no Dashboard” com botão que leva ao Dashboard ou ao passo de ativação.                           | Média      | 0.5 dia   |
| 9   | **Polimento de erros** — Mensagens de erro em português; evitar stack traces ou “Supabase forbidden” na UI (já mitigado com dockerCoreClient; validar em todas as telas de Config e onboarding).                                | Média      | 1 dia     |

### 3.4 Distribuição e operação

| #   | Tarefa                                                                                                                                                                | Prioridade | Esforço                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------- |
| 10  | **Domínio e HTTPS** — Para PWA “Instalar” funcionar bem, app em HTTPS e, se possível, domínio próprio (ex.: app.chefiapp.com).                                        | Alta       | Depende do host         |
| 11  | **Deploy contínuo** — Build (Vite) + backend (Core) deployados de forma estável (CI/CD ou script) para que “um ícone no desktop” aponte sempre para a versão correta. | Alta       | Já em parte; formalizar |
| 12  | **Billing na UI (opcional)** — Já existe webhook. Opcional: após checkout Stripe, redirect para “Assinatura ativa — modo live ativado” no merchant-portal.            | Baixa      | 1 dia                   |

---

## 4. Ordem sugerida para lançamento

**Fase A — “Um ícone no desktop” (≈1 semana)**

- Itens 1, 2, 10 (promover instalação, nome/ícone, HTTPS).
- Objetivo: restaurante instala o ChefIApp como app e abre TPV / Staff / KDS a partir do mesmo ícone.

**Fase B — Primeira venda rápida (≈1–2 semanas)**

- Itens 4, 5, 6 (onboarding &lt;10 min, menu exemplo, Config clara).
- Objetivo: novo restaurante faz primeira venda em menos de 10 minutos.

**Fase C — Produto fechado (≈2–3 dias)**

- Itens 7, 8, 9 (demo só onde fizer sentido, mensagens de ativação, erros em PT).
- Objetivo: experiência “produto acabado”, sem vazamento de modo técnico.

**Fase D — Operação (contínuo)**

- Itens 11, 12 (deploy estável, opcional billing na UI).

---

## 5. Critério de “lançado como sistema operacional”

- Restaurante **instala** o ChefIApp (um ícone no desktop/telemóvel).
- Restaurante **ativa** TPV, KDS e App Staff a partir do Dashboard.
- Restaurante **faz primeira venda** em tempo curto (meta: &lt;10 min com menu exemplo).
- Restaurante **usa** TPV + Staff + KDS no dia a dia como um único sistema.
- **Sem** necessidade de explicar “modo demo” ou “backend Docker” ao cliente.

---

## 6. Referências

- [ONDE_ESTAMOS_AGORA.md](ONDE_ESTAMOS_AGORA.md) — Estado atual e próximos passos.
- [DASHBOARD_MODO_VENDA.md](DASHBOARD_MODO_VENDA.md) — Dashboard modo venda.
- [MODO_DEMO_EXPLICATIVO_SPEC.md](MODO_DEMO_EXPLICATIVO_SPEC.md) — Demo e “como tudo se conecta”.
- [FASE_FECHADA_NEXT.md](FASE_FECHADA_NEXT.md) — Fase fechada + billing + piloto.
- [ANALISE_ROADMAP.md](ANALISE_ROADMAP.md) — Roadmap executável e fases.
