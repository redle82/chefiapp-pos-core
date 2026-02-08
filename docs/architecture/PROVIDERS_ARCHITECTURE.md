# Arquitetura de Providers — Merchant Portal

**Objetivo:** Fonte de verdade para a separação entre árvore pública (demo/marketing) e árvore de app (produto real). Evita o erro "Cannot read properties of null (reading 'useContext')" e garante que rotas que usam hooks de contexto estejam sempre dentro dos providers corretos.

**Código:** [merchant-portal/src/App.tsx](../../merchant-portal/src/App.tsx)

---

## 1. Duas árvores

```text
BrowserRouter (main.tsx)
└── Routes (App)
    ├── path="/"           → PublicProviders → ProductFirstLandingPage   [ÁRVORE PÚBLICA]
    ├── path="/op/tpv"     → TPVDemoGate                                   [PÚBLICA ou REDIRECT]
    └── path="*"           → AppWithFullProviders → Routes (inner)         [ÁRVORE DE APP]
```

### Árvore pública (sem auth)

- **Rotas:** `/`, `/op/tpv` (apenas quando `?mode=demo`).
- **Providers:** `PublicProviders` = `RestaurantRuntimeContext.Provider` (demo) + `ShiftContext.Provider` (demo) + `GlobalUIStateProvider`.
- **Uso:** Landing, TPV demo; sem auth, sem backend real.

### Árvore de app (com auth)

- **Rotas:** tudo o que não é `/` nem `/op/tpv` no primeiro nível: `/login`, `/auth`, `/billing/success`, `/landing`, `/pricing`, `/features`, `/demo`, `/op/tpv` (real, via inner Routes), `/app/*`, etc.
- **Providers:** `RestaurantRuntimeProvider` → `ShiftProvider` → `GlobalUIStateProvider` → `RoleProvider` → `TenantProvider`.
- **Uso:** Login, auth, app, TPV real, billing.

### TPVDemoGate

- `/op/tpv?mode=demo` → renderiza `PublicProviders` + `TPVDemoPage` (árvore pública).
- `/op/tpv` sem `mode=demo` → redirect para `/auth` (entra na árvore de app).

---

## 2. Lista de rotas por árvore

| Árvore   | Rotas                                                                 |
|----------|-----------------------------------------------------------------------|
| Pública  | `/`, `/op/tpv` (só com `?mode=demo`)                                  |
| App      | `/login`, `/auth`, `/signup`, `/forgot-password`, `/billing/success`, `/landing`, `/pricing`, `/features`, `/demo`, `/onboarding/*`, `/op/tpv` (real), `/app/*`, e todas as demais |

---

## 3. Regra canónica

**Nenhuma rota que use `useAuth`, `useSupabaseAuth`, `useShift`, `useGlobalUIState` ou `useRestaurantRuntime` pode existir fora da árvore que fornece o provider correspondente.**

- Na **árvore pública** só são renderizados `ProductFirstLandingPage` e `TPVDemoPage` (e filhos). Eles recebem contexto via `PublicProviders` (demo).
- Na **árvore de app** todas as rotas que usam esses hooks estão dentro de `AppWithFullProviders`.

Se alguém adicionar uma rota pública que use esses hooks sem estar dentro de `PublicProviders`, ou mover uma rota que os usa para fora de `AppWithFullProviders`, o erro volta.

---

## 4. Teste humano (validação rápida)

Checklist completo (6 passos, ambiente, critérios): [VALIDACAO_TESTE_HUMANO_E2E.md](../VALIDACAO_TESTE_HUMANO_E2E.md).

Resumo rápido:
1. `npm run dev` (merchant-portal).
2. Abrir `http://localhost:5175/` — landing carrega; TPV demo funciona (fechar overlay se existir).
3. Clicar "Começar agora" — vai para `/auth`; sem tela de erro.
4. Abrir diretamente `http://localhost:5175/login` — redireciona para `/auth`; login renderiza.
5. Fazer signup ou login — app carrega normalmente (dashboard, TPV, etc.).
6. Aba anónima — repetir 1–3; demo sem dependência de sessão.

Se os passos passam, o contrato de providers está válido. Resultado esperado: "Agora vejo."

---

## 5. Referências

- [App.tsx](../../merchant-portal/src/App.tsx): definição de `PublicProviders`, `TPVDemoGate`, `AppWithFullProviders` e rotas.
- [ShiftContext.tsx](../../merchant-portal/src/core/shift/ShiftContext.tsx): `ShiftContext` exportado para uso em `PublicProviders`.
- [RestaurantRuntimeContext](../../merchant-portal/src/context/RestaurantRuntimeContext.tsx), [GlobalUIStateContext](../../merchant-portal/src/context/GlobalUIStateContext.tsx): contextos usados em ambas as árvores (demo na pública, reais na app).
