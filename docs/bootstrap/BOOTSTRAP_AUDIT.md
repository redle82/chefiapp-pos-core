# Auditoria: código vs contratos de Bootstrap

**Regra-mãe**

Nada na UI pode decidir estado por inferência. Toda decisão operacional ou pública deve consumir um Bootstrap State canónico, conforme definido em:

- [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md)
- [PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md](PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md)
- [BOOTSTRAP_MAP.md](BOOTSTRAP_MAP.md)

Este documento não altera código. Ele lista, de forma seca e acionável, onde o código já obedece aos contratos de bootstrap e onde ainda há gaps.

---

## 1. Restaurant OS — Auditoria

### Estado atual

**✅ Alinhados ao contrato**
(Consomem `useBootstrapState()` ou dependem exclusivamente dele para decisões de UI)

| Ficheiro                                                         | Estado   | Nota                                                         |
| ---------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| merchant-portal/src/pages/TPV/TPV.tsx                            | Alinhado | Decisões de operação e mensagens guiadas por Bootstrap State |
| merchant-portal/src/pages/MenuBuilder/MenuBuilderCore.tsx        | Alinhado | Fonte correta para estado de Core / dados / publicação       |
| merchant-portal/src/pages/Onboarding/sections/PublishSection.tsx | Alinhado | Publicação condicionada por estado canónico                  |
| merchant-portal/src/pages/BootstrapPage.tsx                      | Alinhado | Apenas representa o bootstrap; não infere                    |

**⚠️ Em falta**
(Usam `useRestaurantRuntime()` ou inferem estado localmente; deveriam consumir `useBootstrapState()` quando a UI depende de estado canónico)

| Ficheiro                                                       | Estado   | Nota                                                                                     |
| -------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx            | Em falta | KDS operacional ainda decide com runtime; deveria obedecer operationMode / blockingLevel |
| merchant-portal/src/pages/Backoffice/BackofficePage.tsx        | Em falta | Visibilidade e acessos podem depender de bootstrap, não apenas runtime                   |
| merchant-portal/src/pages/Dashboard/DashboardPortal.tsx        | Em falta | Dashboard pode inferir estado de Core / operação                                         |
| merchant-portal/src/ui/design-system/CoreUnavailableBanner.tsx | Em falta | Usa runtime.coreMode; deveria ler bootstrap.coreStatus por consistência                  |
| merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx            | Em falta | Wrapper do TPV; pode herdar decisões do TPV interno ou consumir bootstrap diretamente    |

**🔎 Componentes a classificar**
(Componentes que hoje usam apenas restaurant_id ou lista de módulos)

| Ficheiro                                                          | Classificação | Nota                                                                   |
| ----------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- |
| merchant-portal/src/components/operational/ModuleGate.tsx         | A classificar | Pode ser runtime-only ou exigir decisão de bootstrap dependendo do uso |
| merchant-portal/src/components/operational/RequireOperational.tsx | A classificar | Ver se bloqueios são puramente de permissão ou de estado operacional   |

---

## 2. Página Web Pública — Auditoria

### Situação geral

Atualmente não existe um `PublicRestaurantBootstrapState`, nem `PublicRestaurantContext` ou hook equivalente.

Todas as rotas públicas inferem estado a partir de:

- slug (URL)
- chamadas diretas à API
- estado local de loading/error
- em um caso, fallback via `RestaurantRuntimeContext`

Isso viola o contrato definido em [PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md](PUBLIC_RESTAURANT_BOOTSTRAP_CONTRACT.md).

### Rotas e ficheiros envolvidos

| Rota                         | Ficheiro                    | Observação                                                           |
| ---------------------------- | --------------------------- | -------------------------------------------------------------------- |
| /public/:slug                | PublicWebPage.tsx           | Usa slug + API; decide implicitamente existência, abertura e módulos |
| /public/:slug/mesa/:number   | TablePage.tsx               | Depende de params + dados carregados; sem estado público canónico    |
| /public/:slug/order/:orderId | CustomerOrderStatusView.tsx | Estado inferido do fetch do pedido                                   |
| /public/:slug/kds            | PublicKDS.tsx               | Não consome bootstrap público; depende de slug/dados                 |

### Contexto público atual

**merchant-portal/src/public/context/PublicMenuContext.tsx**

Expõe apenas:

- storeName
- categories
- products
- isLoading

Não expõe:

- exists
- visibility
- openStatus
- publicModules
- orderMode

Conclusão: o contexto público não implementa o contrato de bootstrap público.

---

## 3. Outros bootstraps (fora do âmbito)

Os seguintes bootstraps estão definidos no [BOOTSTRAP_MAP.md](BOOTSTRAP_MAP.md), mas não são auditados neste documento:

- Onboarding
- Sessão do utilizador
- Ambiente de execução
- Módulos de risco (Billing, Reset, etc.)
- Integrações externas
- Jobs / Workers
- Scripts críticos

Consultar o mapa para referência estrutural.

---

## 4. Conclusão

- O Restaurant OS já tem uma base correta de bootstrap, mas ainda possui telas e componentes que inferem estado via runtime.
- A página web pública não possui bootstrap canónico neste momento; todo o estado é implícito.

---

## 5. Próximos passos sugeridos

1. **Alinhar o Restaurant OS**
   Migrar os itens "Em falta" para consumo de `useBootstrapState()` onde houver decisão de UI dependente de estado canónico.

2. **Implementar o bootstrap público**
   Criar `PublicRestaurantBootstrapState` + contexto/hook e consumi-lo primeiro em PublicWebPage.tsx, depois nas rotas públicas derivadas.

---

Este ficheiro é um instrumento de decisão: ele mostra onde estamos e permite escolher conscientemente o próximo passo.
