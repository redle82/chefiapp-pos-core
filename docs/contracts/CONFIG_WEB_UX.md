# CONFIG_WEB_UX — Web de Configuração (UX e Fluxo)

**Objetivo:** Definir a estrutura oficial da web de configuração para modo CONFIG_PREVIEW e para produção: árvore de navegação, fluxo primeiro-uso vs config persistente, e resolução de duplicações.

---

## 1. Modo CONFIG_PREVIEW

Modo em que o produto pode fluir sem travar em auth nem RLS:

- **Auth real:** desligada (ou bypass para desenvolvimento).
- **RLS / multi-tenant:** desligado.
- **Dados:** single-restaurant fake (ex.: `DEV_RESTAURANT` ou runtime de desenvolvimento).
- **Foco:** UI, web de configuração, design system, landing, fluxo comercial.

A web de configuração é a principal superfície de construção: o dono (ou o desenvolvedor, em preview) navega pela sidebar e preenche identidade, local, horários, cardápio, pessoas, pagamentos, publicação, etc. Nada disso depende de auth real nem de isolamento multi-tenant para ser desenhado e testado.

---

## 2. Dois eixos

### 2.1 Fluxo primeiro-uso (setup)

Sequência ordenada para restaurante novo. Usado por readiness e redireção quando `systemState === "SETUP"`:

| Ordem | Passo        | Rota           | Grupo (SETUP_STEPS) |
|-------|--------------|----------------|----------------------|
| 1     | Nome & identidade | `/config/identity` | BASICS  |
| 2     | Local & endereço  | `/config/location` | BASICS  |
| 3     | Serviços & horários | `/config/schedule` | SERVICES |
| 4     | Cardápio     | `/menu-builder`    | MENU     |
| 5     | Publicação   | `/app/publish`     | PUBLISHING |

Definido em: `merchant-portal/src/core/setup/restaurantSetupSteps.ts` (`SETUP_STEPS`). Cada passo faz deep-link para uma rota da config (ou menu-builder / publish). Barra de progresso ou stepper usa estes passos.

### 2.2 Config persistente (árvore)

Após o setup (ou em CONFIG_PREVIEW com dados fake), o dono navega pela sidebar. A árvore é a fonte de verdade para “onde configurar o quê”. Definida em: `merchant-portal/src/components/config/ConfigSidebar.tsx` (`SECTIONS`).

---

## 3. Árvore oficial (grupos e secções)

Grupos recomendados para a sidebar (ordem lógica):

| Grupo       | Secções (rotas) |
|------------|------------------|
| **Basics** | Geral (`/config/general`), Ubicaciones (`/config/ubicaciones`), Identidade (`/config/identity`), Localização (`/config/location`) |
| **Operação** | Tempo (`/config/schedule`), Cardápio (`/menu-builder`), Estoque (`/inventory-stock`), Pessoas (`/config/people`) |
| **Comercial** | Pagamentos (`/config/payments`), Faturação (`/app/billing`) |
| **Publicação** | Publicar restaurante (`/app/publish`), Instalar TPV/KDS (`/app/install`) |
| **Avançado** | Integrações (`/config/integrations`), Módulos (`/config/modules`), Percepção (`/config/perception`), Estado (`/config/status`) |

Item “Entender o sistema” (`/auth`): link para login/registo; pode ficar fora da árvore de config (ex.: header/footer) ou mantido como último item com papel documentado.

---

## 4. Resolução de duplicações

### 4.1 Geral vs Identidade

- **Geral** (`/config/general`): página de resumo / overview; atalhos para identidade, local, idioma, recibo, integrações. Ponto de entrada “rápido” da config.
- **Identidade** (`/config/identity`): nome do restaurante, tipo, país — dados canónicos de identidade usados no setup (SETUP_STEPS).

Decisão: manter ambos com papéis distintos (C). Não fundir; evitar remover “Geral” para não quebrar entrada default `/config` → `/config/general`.

### 4.2 Localização vs Ubicaciones

- **Localização** (`/config/location`): endereço, mesas e zonas do **restaurante único** (modelo atual). Subrotas: endereço, mesas & zonas.
- **Ubicaciones** (`/config/ubicaciones`): **múltiplos locais** operacionais (filiais, pontos de venda). Lista de ubicaciones, criar/editar.

Decisão: manter ambos. Localização = contexto single-restaurant; Ubicaciones = evolução multi-local quando o produto suportar. Documentado aqui para não confundir.

### 4.3 “Entender o sistema” → `/auth`

Link para login/registo. Pode ser movido para header ou footer noutra iteração; por agora permanece na sidebar como último item. **Resolução adoptada:** documentação apenas; não foi feita unificação de rotas nem remoção de secções (Geral/Identidade e Localização/Ubicaciones mantêm-se com papéis distintos na árvore). Com papel explícito: “acesso à autenticação / entender o sistema”.

---

## 5. Momento de ativação

Quando for hora de receber clientes reais:

- Ligar auth (ex.: `ENABLE_AUTH = true`).
- Ligar RLS e multi-tenant (ex.: `ENABLE_RLS = true`, `ENABLE_MULTI_TENANT = true`).
- A **mesma** árvore de config e o **mesmo** fluxo SETUP_STEPS continuam; apenas os dados passam a reais e isolados por tenant. Nenhum refactor da web de configuração é necessário; apenas os switches são activados e o E2E InsForge (RLS) é validado.

Referência: [docs/INSFORGE_RLS_AUDIT_REPORT.md](../INSFORGE_RLS_AUDIT_REPORT.md) (secção 10 — RLS VERIFIED, e secção 11 — Baseline v1).

---

## 6. Ficheiros canónicos

- **Árvore (SECTIONS):** `merchant-portal/src/components/config/ConfigSidebar.tsx`
- **Tipos:** `merchant-portal/src/components/config/types.ts`
- **Setup (SETUP_STEPS):** `merchant-portal/src/core/setup/restaurantSetupSteps.ts`
- **Rotas /config:** `merchant-portal/src/App.tsx` (Route path="/config" …)
- **Layout:** `merchant-portal/src/pages/Config/ConfigLayout.tsx`

Mudanças à árvore ou ao fluxo de setup devem manter este contrato e a documentação em sincronia.
