# Mapa de Estados Globais de UI (Dia 1 — Unificação Perceptiva)

**Data:** 2026-01-31  
**Objetivo:** Mapeamento AS-IS dos estados loading, empty, error, blocked e pilot; proposta canónica GlobalUIState; acordo visual mínimo. Alinhado a [DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md](../architecture/DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md).

**Critério de sucesso Dia 1:** Três screenshots (Portal, TPV, KDS) no mesmo estado — qualquer pessoa diz que são do mesmo sistema.

---

## 1. Mapeamento AS-IS (realidade nua)

Superfícies: **Portal** (/app/*, dashboard, menu-builder), **TPV** (/op/tpv, TPVMinimal), **KDS** (/op/kds, KDSMinimal).

### 1.1 Loading

| Superfície | Onde aparece | Como é mostrado |
|------------|--------------|-----------------|
| **Portal** | RestaurantRuntimeContext (`runtime.loading`), MenuBuilderCore (`loading`), DashboardPortal, RequireOperational, FlowGate, AuthPage, SelectTenantPage, BillingPage, PeopleDashboardPage, TaskDashboardPage, HealthDashboardPage, etc. | Dashboard: emoji ⏳ + "Carregando Dashboard..." (centro, #666). MenuBuilder: "A carregar menu..." (texto simples, theme.textMuted). RequireOperational: "Verificando estado operacional..." (min-h-screen, bg-slate-900, text-slate-400). FlowGate: LoadingState (componente DS). Vários padrões: texto só, spinner implícito, emoji. |
| **TPV** | TPVMinimal (`loading` useState) | "Carregando produtos..." (div simples, sem container fullscreen consistente). |
| **KDS** | KDSMinimal (`loading` useState) | Fullscreen centrado, VPC.bg/VPC.textMuted, "A carregar pedidos..." com animação vpc-fade. |

**Resumo:** Pelo menos **3 formas diferentes** de loading (Dashboard emoji+texto, MenuBuilder texto curto, TPV div simples, KDS fullscreen VPC). Sem componente único nem hierarquia visual comum.

### 1.2 Empty

| Superfície | Onde aparece | Como é mostrado |
|------------|--------------|-----------------|
| **Portal** | MenuBuilderCore (`products.length === 0`) | Bloco com título "Ainda não há itens no menu.", CTA "Usar menu de exemplo". EmptyState em várias páginas (Manager, Employee, Owner) — componente `EmptyState` com title/message/action. |
| **TPV** | Carrinho vazio | "Carrinho vazio" (texto em div); setError("Carrinho vazio") trata vazio como erro. |
| **KDS** | KDSMinimal (`orders.length === 0`) | Fullscreen centrado, VPC, mensagem "Nenhum pedido ativo" (ou similar), CTA para voltar. |

**Resumo:** Portal usa EmptyState ou bloco custom (MenuBuilder); TPV mistura empty com error; KDS tem empty dedicado com VPC. **Sem semântica única** (empty vs "erro" de carrinho vazio).

### 1.3 Error

| Superfície | Onde aparece | Como é mostrado |
|------------|--------------|-----------------|
| **Portal** | MenuBuilderCore (`error` state, toUserMessage), RestaurantRuntimeContext (`error`), AuthPage, BootstrapPage | MenuBuilder: banner com theme.errorBg/errorBorder, texto do erro. Runtime: error em contexto (não sempre exposto igual). Auth: texto vermelho (#f87171). Bootstrap: state "error" + Alert. |
| **TPV** | TPVMinimal (`error` state, toUserMessage) | Banner inline: backgroundColor "#fee", color "#c00", "Erro: {error}". |
| **KDS** | KDSMinimal (`error` state, toUserMessage) | Fullscreen: "Problema ao carregar" + parágrafo com error. VPC.bg, VPC.text. |

**Resumo:** MenuBuilder e TPV/KDS usam toUserMessage (mensagens neutras). **Visual diferente:** Portal theme tokens vs TPV #fee/#c00 vs KDS fullscreen VPC. ErrorBoundary em /op/tpv e /op/kds mostra fallback neutro ("TPV/KDS temporariamente indisponível"); não unifica com erro de dados.

### 1.4 Blocked

| Superfície | Onde aparece | Como é mostrado |
|------------|--------------|-----------------|
| **Portal** | Não bloqueia acesso (GloriaFood model); onboarding = banners. | — |
| **TPV/KDS** | RequireOperational quando `!runtime.isPublished` | Tela cheia: ícone amber, "Sistema não operacional", texto "As ferramentas de operação (TPV, KDS) só ficam disponíveis após publicar...", link "Ir para o Portal de Gestão". bg-slate-950, texto branco. |
| **TPV** (caixa fechado) | TPVMinimal quando `!isShiftOpen` | Banner vermelho (#fef2f2, #ef4444): "Caixa Fechado: Para realizar vendas reais, você precisa abrir o turno no portal." + botão "Abrir Turno". |

**Resumo:** Blocked aparece como **RequireOperational** (não publicado) e como **caixa fechado** no TPV. Dois padrões visuais (tela cheia vs banner). Nenhum estado "blocked" genérico reutilizável.

### 1.5 Pilot

| Superfície | Onde aparece | Como é mostrado |
|------------|--------------|-----------------|
| **Portal** | DashboardPortal (setProductMode("pilot"), mode === "pilot"), ModeIndicator, BackofficePage | Dashboard: botão "Ativar piloto"; quando pilot, indicador. ModeIndicator: badge/estilo "pilot" (oculto em produção para utilizador final). |
| **TPV** | TPVMinimal (`productMode === "pilot"`) | Banner amarelo (#fef3c7, #f59e0b): "Modo piloto — pedidos de teste (marcados no sistema)". |
| **KDS** | KDSMinimal (ModeGate allow pilot/live) | Sem banner explícito de "modo piloto"; ModeGate permite acesso. |

**Resumo:** Pilot é **explícito no TPV** (banner); no Portal é controle + indicador; no KDS é implícito (gate). Três formas diferentes.

---

## 2. Proposta canónica — GlobalUIState

Uma semântica única que o sistema inteiro pode obedecer. Não é framework-specific.

```ts
type GlobalUIState = {
  isLoadingCritical: boolean;  // bloqueia interação principal
  isEmpty: boolean;            // lista/dados vazios (não é erro)
  isBlocked: boolean;         // ação bloqueada (ex.: não publicado, caixa fechado)
  isError: boolean;           // erro apresentável ao utilizador
  isPilot: boolean;           // modo piloto / em teste
};
```

**Regras (derivadas do contrato perceptivo):**

- Nunca mais "loading" ad-hoc por componente — usar `isLoadingCritical` (ou derivado) e componente único de loading.
- Nunca mais erro técnico direto na UI — usar `isError` + mensagem já passada por toUserMessage (ou equivalente).
- Pilot é um **estado**, não um texto solto — todos os apps consomem `isPilot` para mostrar indicador consistente.
- Estados são **ortogonais**: podem coexistir quando faz sentido (ex.: loading + pilot; empty + pilot).

**Implementação:** Contexto ou store mínimo que exponha GlobalUIState; fontes de verdade: runtime (loading, error, isPublished), shift (isShiftOpen), productMode (pilot). Centralização em sprint seguinte; este documento fixa o acordo semântico.

---

## 3. Acordo visual mínimo (por estado)

Para cada estado global, definir comportamento e sensação. Não é UI final — é **lei** para que o mesmo estado pareça o mesmo estado em Portal, TPV e KDS.

| Estado    | Comportamento | Sensação |
|-----------|----------------|----------|
| **loading** | Bloqueia ação principal ou ocupa área de conteúdo | "O sistema está a trabalhar." |
| **empty**   | Orienta; CTA claro quando aplicável | "Falta algo, mas é normal." |
| **error**   | Protege; mensagem neutra, retry ou voltar | "Algo falhou, não é culpa tua." |
| **blocked** | Explica; próximo passo explícito (ex.: publicar, abrir turno) | "Há um passo antes." |
| **pilot**   | Tranquiliza; indicador visível mas não alarmante | "Podes explorar sem risco." |

**Hierarquia visual:** Em todas as superfícies, o mesmo estado usa a mesma hierarquia (o que chama atenção primeiro) e o mesmo tipo de mensagem (curta, neutra). Detalhe de implementação (cores, espaçamento) obedece a DESIGN_SYSTEM_PERCEPTUAL_CONTRACT e RESTAURANT_OS_DESIGN_PRINCIPLES (tokens por função).

---

## 4. Resumo do mapeamento AS-IS

| Estado   | Portal | TPV | KDS | Fragmentação |
|----------|--------|-----|-----|----------------|
| loading  | Vários (emoji, texto, LoadingState, runtime.loading) | "Carregando produtos..." (div) | Fullscreen VPC "A carregar pedidos..." | 3+ padrões |
| empty    | EmptyState ou bloco MenuBuilder | Carrinho vazio (por vezes como erro) | Fullscreen "Nenhum pedido ativo" | 3 padrões; TPV mistura empty/error |
| error    | theme.errorBg, Auth vermelho, Bootstrap Alert | Banner #fee/#c00 "Erro: {error}" | Fullscreen "Problema ao carregar" + texto | 3 visuais; toUserMessage já unifica texto |
| blocked  | N/A (portal não bloqueia) | RequireOperational (tela) + banner caixa fechado | RequireOperational (tela) | 2 padrões (tela vs banner) |
| pilot    | Dashboard botão + ModeIndicator | Banner amarelo explícito | Implícito (gate) | 3 formas |

**✅ Implementado (Dia 2 e Dia 3):** GlobalUIState + componentes partilhados; TPV, KDS, Portal, MenuBuilder, RequireOperational e FlowGate migrados. Outras páginas (SelectTenantPage, BillingPage, PeopleDashboardPage, TaskDashboardPage, etc.) podem migrar para GlobalLoadingView/GlobalEmptyView/GlobalErrorView quando fizer sentido.

---

## 5. Dia 2 — Ponto de verdade (implementado)

- **GlobalUIStateProvider:** [merchant-portal/src/context/GlobalUIStateContext.tsx](../../merchant-portal/src/context/GlobalUIStateContext.tsx) — deriva de RestaurantRuntimeContext e ShiftContext; expõe `isLoadingCritical`, `isEmpty`, `isBlocked`, `isBlockedByGate`, `isBlockedByShift`, `isError`, `isPilot`.
- **Montagem:** App.tsx — GlobalUIStateProvider envolve RoleProvider (após ShiftProvider) para que Portal, TPV e KDS tenham acesso.
- **TPV (primeiro consumidor):** TPVMinimal usa `useGlobalUIState()`; estado **blocked** (caixa fechado) passa a vir de `globalUI.isBlockedByShift` em vez de `useShift().isShiftOpen`. Banner "Caixa Fechado" e botão "Criar Pedido" / "Caixa Fechado" obedecem ao estado global.
- **Ordem de migração:** blocked (TPV) feito; error (TPV) feito; pilot (TPV) feito; loading (TPV) feito; empty (TPV) feito. **KDS migrado:** loading, error, empty e pilot. **Portal migrado:** MenuBuilderCore usa `useGlobalUIState()` para loading, error e empty; DashboardPortal usa `globalUI.isLoadingCritical`. Pilot no Portal continua via `runtime.productMode`; GlobalUIState deriva `isPilot` da mesma fonte.

---

## 6. Dia 3 — Componentes partilhados (acordo visual)

Para que o mesmo estado **pareça** o mesmo em Portal, TPV e KDS, foram criados componentes canónicos em `merchant-portal/src/ui/design-system/components/`:

| Componente | Uso | Props principais |
|------------|-----|------------------|
| **GlobalLoadingView** | Estado loading | `message`, `layout` (operational \| portal), `variant` (fullscreen \| inline) |
| **GlobalEmptyView** | Estado empty | `title`, `description?`, `action?`, `actionLoading?`, `layout`, `variant` |
| **GlobalErrorView** | Estado error | `message`, `title?`, `action?`, `layout`, `variant` |
| **GlobalPilotBanner** | Indicador modo piloto | `message?` (default canónico) |
| **GlobalBlockedView** | Estado blocked (ex.: não publicado) | `title`, `description`, `action` ({ label, to? \| onClick? }) |

**Layout:** `operational` = VPC escuro (TPV/KDS); `portal` = claro (Dashboard, MenuBuilder).  
**Variant:** `fullscreen` = ocupa viewport; `inline` = bloco no fluxo.

- **KDS:** KDSMinimal usa `GlobalLoadingView`, `GlobalErrorView`, `GlobalEmptyView` e `GlobalPilotBanner` (layout operational, fullscreen/inline conforme estado).
- **TPV:** TPVMinimal usa `GlobalLoadingView` (fullscreen), `GlobalErrorView` e `GlobalEmptyView` (inline, layout portal), `GlobalPilotBanner`.
- **Portal:** MenuBuilderCore usa `GlobalLoadingView` e `GlobalErrorView` (inline, layout portal); DashboardPortal usa `GlobalLoadingView` (fullscreen, layout portal). Empty no MenuBuilder mantém bloco custom (CTA "Usar menu de exemplo" com estado loading).
- **RequireOperational:** usa `GlobalLoadingView` ("Verificando estado operacional...", layout operational, fullscreen) e `GlobalBlockedView` para a tela "Sistema não operacional" (title, description, action "Ir para o Portal de Gestão").
- **PaymentGuard:** usa `GlobalLoadingView` quando status loading ("A verificar subscrição..."); quando status canceled usa `GlobalBlockedView` ("Subscrição necessária", description, action "Reativar plano" → /app/billing).
- **FlowGate:** usa `GlobalLoadingView` ("A verificar sessão...", layout operational, fullscreen) em vez de LoadingState spinner.
- **MenuBuilder empty:** migrado para `GlobalEmptyView` (title, description, action "📋 Usar menu de exemplo", `actionLoading={loadingExample}`); `GlobalEmptyView` passou a suportar prop `actionLoading` para CTA em loading.

---

## 7. Conclusão e validação

**Critério de sucesso (Dia 1):** *Três screenshots (Portal, TPV, KDS) no mesmo estado — qualquer pessoa diz que são do mesmo sistema.*

**O que foi feito:**
- **Estado:** Uma única semântica (GlobalUIState) e um ponto de verdade (GlobalUIStateContext) para loading, empty, error, blocked e pilot.
- **Visual:** Quatro componentes canónicos (GlobalLoadingView, GlobalEmptyView, GlobalErrorView, GlobalPilotBanner) usados em TPV, KDS, Portal, MenuBuilder, RequireOperational e FlowGate.
- **Gates:** RequireOperational e FlowGate mostram loading com o mesmo componente (GlobalLoadingView), alinhado ao acordo visual.

**Como validar:**
1. Entrar em Portal → Dashboard: estado loading usa "Carregando Dashboard..." (GlobalLoadingView portal fullscreen).
2. Entrar em TPV: loading "Carregando produtos...", empty "Nenhum produto disponível", pilot banner amarelo (componentes partilhados).
3. Entrar em KDS: loading "A carregar pedidos...", empty "Nenhum pedido ativo", error "Problema ao carregar", pilot banner (componentes partilhados).
4. Comparar sensação: mesmo tipo de mensagem (curta, neutra), mesma hierarquia por estado.

**Páginas adicionais migradas:** SelectTenantPage, BillingPage, PeopleDashboardPage, TaskDashboardPage e InventoryStockMinimal usam `GlobalLoadingView` (layout operational, fullscreen) para os respetivos estados de loading ("A carregar...", "A redirecionar...", "A carregar assinatura...", "Carregando perfis...", "A carregar tarefas...", "Carregando inventário e estoque...").

**Páginas adicionais:** SystemTreePage, PurchasesDashboardPage, PublicWeb/TablePage e CustomerOrderStatusView usam `GlobalLoadingView` (layout portal ou operational conforme contexto; fullscreen) para os respetivos estados de loading ("Carregando System Tree...", "Carregando compras...", "A carregar...", "Carregando status do pedido..."). AuthPage (verificação de sessão), PaymentGuard (verificação de subscrição) e HealthDashboardPage (loading + empty) usam `GlobalLoadingView` e, no caso do Health, `GlobalEmptyView` para "Nenhum dado de saúde disponível".

**Dia 3 (TPV error + empty):** Carrinho vazio deixou de ser tratado como erro; carrinho vazio usa GlobalEmptyView inline; fetch de produtos não lança detalhes técnicos (status/errorText). **Dia 4 (KDS):** KDSMinimal já usa GlobalErrorView e GlobalEmptyView com toUserMessage; `toUserMessage` (ui/errors.ts) passou a devolver fallback para mensagens técnicas ("Failed to read...", PGRST, status/response), evitando vazamento em TPV e KDS. **Dia 5 (Portal):** MiniTPVMinimal (AppStaff) deixou de lançar/exibir response.status; usa toUserMessage no catch para mensagem ao utilizador.

**Próximos passos (opcional):** Qualquer outra página com loading ad-hoc pode migrar para GlobalLoadingView/GlobalEmptyView quando for conveniente. **GlobalBlockedView** usado em RequireOperational e em PaymentGuard (subscrição cancelada).

**Transição Portal → TPV:** Na rota `/op/tpv`, a base visual é operacional (#0a0a0a) desde o primeiro frame. O wrapper ([OperationalFullscreenWrapper](merchant-portal/src/components/operational/OperationalFullscreenWrapper.tsx)) e o conteúdo ([TPVMinimal](merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx)) partilham a mesma base escura; loading e conteúdo não fazem segundo corte (loading escuro → conteúdo escuro). O único corte aceitável é Portal (claro) → TPV (escuro), lido como "entrei no modo operacional".

**Transição Portal → KDS:** Na rota `/op/kds`, o mesmo wrapper aplica base #0a0a0a; [KDSMinimal](merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx) já usa VPC (bg, surface) em todo o conteúdo, logo loading e conteúdo partilham a mesma base — sem segundo corte.

---

## 8. Copy canónico (Dia 6–7)

Regras de tom para manter continuidade perceptiva. Mensagens curtas, neutras; nunca stack trace nem vermelho técnico.

| Estado   | Padrão de copy | Exemplos |
|----------|----------------|----------|
| **loading** | "A carregar..." ou variante contextual | "Carregando produtos...", "A verificar sessão...", "A calcular saúde do restaurante..." |
| **empty**   | "Nenhum X disponível" / "Ainda não há X" | "Nenhum pedido ativo", "Carrinho vazio", "Nenhum dado de saúde disponível" |
| **error**   | Título neutro ("Problema ao carregar"); mensagem via toUserMessage | Fallback: "Erro ao carregar produtos.", "Não foi possível registar o pedido. Tente novamente." |
| **blocked** | Explicar o passo em falta; CTA claro | "Sistema não operacional", "Subscrição necessária"; ação "Ir para o Portal de Gestão" / "Reativar plano" |
| **pilot**   | Mensagem canónica do GlobalPilotBanner | "Modo piloto — pedidos de teste (marcados no sistema)" |

**Regra:** Em novos textos para estes estados, preferir "A carregar" (mais consistente) ou "Carregando" conforme contexto; error sempre com tom "o sistema sabe o que está a acontecer", nunca "algo quebrou".

---

**Referências:** [DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md](../architecture/DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md), [OPERATIONAL_UI_RESILIENCE_CONTRACT.md](../architecture/OPERATIONAL_UI_RESILIENCE_CONTRACT.md), [RESTAURANT_OS_DESIGN_PRINCIPLES.md](../architecture/RESTAURANT_OS_DESIGN_PRINCIPLES.md).
