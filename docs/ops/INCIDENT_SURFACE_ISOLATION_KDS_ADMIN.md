# Relatório de Incidente — Isolamento Admin vs TPV/KDS

**Data de deteção:** 5 de Março de 2026
**Data de correção:** 7 de Março de 2026
**Branch:** `feat/fase2-electron-desktop-shell`
**Severidade:** **Alta**
**Status:** Corrigido em código + coberto por testes — **pendente validação em runtime empacotado**

---

## 1. Resumo Executivo

Foi implementada uma correção multi-camada para impedir que rotas e interfaces administrativas sejam renderizadas em janelas operacionais TPV/KDS no runtime Electron. A mitigação cobre redirecionamento, UI de bloqueio, guardas de rota, guardas no processo principal e testes de regressão. Resta apenas a validação final em runtime empacotado para encerramento operacional do incidente.

---

## 2. Descrição do Incidente

Ao abrir "Painéis KDS" a partir do TPV no Electron Desktop, a nova janela KDS apresentava conteúdo administrativo (`/admin/*`) em vez do painel operacional KDS esperado. A fronteira entre superfícies operacionais (TPV/KDS) e administrativas estava quebrada em múltiplas camadas.

### 2.1 Cadeia de Vulnerabilidades Identificada

| #   | Camada                      | Descrição                                                     | Risco                                            |
| --- | --------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| V1  | ORE `redirectFor()`         | `MODULE_NOT_ENABLED` empurrava TPV/KDS para `/admin/modules`  | Redirect admin em janela operacional             |
| V2  | `BlockingScreen`            | Renderizava `<Link to="/admin/*">` dentro do runtime Electron | Link clicável para admin em contexto operacional |
| V3  | Rotas admin                 | Nenhum guard impedia renderização de admin dentro de Electron | Admin acessível por navegação direta             |
| V4  | `forceAllowedRouteIfNeeded` | Sem consciência do tipo de janela (TPV vs KDS)                | KDS podia ser forçado para rota TPV              |
| V5  | KDS panel windows           | Sem guard `did-navigate-in-page`                              | Navegação intra-page sem proteção                |
| V6  | `isInternalAppUrl`          | Em produção, aceitava qualquer URL `file://`                  | URL interna "demais" em packaged build           |
| V7  | localStorage                | Integridade de config de módulos não validada                 | Risco residual (diferida)                        |

---

## 3. Correções Implementadas

### Fase A — Contenção Imediata

| Fix | Ficheiro                                                                | Alteração                                                                                                          |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A1  | `merchant-portal/src/core/readiness/useOperationalReadiness.ts`         | `redirectFor()` retorna `/electron/setup` para TPV/KDS quando `MODULE_NOT_ENABLED` (antes: `/admin/modules`)       |
| A2  | `merchant-portal/src/core/readiness/BlockingScreen.tsx`                 | Desktop + admin `to` → renderiza `GlobalBlockedView` com CTA "Fechar janela" (`window.close()`) em vez de `<Link>` |
| A3  | `merchant-portal/src/ui/design-system/components/GlobalBlockedView.tsx` | Defense-in-depth: admin `to` + `isDesktopApp()` → downgrade para botão inerte de fechar janela                     |

### Fase B — Isolamento Estrutural

| Fix | Ficheiro                                                            | Alteração                                                                                                      |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| B1  | `merchant-portal/src/components/operational/ElectronAdminGuard.tsx` | **Novo componente** — guard de rota que bloqueia admin em Electron/Tauri; mostra lock screen com CTA fechar    |
| B2  | `merchant-portal/src/routes/OperationalRoutes.tsx`                  | `AdminRoutesFragment` envolvido em `<Route element={<ElectronAdminGuard />}>` layout route                     |
| B3  | `desktop-app/src/main.ts`                                           | `forceAllowedRouteIfNeeded` usa `isKDS` (closure) para devolver `/op/kds` ou `/op/tpv` conforme tipo de janela |
| B3+ | `desktop-app/src/main.ts`                                           | Guard `did-navigate-in-page` adicionado a janelas KDS panel — bloqueia paths admin e força retorno a `/op/kds` |

### Fase C — Auditoria de Routing em Produção

| Fix | Ficheiro                  | Alteração                                                                                                                                                                    |
| --- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | (documentação)            | Auditoria BrowserRouter vs HashRouter — mismatch pré-existente com `file://` + `hash:` em builds empacotadas. Documentado como finding; não alterado (scope de PR separado). |
| C2  | `desktop-app/src/main.ts` | `isInternalAppUrl` em produção agora faz parse do hash e aplica allowlist operacional (`/op/tpv`, `/op/kds`, `/electron/setup`) em vez de aceitar todo `file://`             |

### Fase D — Testes e Verificação

| Artefacto                                                                                                            | Resultado  |
| -------------------------------------------------------------------------------------------------------------------- | ---------- |
| `ElectronAdminGuard.test.tsx` — 3 testes (browser permite, Electron bloqueia, Tauri bloqueia)                        | ✅ Pass    |
| `surfaceIsolation.test.ts` — 10 testes (invariante: TPV/KDS nunca recebem `/admin/*` para qualquer `BlockingReason`) | ✅ Pass    |
| `merchant-portal` TypeScript (`tsc --noEmit`)                                                                        | ✅ 0 erros |
| `desktop-app` TypeScript (`tsc --noEmit`)                                                                            | ✅ 0 erros |

