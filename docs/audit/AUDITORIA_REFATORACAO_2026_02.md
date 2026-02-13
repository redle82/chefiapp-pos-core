# Auditoria de refatoração — 2026-02

**Objetivo:** Avaliar se o projeto precisa de refatoração e, em caso afirmativo, o quê e com que prioridade.

**Conclusão:** **Não é urgente.** O código está organizado, com legado explícito e blacklist ativa. Recomendam-se algumas limpezas e extrações de rotas, mas nada que bloqueie deploy ou vendas.

---

## 0. Feito após esta auditoria (2026-02)

| Ação | Estado |
|------|--------|
| **Extrair rotas do App.tsx** | ✅ Feito. Rotas em `merchant-portal/src/routes/MarketingRoutes.tsx` (público/marketing) e `OperationalRoutes.tsx` (operacional, RoleGate, op/, app/staff/, admin/, config/). |
| **App.tsx** | Reduzido para ~218 linhas; ~24 imports. Mantém shell, billing, FlowGate, ShiftGuard e os dois `<Routes>` que montam MarketingRoutes e OperationalRoutes. |

---

## 1. Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| **Precisamos de refatoração?** | Não obrigatória. Sim para **melhorar manutenção** (DORMANT, TODOs, placeholders). |
| **Há dívida técnica crítica?** | Não. Há legado **marcado** (LEGACY, @deprecated) e blacklist que impede reintrodução. |
| **Há duplicação perigosa?** | Não. TenantResolver tem `resolve` + `resolveTenant` (async vs puro) por desenho; auth está concentrada em useCoreAuth/AuthProvider. |
| **Próximo passo recomendado** | Opcional: limpar ou arquivar módulos DORMANT; converter TODOs prioritários em issues; substituir AdminPlaceholderPage quando houver páginas reais. |

---

## 2. O que foi auditado

- **merchant-portal/src:** TODOs, FIXMEs, LEGACY, @deprecated, stubs, placeholders
- **docs/ops/LEGACY_CODE_BLACKLIST.md:** regras já definidas
- **Entry points:** main_debug.tsx (app completo) vs main-marketing.tsx (só marketing) — já separados
- **Auth/tenant:** useCoreAuth, AuthProvider, TenantResolver, FlowGate — sem duplicação lógica relevante

---

## 3. Achados por categoria

### 3.1 LEGACY / @deprecated (documentado, não bloqueante)

| Onde | Estado | Ação sugerida |
|------|--------|----------------|
| **KernelContext.tsx** | @deprecated DORMANT — Event Sourcing não usado em produção | Manter até descomissionamento formal ou mover para `archive/` |
| **OrderProcessingService.ts** | @deprecated DORMANT — writes via OrderEngine/RPCs | Idem |
| **backendClient.ts** | DEPRECATED — usar coreClient/analyticsClient | Migrar imports restantes e depois remover ou marcar como deprecated wrapper |
| **OwnerDashboardWithMapLayout.tsx** | @deprecated — não usar em Reports | Já documentado; manter se ainda usado em alguma rota |
| **AppStaff.tsx** | LEGADO — não utilizado em rotas; entry real é AppStaffWrapper | ✅ Movido para `pages/AppStaff/legacy/AppStaff.legacy.tsx` (2026-02) |
| **Landing antiga** (Problem, Solution, Hero, Footer, etc.) | LEGACY — canónica é LandingV2 | Manter como está (referência) ou mover para `pages/Landing/legacy/` |

**Conclusão:** Nada exige refatoração imediata. LEGACY_CODE_BLACKLIST já impede reintrodução de Supabase e outros padrões proibidos.

---

### 3.2 TODOs no código

| Ficheiro / área | Tipo | Prioridade |
|-----------------|------|------------|
| VisionPage, SimulationPage, StockRealPage, PurchasesPage | "Integrar com Core" / dados reais | Baixa (funcionalidade futura) |
| IdentitySection (Onboarding) | "Implementar lógica real" | Média (se onboarding for crítico) |
| TableContext | "Configurar proxy reverso para Realtime" | Baixa |
| useShifts | "Integrar com Employee Time Engine" | Baixa |
| TPVInstaller | "Implementar quando necessário" | Baixa |
| OrderContextReal | "Considerar reduzir 15s em pico" | Baixa (tuning) |
| steps/index.ts | "Export step pages as they are created" | Baixa |
| KDSStandalone | "Implementar token de acesso para KDS se necessário" | Baixa |

