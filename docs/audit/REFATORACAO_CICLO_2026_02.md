# Ciclo de refatoração 2026-02 — checkpoint

**Data:** 2026-02  
**Base:** [AUDITORIA_REFATORACAO_2026_02.md](AUDITORIA_REFATORACAO_2026_02.md), [FRAGMENTACAO_PROJETO_2026_02.md](FRAGMENTACAO_PROJETO_2026_02.md)

---

## O que foi feito

| Ação | Estado |
|------|--------|
| Extrair rotas do App.tsx | ✅ `routes/MarketingRoutes.tsx` (público/marketing) e `routes/OperationalRoutes.tsx` (operacional). App.tsx ~218 linhas. |
| AppStaff legado | ✅ Movido para `merchant-portal/src/pages/AppStaff/legacy/AppStaff.legacy.tsx`; entry real continua a ser AppStaffWrapper. |
| Decisão DORMANT | ✅ Opção B — KernelContext e OrderProcessingService mantidos no sítio (KernelContext usado por KDSStandalone; OrderProcessingService tipo usado por MenuBootstrapService). |
| Documentação | ✅ Auditoria e relatório de fragmentação atualizados; lista TODOs→issues em 4.2 da auditoria. |
| Repositório | ✅ Commit e push (refactor desfragmentar + legacy + docs). |

---

## Onde as coisas estão agora

- **Rotas:** `merchant-portal/src/routes/` — MarketingRoutes, OperationalRoutes, README.
- **App:** `merchant-portal/src/App.tsx` — dois `<Routes>` que montam os dois módulos; shell, billing, FlowGate, ShiftGuard inalterados.
- **Legado:** `merchant-portal/src/pages/AppStaff/legacy/` — AppStaff.legacy.tsx + README.
- **Contratos:** Sem alteração em entry points, shells ou gates; desfragmentação e legacy apenas.

---

## Próximos passos opcionais

- Criar issues no GitHub a partir da lista TODOs→issues (auditoria 4.2).
- Substituir AdminPlaceholderPage em OperationalRoutes quando existirem páginas reais.
- Migrar consumidores de backendClient para coreClient/analyticsClient quando houver tempo.

---

**Última atualização:** 2026-02
