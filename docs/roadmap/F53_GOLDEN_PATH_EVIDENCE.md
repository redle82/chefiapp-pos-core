# F5.3 — Golden path inter-app (evidence pack)

**Objetivo:** Consolidar a evidência inter-app num único sítio: golden path operacional, o que está automatizado vs manual, comando único reproduzível e classificação F5.3.  
**Referência:** [FASE_5_CONVERGENCIA_OPERACIONAL.md](./FASE_5_CONVERGENCIA_OPERACIONAL.md), [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md), [FASE_3_MERCHANT_PORTAL_EVIDENCE.md](./FASE_3_MERCHANT_PORTAL_EVIDENCE.md), [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md).

---

## 1. Golden path mínimo (convergência operacional)

Fluxo que representa convergência entre portal, desktop, mobile e Core:

| Passo | Descrição | Superfícies envolvidas |
|-------|-----------|------------------------|
| 1 | **Admin gera/provisiona** — Token criado em `/admin/devices` (TPV/KDS/AppStaff); QR ou instruções expostas. | merchant-portal |
| 2 | **Install/pairing acontece** — Device usa entrypoint (portal `/install?token=…` ou Electron setup ou mobile ativa com token+PIN); RPC/gateway chamado; Core regista terminal ou sessão. | merchant-portal (/install), desktop-app (setup → consumeInstallToken), mobile-app (gateway /mobile/activate) |
| 3 | **Role vem do backend** — Papel nunca inferido do texto do código; portal: `connectByCode` + invite; mobile: `MobileActivateResponse.principal.roles`. | merchant-portal, mobile-app |
| 4 | **Sessão/persistência corretas** — Device/sessão persistidos (localStorage/electron-store/SecureStore); reabertura reutiliza identidade. | merchant-portal (installedDeviceStorage), desktop-app (TerminalConfig), mobile-app (SecureStore) |

**Resultado esperado:** Todas as superfícies conformes aos contratos de identidade, pairing e role-from-backend; evidência executável (testes/probe) verde.

---

## 2. O que está automatizado

| Evidência | Comando / recurso | O que prova |
|-----------|-------------------|-------------|
| **Probe inter-app único** | `npm run audit:fase3-conformance` | Desktop: estrutura (TerminalConfig, README pairing). Portal: testes Fase 3 (role source, consumeInstallToken via Core). Mobile: testes mobileActivationApi (role from backend, recovery, activation flow). |
| **Portal (pairing + role)** | `pnpm --filter merchant-portal run test:fase3-conformance` | devicesApi.conformance (Core RPC), connectByCode (role from invite). |
| **Portal E2E (install flow)** | Playwright `devices-installation.spec.ts` | `/install?token=…` chama RPC, mostra "Dispositivo ativado"; revoke chama `revoke_terminal`. (Corre no job E2E do CI.) |
| **Mobile (ativação + persistência)** | `pnpm --filter mobile-app test -- mobileActivationApi.test.ts` | Role from backend; clear/getActivationSession; activate → persist → getActivationSession. |
| **Pre-release gate (sequência)** | `npm run audit:pre-release` ou `bash scripts/pre-release-gate.sh` | Opcional: health Core; obrigatório: audit:fase3-conformance; opcional: audit:billing-core (se DATABASE_URL). |

**Comando único para evidência inter-app (sem Core/billing):**  
`npm run audit:fase3-conformance`

**Comando único para pre-release (com opcionais):**  
`npm run audit:pre-release` — ver §4 abaixo.

---

## 3. O que é manual (não automatizado)

| Item | Descrição | Como validar |
|------|-----------|----------------|
| **Pairing desktop real** | Inserir token no Electron → RPC chamado → TerminalConfig persistido → reabrir sem re-pairing. | Checklist manual ou E2E futuro; probe atual valida apenas estrutura e README. |
| **Pairing mobile real** | Token+PIN no device → ativação → sessão persistida → reabrir app sem re-pedir ativação. | Testes unitários cobrem lógica (mobileActivationApi.test.ts); fluxo em device real é manual. |
| **Admin → install ponta a ponta** | Humano em /admin/devices gera token; abre /install noutro browser/device; vê "Dispositivo ativado". | E2E Playwright cobre com mock do RPC; fluxo real contra Core requer Core up. |
| **Screenshots / estados de erro** | Estados visuais (token expirado, revoke, reinstall). | Documentar quando necessário; não bloqueante para F5.3. |

---

## 4. Fluxo mínimo reproduzível (pre-release gate)

Script único: **`scripts/pre-release-gate.sh`**

- **Obrigatório:** `audit:fase3-conformance` — falha do step = exit 1.
- **Opcional (se `CORE_URL` ou ambiente Core disponível):** `bash scripts/core/health-check-core.sh` — falha = exit 1.
- **Opcional (se `DATABASE_URL` definido):** `npm run audit:billing-core` — falha = exit 1.

Comando npm: **`npm run audit:pre-release`**

Uso típico antes de release ou tag:

```bash
# Só conformance (não precisa Core nem DB)
npm run audit:fase3-conformance

# Pre-release completo (Core e billing opcionais por env)
CORE_URL=http://localhost:3001 npm run audit:pre-release
DATABASE_URL=postgres://... npm run audit:pre-release
```

---

## 5. Classificação F5.3

| Critério | Estado |
|----------|--------|
| Golden path descrito e rastreável | **Sim** — §1; alinhado a FASE_3 §4.2 golden flows. |
| Evidência centralizada num único sítio | **Sim** — Este doc + `audit:fase3-conformance` + `audit:pre-release`; referências a FASE_3_MERCHANT_PORTAL_EVIDENCE, C41_MOBILE_PHASE3_EVIDENCE. |
| Automação vs manual claramente separados | **Sim** — §2 (automatizado) e §3 (manual). |
| Comando único ou sequência mínima | **Sim** — `audit:fase3-conformance` (único); `audit:pre-release` (sequência mínima com opcionais). |

**Recomendação objetiva:** **ALIGNED**

- A evidência inter-app está consolidada; um único comando (`audit:fase3-conformance`) cobre as três superfícies de forma reproduzível e já corre no CI (F5.2).
- O pre-release gate opcional (`audit:pre-release`) adiciona health Core e billing quando as variáveis estão definidas, sem inventar fluxo inexistente.
- O que falta para um gate "mais forte" é apenas E2E real em device (desktop/mobile) e checklist manual documentado — aceitável como residual; não bloqueia classificação ALIGNED.

---

## 6. Referências rápidas

| Recurso | Caminho |
|---------|---------|
| Probe Fase 3 | `scripts/fase3-conformance-probe.sh` |
| Pre-release gate | `scripts/pre-release-gate.sh` |
| Evidence portal | [FASE_3_MERCHANT_PORTAL_EVIDENCE.md](./FASE_3_MERCHANT_PORTAL_EVIDENCE.md) |
| Evidence mobile | [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) |
| Golden flows (detalhe) | [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md) §4.2 |
| Tabela de gates | [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) §2 e §3 |

---

*Doc F5.3 — Golden path evidence pack. Classificação: ALIGNED. Última atualização: 2026-03.*
