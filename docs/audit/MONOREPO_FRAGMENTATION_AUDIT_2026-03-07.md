# Auditoria de Fragmentacao do Monorepo

Data: 2026-03-07
Branch: feat/fase2-electron-desktop-shell
Escopo: peso em disco local (workspace de desenvolvimento), fragmentacao operacional e redundancia entre subapps.

## Resumo Executivo

- Tamanho total do workspace: 4.0G
- O peso nao indica mais um problema de higiene grave de repositorio.
- O principal custo atual e operacional de desenvolvimento (mobile/native + dependencias + artefatos locais).

### Execucao Real da Fase 3 (2026-03-07)

Acao executada no workspace local:

- Removido `mobile-app/ios/Pods`
- Removido `mobile-app/android/app/.cxx`
- Removidos `merchant-portal/public/downloads/*.dmg`

Resultado medido apos limpeza:

- Workspace: `4.0G` -> `2.6G`
- Recuperacao total observada: `~1.4G`

Quadro executivo de recuperacao por acao:

| Acao                                             |   Before |    After | Recuperado |
| ------------------------------------------------ | -------: | -------: | ---------: |
| Remover `mobile-app/ios/Pods`                    |     927M |       0B |       927M |
| Remover `mobile-app/android/app/.cxx`            |     367M |       0B |       367M |
| Remover `merchant-portal/public/downloads/*.dmg` |     210M |       0B |       210M |
| **Total estimado por soma dos alvos**            |          |          |  **~1.5G** |
| **Total observado no workspace**                 | **4.0G** | **2.6G** |  **~1.4G** |

Nota: diferencas entre soma dos alvos e delta global sao esperadas por arredondamento do `du -sh`.

### Snapshot Atual dos Blocos Fase 4 (pos-limpeza)

Pesos medidos para os blocos priorizados da Fase 4:

- `merchant-portal`: 189M
- `desktop-app`: 28M
- `mobile-app`: 12M
- `core-engine`: 536K
- `integration-gateway`: 500K
- `server`: 100K
- `fiscal-modules`: 100K
- `core-design-system`: 48K
- `billing-core`: 4K

Leitura: apos remover artefatos locais, a complexidade dominante deixa de ser disco e passa a ser fronteira de dominio e ownership.

Principais concentradores de tamanho:

- `node_modules`: 1.9G
- `mobile-app`: 1.3G
- `mobile-app/ios/Pods`: 927M
- `mobile-app/android/app/.cxx`: 367M
- `merchant-portal`: 399M
- `merchant-portal/public/downloads/*.dmg`: ~210M (105M + 105M)
- `.venv`: 161M

## Evidencias de Fragmentacao

1. Dependencias instaladas em mais de um contexto (`node_modules` em varias subapps):

- `node_modules`: 1.9G
- `merchant-portal/node_modules`: 79M
- `testsprite_uiux/node_modules`: 16M
- `mobile-app/node_modules`: 6.9M
- `desktop-app/node_modules`: 4.6M

1. Ferramentas/lockfiles mistos:

- Workspace usa `pnpm-lock.yaml` (raiz).
- Existe `mobile-app/package-lock.json` (498K), sinal de ciclo paralelo via npm em subapp.

1. Caches de toolchain nativa nao versionados, mas pesados em dev:

- `mobile-app/ios/Pods`: 927M
- `mobile-app/android/app/.cxx`: 367M

## Matriz: Modulo -> Funcao -> Dependencias -> Peso -> Redundancia -> Decisao

