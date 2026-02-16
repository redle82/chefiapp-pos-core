# Lacunas: Documentação vs Implementação (2026-02)

**Propósito:** Identificar (1) melhorias implementadas sem contrato/anti-regressão explícita e (2) documentos que referem comportamento não implementado ou "fase seguinte". Assim evita-se regressão e confusão entre "lei" e "código".

---

## 1. Melhorias implementadas SEM contrato/anti-regressão explícita

As seguintes melhorias estão **implementadas no código** e listadas em `MELHORIAS_UMA_A_UMA_CONCLUIDO_2026-02.md` e/ou `O_QUE_FOI_FEITO_VS_MAPA_2026-02.md`, mas **não** têm um contrato dedicado nem uma tabela "não voltar a fazer" como as do KDS/Bar.

| # | Melhoria | Onde está implementado | Documentado em | Anti-regressão? |
|---|----------|------------------------|----------------|-----------------|
| 1 | Cookie consent banner | `CookieConsentBanner.tsx`, `App.tsx`, `recordLegalConsent`, links ToS/Privacy | MELHORIAS_UMA_A_UMA §1 | ❌ Não há doc "não remover banner nem recordLegalConsent" |
| 2 | Indicador modo offline | `OfflineIndicator.tsx`, `useCoreHealth`, uso em `AppContentWithBilling` | MELHORIAS_UMA_A_UMA §2 | ❌ Não há doc "não remover OfflineIndicator nem useCoreHealth" |
| 3 | Conteúdo ToS/Privacy | `LegalTermsPage.tsx`, `LegalPrivacyPage.tsx`, secções canónicas | MELHORIAS_UMA_A_UMA §3 | ❌ Não há contrato de conteúdo mínimo |
| 4 | Data export / deletion (GDPR) | `DataPrivacyPage.tsx`, rota `/config/data-privacy`, ConfigSidebar, `GDPR_DATA_EXPORT_DELETION.md` | MELHORIAS_UMA_A_UMA §4 | ❌ Não há doc "não remover página nem rota nem entrada na sidebar" |
| 5 | i18n (fluxo crítico) | `i18n.ts`, namespaces common/legal/billing, `useTranslation` em cookie/offline/legal/billing | MELHORIAS_UMA_A_UMA §5 | ❌ Não há doc "não remover i18n.ts nem import em main_debug; manter namespaces para cookie/legal/billing" |
| 6 | Triagem TODOs | `TODO_TRIAGE.md`; IdentitySection e CartDrawer resolvidos | MELHORIAS_UMA_A_UMA §6 | ⚠️ Triagem é doc; não há "não reintroduzir TODOs pré-launch sem triagem" |
| 7 | E2E fluxo crítico | `fluxo-critico.spec.ts`, `restaurante-funcionando.spec.ts`, job em CI | MELHORIAS_UMA_A_UMA §7 | ❌ Não há doc "não remover specs nem job E2E; manter mock OTP quando aplicável" |
| 8 | Observabilidade + PgBouncer | `ConfigStatusPage.tsx` "Estado do sistema", `useCoreHealth` "Verificar agora"; `PGBOUNCER.md`, `docker-compose.pgbouncer.yml` | MELHORIAS_UMA_A_UMA §8 | ❌ Não há doc "não remover bloco Estado do sistema nem PGBOUNCER.md/override" |

**Recomendação:** Adicionar secção **"Anti-regressão (não voltar a fazer)"** em `MELHORIAS_UMA_A_UMA_CONCLUIDO_2026-02.md` (ou criar `MELHORIAS_UMA_A_UMA_ANTIREGRESSAO.md`) com uma linha por melhoria, à semelhança de `MELHORIAS_KDS_E_BAR_CONTRATOS_2026-02.md` §5.

---

## 2. Documentos que referem comportamento NÃO implementado (por design)

Estes documentos descrevem **contrato alvo** ou **fase seguinte**; o código atual não os cumpre na totalidade. Não é bug — está explícito no próprio doc.

| Documento | O que não está implementado | Onde está dito |
|-----------|-----------------------------|----------------|
| CONFIG_RUNTIME_CONTRACT.md | §2.2 **Contrato alvo:** `device_type` deve corresponder ao módulo (TPV só com module_id=tpv); dispositivo passa `location_id` ao runtime; isolamento por localização | "Contrato alvo (fase seguinte)" |
| CONFIG_RUNTIME_CONTRACT.md | §2.2 Ubicaciones: cada dispositivo com `location_id` e `device_type`; TPV só vê mesas da sua localização | "Contrato alvo" e "Estado atual: dispositivo tem restaurant_id e module_id; location_id pode ser evolução explícita" |
| CONFIG_WEB_UX.md | Estrutura da sidebar (SECTIONS) e SETUP_STEPS — se o código divergir (rotas ou nomes), o doc fica desatualizado | Definido em: ConfigSidebar.tsx, restaurantSetupSteps.ts — validar periodicamente |

**Recomendação:** Ao implementar "contrato alvo" ou "fase seguinte", atualizar o doc e marcar como "Contrato mínimo (fase atual)" cumprido e mover o antigo alvo para "Cumprido em DD/MM/AAAA".

---

## 3. Melhorias KDS/Bar — documentação completa

As melhorias do KDS e Bar (layout, scroll, rodapé, tabs, station, OriginBadge, log, migrações, scripts) estão **todas** documentadas com:

- Contratos: `KDS_LAYOUT_UX_CONTRACT.md`, `KDS_BAR_COZINHA_STATION_CONTRACT.md`
- Auditoria e anti-regressão: `MELHORIAS_KDS_E_BAR_CONTRATOS_2026-02.md` (§5 tabela "não voltar a fazer", §6 comentários no código)
- Referências no código: comentários em `KDSMinimal.tsx`, `OrderReader.ts`, `OriginBadge.tsx`

Nenhuma melhoria KDS/Bar implementada ficou sem doc nem doc ficou sem implementação.

---

## 4. Resumo de ações sugeridas

| Ação | Prioridade | Onde |
|------|------------|------|
| Adicionar secção "Anti-regressão (não voltar a fazer)" ao plano Melhorias uma a uma (cookie, offline, legal, i18n, E2E, PgBouncer) | Média | `MELHORIAS_UMA_A_UMA_CONCLUIDO_2026-02.md` ou novo `MELHORIAS_UMA_A_UMA_ANTIREGRESSAO.md` |
| Validar CONFIG_WEB_UX (ConfigSidebar SECTIONS, SETUP_STEPS) vs código atual | Baixa | Comparar `ConfigSidebar.tsx` e `restaurantSetupSteps.ts` com o doc |
| Ao implementar device_type/location_id (CONFIG_RUNTIME), atualizar contrato e marcar "cumprido" | Quando fizer a fase | CONFIG_RUNTIME_CONTRACT.md §2.2 |

---

Última atualização: 2026-02 — Lacunas documentação vs implementação; melhorias sem anti-regressão; documentos com contrato alvo não implementado.