---

## 4. Modelo de Defesa em Profundidade

```
 Camada 1: ORE redirectFor() — nunca emite redirect admin para superfícies operacionais
    │
 Camada 2: BlockingScreen — intercepta qualquer admin `to` vindo de camadas acima
    │
 Camada 3: GlobalBlockedView — sanitiza links admin em desktop (defense-in-depth)
    │
 Camada 4: ElectronAdminGuard — bloqueia estruturalmente rendering de rotas admin em Electron/Tauri
    │
 Camada 5: forceAllowedRouteIfNeeded — Electron main process corrige rota por tipo de janela
    │
 Camada 6: did-navigate-in-page — guard proativo em janelas KDS panel
    │
 Camada 7: isInternalAppUrl — allowlist restrita em produção
```

---

## 5. Risco Residual

| Item                                        | Severidade | Status       | Ação                                             |
| ------------------------------------------- | ---------- | ------------ | ------------------------------------------------ |
| V7: Integridade localStorage de módulos     | Média      | Diferido     | PR separado de hardening                         |
| C1: BrowserRouter + `file://` hash mismatch | Média      | Documentado  | PR separado — risco baixo com as camadas actuais |
| Validação em runtime empacotado             | —          | **Pendente** | Ver §6 — QA checklist abaixo                     |

---

## 6. QA Release Checklist — Validação em Runtime Empacotado

> **Objectivo:** Confirmar que as correções funcionam no SF Desktop instalado (`.dmg` / setup), não apenas em `dev`. Este checklist é condição para marcar o incidente como **encerrado**.

### Pré-requisitos

- [ ] Build empacotado gerado: `cd desktop-app && pnpm build && pnpm dist:mac`
- [ ] `ChefIApp Desktop.app` instalado em `/Applications` a partir do `.dmg`
- [ ] Tenant onboarded com módulos TPV e KDS activos
- [ ] Core stack running (health check: `bash scripts/core/health-check-core.sh`)

### Smoke 1 — TPV + lançamento de painéis KDS

- [ ] Abrir SF Desktop instalado
- [ ] Navegar para TPV (`/op/tpv`)
- [ ] Abrir cada painel KDS (via menu ou atalho existente)
- [ ] **Verificar:** Cada janela KDS mostra conteúdo KDS operacional, nunca admin
- [ ] **Verificar:** Nenhum flash/frame perceptível de conteúdo admin durante abertura

### Smoke 2 — Nenhum fluxo renderiza admin em janela operacional

- [ ] Com TPV aberto, provocar cenário `MODULE_NOT_ENABLED` (ex.: desactivar módulo via admin no browser)
- [ ] **Verificar:** TPV mostra ecrã de bloqueio / setup, não redirect para `/admin/modules`
- [ ] **Verificar:** KDS mostra ecrã de bloqueio / setup, não redirect para `/admin/modules`
- [ ] Com TPV aberto, provocar cenário `BOOTSTRAP_INCOMPLETE`
- [ ] **Verificar:** Redirect vai para `/app/activation`, não para rota admin

### Smoke 3 — Navegação manual para `/admin/*` dentro de janela operacional

- [ ] Na janela TPV, abrir DevTools (`Cmd+Option+I`)
- [ ] Executar: `window.location.hash = '#/admin/modules'` (ou path equivalente)
- [ ] **Verificar:** `ElectronAdminGuard` bloqueia renderização — mostra lock screen com "Fechar janela"
- [ ] Executar: `window.location.hash = '#/admin/devices'`
- [ ] **Verificar:** Mesmo bloqueio — admin nunca renderiza
- [ ] Na janela KDS panel, repetir as tentativas acima
- [ ] **Verificar:** Guard de `did-navigate-in-page` ou `ElectronAdminGuard` impede admin

### Smoke 4 — Repetir no build empacotado real (não dev)

- [ ] **Confirmar:** Todos os smokes 1-3 foram executados na app instalada (`.app` de `/Applications`), não em `electron .` de dev
- [ ] **Verificar:** Nenhuma diferença de comportamento entre dev e empacotado
- [ ] Se alguma diferença: registar e investigar mismatch de router/preload

### Resultado

| Smoke                              | Pass/Fail | Notas |
| ---------------------------------- | --------- | ----- |
| 1 — TPV + KDS panels               |           |       |
| 2 — Bloqueio em MODULE_NOT_ENABLED |           |       |
| 3 — Navegação manual admin         |           |       |
| 4 — Build empacotado real          |           |       |

**Validado por:** **\*\*\*\***\_\_\_**\*\*\*\***
**Data:** **\*\*\*\***\_\_\_**\*\*\*\***

---

## 7. Encerramento

| Condição                  | Status                           |
| ------------------------- | -------------------------------- |
| Correção em código        | ✅ Implementada                  |
| Testes de regressão       | ✅ 13/13 pass                    |
| TypeScript compila limpo  | ✅ merchant-portal + desktop-app |
| QA em runtime empacotado  | ⬜ Pendente (§6)                 |
| V7 localStorage hardening | ⬜ Diferido (PR separado)        |

**O incidente será considerado encerrado quando todos os 4 smokes do §6 passarem no build empacotado.**

---

_Documento gerado em 7 de Março de 2026 — branch `feat/fase2-electron-desktop-shell`_