**Recomendação:** Converter 2–3 TODOs de maior impacto em issues (ex.: IdentitySection); restantes podem ficar até haver capacidade.

---

### 3.3 Stubs e placeholders

| Onde | Propósito | Ação |
|------|-----------|------|
| **core/db/index.ts** | Stub que falha explicitamente quando usado (Core client em vez de Supabase) | Manter — contrato DOCKER_CORE_ONLY |
| **Logger.ts** | Stub Sentry quando @sentry/react não instalado | Manter — evita erro em build |
| **dockerCoreFetchClient** | RealtimeChannelStub (noop) | Manter — Core não usa Realtime no browser |
| **useRestaurantIdentity** | hydrateIdentityFromSupabasePlaceholder | Manter até backend !== docker ser descontinuado |
| **ConfigIntegrationsPage** | Secções "stub" por tipo | Aceitável para Fase 1; evoluir quando houver integrações reais |
| **PreviewPage, steps/index.ts** | Páginas placeholder | Manter ou implementar quando necessário |
| **AdminPlaceholderPage** | Usado em 3 rotas em App.tsx | Substituir por páginas reais quando existirem |

**Conclusão:** Stubs são intencionais (compatibilidade, build, Core-only). Nenhum exige refatoração urgente.

---

### 3.4 Tamanho e complexidade

| Ficheiro | Linhas (aprox.) | Observação |
|----------|------------------|-------------|
| **App.tsx** | ~1400 | Muitas rotas num único ficheiro. **Recomendação:** extrair árvore de rotas para módulos (ex.: `routes/PublicRoutes.tsx`, `routes/AppRoutes.tsx`) sem alterar comportamento. |
| **TenantResolver.ts** | ~590 | Lógica clara; `resolve` + `resolveTenant` é desenho (async vs puro). Não duplicação indevida. |

---

## 4. Recomendações

### 4.1 Fazer (prioridade média — quando houver tempo)

1. ~~**Extrair rotas do App.tsx**~~  
   ✅ Feito: `routes/MarketingRoutes.tsx` e `routes/OperationalRoutes.tsx`; App.tsx com dois `<Routes>` que os montam.

2. ~~**Decidir sobre módulos DORMANT**~~  
   **Decisão (2026-02): Opção B** — Manter no sítio com @deprecated. **KernelContext** ainda é usado por `pages/TPV/KDS/KDSStandalone.tsx` (KernelProvider). **OrderProcessingService** exporta o tipo `ExecuteSafeFn` usado por `core/menu/MenuBootstrapService.ts`. Descomissionar quando esses consumidores forem migrados; até lá não mover para archive.

3. **Substituir AdminPlaceholderPage**  
   Quando existirem páginas reais para essas 3 rotas, trocar em `routes/OperationalRoutes.tsx` e remover o placeholder.

### 4.2 Opcional (prioridade baixa)

- Mover componentes LEGACY da landing antiga para `pages/Landing/legacy/` (ou manter como está).
- **TODOs para converter em issues** (quando houver backlog): ver [BACKLOG_ISSUES_2026_02.md](BACKLOG_ISSUES_2026_02.md) — títulos e descrições prontos para criar issues (IdentitySection, Owner pages/Core, TableContext, AdminPlaceholderPage).
- Migrar últimos consumidores de `backendClient` para `coreClient`/`analyticsClient` e remover ou marcar backendClient como wrapper deprecated.

### 4.3 Não fazer (sem contrato ou ADR)

- **Não** refatorar TenantResolver (dois entry points são intencionais).
- **Não** consolidar auth/tenant sem ADR (risco de regressão).
- **Não** remover marcadores LEGACY em serviços "blocked in Docker mode" (são documentação viva).
- **Não** alterar arquitetura de entry points (main_debug vs main-marketing) nem shells/gates sem seguir contratos existentes.

---

## 5. Conclusão

- **Não é necessária refatoração urgente.** O projeto está em estado deployável e vendável; legado está explícito e controlado pela blacklist.
- **Refatorações recomendadas** são de **manutenção**: extrair rotas, tratar DORMANT e placeholders, e alinhar TODOs com o backlog.
- Qualquer refatoração que mexa em auth, tenant, FlowGate ou entry points deve seguir os contratos em `docs/` e `docs/architecture/`.

---

**Data:** 2026-02  
**Atualizado:** 2026-02 — Rotas extraídas; AppStaff→legacy; decisão DORMANT (Opção B); TODOs→issues em 4.2.  
**Próxima revisão:** Quando houver sprint de dívida técnica ou migração de consumidores de KernelContext/OrderProcessingService.