| Modulo                             | Funcao principal                          | Dependencias pesadas / sinais                |           Peso | Redundancia                                 | Decisao                                                                  |
| ---------------------------------- | ----------------------------------------- | -------------------------------------------- | -------------: | ------------------------------------------- | ------------------------------------------------------------------------ |
| `mobile-app`                       | App mobile (Expo/React Native)            | Toolchain iOS/Android local (`Pods`, `.cxx`) |           1.3G | Baixa em codigo, alta em artefatos de build | Manter modulo; limpar artefatos quando iOS/Android nao estiverem ativos  |
| `mobile-app/ios/Pods`              | Dependencias nativas iOS                  | CocoaPods                                    |           927M | N/A (artefato local)                        | Remover quando sem ciclo iOS ativo; recriar sob demanda (`pod install`)  |
| `mobile-app/android/app/.cxx`      | Artefatos de compilacao NDK/CMake         | RN native build outputs                      |           367M | N/A (cache/build)                           | Remover em limpeza periodica; recria no proximo build                    |
| `node_modules` (raiz)              | Dependencias compartilhadas workspace     | Electron, RN, Expo e libs web                |           1.9G | Parcialmente inevitavel em monorepo         | Manter; reduzir via governanca de deps e podas de apps/skills nao usados |
| `merchant-portal`                  | Web app principal (portal + AppStaff web) | Node deps e assets locais                    |           399M | Media com stack web do monorepo             | Manter; auditar assets e downloads locais                                |
| `merchant-portal/public/downloads` | Distribuicao local de instaladores        | `ChefIApp-Desktop*.dmg`                      |           210M | Pode existir tambem em release externa      | Mover para storage/release-only local ou limpar em dev                   |
| `desktop-app`                      | Shell Electron TPV/KDS                    | deps locais moderadas                        |            28M | Baixa                                       | Manter                                                                   |
| `.venv`                            | Ambiente Python local auxiliar            | pip vendor bins                              |           161M | Possivel sobreposicao de tooling            | Manter se em uso; remover se fluxo Python nao estiver ativo              |
| `testsprite_uiux`                  | Ferramentas/artefatos de auditoria UI     | node_modules local                           | 38M (16M deps) | Potencialmente sazonal                      | Avaliar arquivar/isolamento fora do workspace principal                  |

## Sobreposicao de Dependencias entre Subapps (package.json)

A sobreposicao declarada entre `mobile-app`, `merchant-portal`, `desktop-app` e `integration-gateway` e baixa/moderada:

- Total de dependencias em sobreposicao (>=2 apps): 14
- `desktop-app` aparece quase isolado (5 deps totais, 5 unicas)

Dependencias em comum mais relevantes:

- `eslint`, `typescript`, `react`, `react-dom`, `buffer`

Leitura: a inflacao principal nao vem de duplicacao massiva de `package.json`; vem de toolchains nativas e do volume total combinado do monorepo.

## Backlog de Corte (Impacto x Risco)

1. Alto impacto, baixo risco

- Remover `mobile-app/ios/Pods` quando iOS nao estiver ativo.
- Remover `mobile-app/android/app/.cxx` quando Android nativo nao estiver ativo.
- Limpar `merchant-portal/public/downloads/*.dmg` do workspace local quando nao necessario.

1. Medio impacto, medio risco

- Padronizar gerenciador de pacote por app (evitar ciclo paralelo `pnpm` + `npm`).
- Revisar subapps sazonais (`testsprite_uiux`, outras pastas auxiliares) para isolamento/arquivo.

1. Estrutural (arquitetura/governanca)

- Definir fronteiras formais: core x produto ativo x legado.
- Catalogar modulo morto e assets sem referenciamento.
- Criar politica de limpeza automatica de artefatos nativos (script/CI local).

## Meta Realista de Tamanho

Para este monorepo (mobile + electron + web + backend), uma faixa saudavel de uso local tende a ficar em ~2.5G a ~3.2G sem ciclo iOS ativo.

Reducao estimada imediata (sem refatoracao estrutural):

- `ios/Pods` (~927M) + `.cxx` (~367M) + DMGs (~210M) = ~1.5G recuperavel
- `4.0G` -> potencial imediato proximo de `2.5G` (variando com reinstalacao de deps/caches)

## Proposta de Fase 3 e Fase 4

Fase 3 (emagrecimento fino, operacional):

1. Limpeza controlada de Pods/.cxx/DMGs.
1. Medicao antes/depois com snapshot versionado em `docs/audit/`.

Fase 4 (fragmentacao):

1. Mapa formal de subapps: ownership, criticidade, SLA e estado (ativo/legado).
1. Matriz de redundancia de libs/config/pipelines por dominio.
1. Decisao por modulo: manter, consolidar, arquivar ou extrair.

## Artefato Fase 4

Matriz completa por subapp (com colunas de owner, status, dependencias distintivas, sinais de redundancia, acoplamentos, risco de remocao, decisao e prioridade):

- `docs/audit/MONOREPO_PHASE4_GOVERNANCE_MATRIX_2026-03-07.md`

Desdobramentos operacionais da Fase 4:

- `docs/audit/MONOREPO_P0_EXECUTION_PLAN_7_DAYS_2026-03-07.md`
- `docs/audit/MONOREPO_MODULE_BACKLOG_LINEAR_READY_2026-03-07.md`
