# C4.1 — Evidence pack: mobile-app / Fase 3 conformance

**Objetivo:** Registar a evidência formal de alinhamento do mobile-app aos contratos Fase 3 (identidade, pairing, role from backend), com base em ficheiros e scripts reais do repo.  
**Referência:** [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md), [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md).

---

## 1. Localização e estado real do mobile-app

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| **Onde vive** | `mobile-app/` (raiz do monorepo) | Workspace em `package.json` raiz; diretório presente com código fonte. |
| **Stack** | Expo ~54, React 19, React Native 0.81, expo-router, Jest, TypeScript | `mobile-app/package.json`: `main: "expo-router/entry"`, `expo`, `react`, `jest --config jest.config.js`. |
| **Scripts** | `test`, `test:watch`, `test:coverage`, `lint`, `lint:fix`, `start`, `android`, `ios`, `web` | `mobile-app/package.json` scripts. |
| **Código fonte** | Presente | Múltiplos ficheiros em `app/`, `services/`, `context/`, `__tests__/`, etc. |

---

## 2. Evidência existente de Fase 3 / conformance

### 2.1 Probe global (`audit:fase3-conformance`)

- **Comando:** `npm run audit:fase3-conformance` (raiz).
- **Script:** `scripts/fase3-conformance-probe.sh`.
- **O que faz no mobile-app:** Executa `pnpm --filter mobile-app test -- mobileActivationApi.test.ts` e exige exit 0.
- **Evidência:** Se o probe passar, os testes de `mobileActivationApi.test.ts` estão verdes; o mobile-app está incluído na validação automatizada de conformance Fase 3.

### 2.2 Testes executáveis (mobileActivationApi)

- **Ficheiro:** `mobile-app/__tests__/services/mobileActivationApi.test.ts`.
- **Comando direto:** `pnpm --filter mobile-app test -- mobileActivationApi.test.ts` (em ambientes com Watchman pode ser necessário `--no-watchman` ou `--watchAll=false`).
- **O que testa (9 testes):**
  - **Storage boot safety:** `getOrCreateInstallId` devolve existente; cria install id mesmo quando SecureStore falha.
  - **Fase 3 / C4.1 — role from backend:** (1) `activateWithQrPin` devolve `principal.roles` da resposta do backend; token e PIN não contêm o role; (2) principal é persistido em SecureStore (PRINCIPAL_KEY) após ativação.
  - **Recovery/reinstall:** (1) `clearActivationSession` remove sessão; `getActivationSession` devolve null quando não há accessToken; (2) `getActivationSession` devolve principal quando a store tem sessão válida; (3) quando PRINCIPAL_KEY tem JSON corrompido, devolve `principal: null` mantendo accessToken (comportamento defensivo).
  - **Activation flow (integration):** (1) `activateWithQrPin` (mock backend) → `getActivationSession` devolve principal persistido; (2) `clearActivationSession` → `getActivationSession` devolve null (evidência de reinstall).

### 2.3 Código que implementa o contrato (inspeção)

- **Auth source / pairing:** `mobile-app/services/mobileActivationApi.ts`:
  - `activateWithQrPin()` envia POST para `${resolveGatewayBaseUrl()}/mobile/activate` com `activationToken` e `pin`; resposta tipada `MobileActivateResponse` com `session` e `principal` (roles, modulesEnabled, permissions).
  - Ref.: linhas 134–188; gateway `/mobile/activate` é o entrypoint de ativação (canal AppStaff/Waiter; distinto de `consume_device_install_token` para TPV/KDS).
- **Device persistence:** Após ativação, `safeSecureSet(ACCESS_TOKEN_KEY, ...)`, `safeSecureSet(REFRESH_TOKEN_KEY, ...)`, `safeSecureSet(PRINCIPAL_KEY, JSON.stringify(result.principal))`. Chaves: `mobile_activation_install_id`, `mobile_activation_access_token`, `mobile_activation_refresh_token`, `mobile_activation_principal`. Ref.: linhas 40–42, 183–185.
- **Role source:** `MobileActivateResponse.principal.roles` vem da resposta do backend; em nenhum sítio o papel é inferido do texto do token ou do PIN. A UI (`app/activate.tsx`) usa `result.principal.modulesEnabled` para routing; roles vêm sempre de `result.principal`. Conforme contrato "role from invite/backend".
- **Recovery / clear:** `clearActivationSession()` apaga ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PRINCIPAL_KEY (SecureStore). Ref.: linhas 218–224.

### 2.4 Documentação já existente

- **FASE_3_CONFORMANCE_INTER_APP.md** §5.3: checklist mobile-app com [x] em Auth source, Pairing entrypoint, Device persistence, Role source; [ ] em Recovery/reinstall e Evidence (checklist manual).
- **FASE_3_MERCHANT_PORTAL_EVIDENCE.md:** menciona probe global e que mobile-app é coberto por `audit:fase3-conformance` (mobileActivationApi tests).
- **WORKSPACES_ALIGNMENT.md:** mobile-app — comando de teste e "Conformidade: testes em `__tests__/services/mobileActivationApi.test.ts`; incluído em `npm run audit:fase3-conformance`".

---

## 3. Contratos relevantes

| Contrato | Aderência no mobile-app | Evidência |
|----------|-------------------------|-----------|
| **Role from backend** (CORE_IDENTITY_AND_TRUST, Fase 3) | Sim | `MobileActivateResponse.principal.roles` usado; nunca parseado do texto do código. Código: `mobileActivationApi.ts`, `activate.tsx`. |
| **Auth source** (gateway `/mobile/activate`) | Sim | POST para `/mobile/activate` com token+PIN; sessão e principal persistidos em SecureStore. |
| **Device persistence** (SecureStore) | Sim | INSTALL_ID_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, PRINCIPAL_KEY; reutilização em reabertura via `getActivationSession()`. |
| **Pairing entrypoint** (canal AppStaff, não TPV/KDS) | Sim | Fluxo próprio token+PIN → gateway; não usa `consume_device_install_token`. Alinhado à matriz Fase 3. |

Ref.: [CORE_IDENTITY_AND_TRUST_CONTRACT.md](../architecture/CORE_IDENTITY_AND_TRUST_CONTRACT.md), [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md) §4.1.

---

## 4. Comandos reais de validação

| Objetivo | Comando |
|----------|---------|
| **Probe Fase 3 (desktop + portal + mobile)** | `npm run audit:fase3-conformance` |
| **Só testes mobile-app** | `pnpm --filter mobile-app test` |
| **Só testes mobileActivationApi (conformance)** | `pnpm --filter mobile-app test -- mobileActivationApi.test.ts` |
| **Lint mobile-app** | `pnpm --filter mobile-app run lint` |

Se `audit:fase3-conformance` passar, o mobile-app contribui com os testes de `mobileActivationApi.test.ts` verdes.

---

## 5. Gaps residuais

- **Checklist manual (opcional):** FASE_3_CONFORMANCE_INTER_APP §5.4 continua a recomendar validação manual (limpar estado no dispositivo, reativar com novo token/PIN) para prova operacional; os testes automatizados cobrem o comportamento de `clearActivationSession` e `getActivationSession`.
- **E2E em dispositivo real:** Não existe E2E no repo que rode em simulador/dispositivo (ex.: Detox); a evidência do fluxo de ativação é o bloco de testes de integração "activation flow" (activateWithQrPin → getActivationSession com store simulada; clearActivationSession → getActivationSession null).

---

## 6. Classificação objetiva

**Classificação:** **ALIGNED**

- **ALIGNED:** **Sim** — (1) Teste explícito "role from backend": mock da resposta `/mobile/activate`; afirmação de que `result.principal.roles` vem da resposta e que token/PIN não contêm o role. (2) Recovery/reinstall automatizado: testes de `clearActivationSession`, `getActivationSession` (null após clear; principal válido; principal null com JSON corrompido). (3) Evidência executável do fluxo de ativação: testes de integração "activation flow" (activate → persistência lida via getActivationSession; clear → null). (4) Probe `audit:fase3-conformance` inclui e exige estes testes verdes.
- **PARTIAL:** Não — os três gaps anteriores (teste role-from-backend, recovery automatizado, evidência fluxo ativação) foram fechados com testes no mesmo ficheiro.
- **DOC_ONLY:** Não — há código e testes reais.
- **MISSING:** Não — workspace e código existem; probe inclui mobile-app.

---

## 7. Resumo para C4.1

- **Estado:** mobile-app presente no repo; stack Expo/React Native; testes Jest (9 testes em `mobileActivationApi.test.ts`); incluído no probe `audit:fase3-conformance`.
- **Evidência executável:** Testes de storage boot safety, **role from backend** (resposta mockada; role não derivado de token/PIN), **recovery/reinstall** (clear + getSession null; principal válido; principal corrompido), **activation flow** (activate → session persistida; clear → null). Probe global exige todos verdes.
- **Evidência por inspeção:** Auth source (gateway `/mobile/activate`), device persistence (SecureStore), clear session; documentado em FASE_3_CONFORMANCE_INTER_APP §5.3.
- **Gaps remanescentes:** Apenas checklist manual opcional (§5.4) e E2E em dispositivo real (fora do scope deste evidence pack).
- **Classificação C4.1:** **ALIGNED** — evidence pack formal com teste explícito role-from-backend, recovery/reinstall automatizado e evidência do fluxo de ativação; C4.1 fechado com conformidade comprovada por testes.

---

*Evidence pack C4.1 — mobile-app Fase 3 conformance. Última atualização: 2026-03. Classificação: ALIGNED.*
