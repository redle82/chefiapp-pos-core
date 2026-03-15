# Auditoria forense — runtime local e worktree (localhost:5175)

**Data:** 2025-03-15  
**Objetivo:** Provar em que árvore o Cursor edita, qual processo serve a 5175, e se há divergência entre “código editado” e “UI renderizada”.

---

## 1. Árvore / worktree ativa

| Comando | Resultado |
|--------|-----------|
| `pwd` | `/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core` |
| `git rev-parse --show-toplevel` | `/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core` |
| `git branch --show-current` | `main` |
| `git rev-parse HEAD` | `1bb088e5d9a9d82910404ce79d060ccfb715b1c7` |
| `git worktree list` | Ver abaixo |

```
/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core  1bb088e5 [main]
/private/tmp/chefiapp-foundation-ws1                        84159b9c [foundation/ws1-security-rls] prunable
/private/tmp/chefiapp-foundation-ws2                        c9d8068f [foundation/ws2-state-durability] prunable
```

- **Conclusão:** O Cursor está a trabalhar na worktree **principal** (raiz do repo, branch `main`). As outras duas worktrees estão em `/private/tmp/` e têm branches diferentes (`foundation/ws1-*`, `foundation/ws2-*`); não contêm o merchant-portal como foco — são clones do mesmo repo noutros diretórios.
- **merchant-portal e desktop-app** existem apenas na worktree principal (raiz).

---

## 2. Processo que serve a porta 5175

| Comando | Resultado |
|--------|-----------|
| `lsof -nP -iTCP:5175 -sTCP:LISTEN` | `node` **PID 90617**, user `goldmonkey` |
| `lsof -p 90617` (cwd) | **cwd** = `.../chefiapp-pos-core/merchant-portal` |

Linha relevante do `lsof`:

```
node    90617 goldmonkey  cwd      DIR   ...  /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal
```

- **Conclusão:** O processo que escuta em **localhost:5175** foi iniciado a partir do diretório **merchant-portal** da **mesma árvore** em que o Cursor está a editar. Não há outro worktree a servir a 5175.

---

## 3. Ficheiros realmente alterados (nesta árvore)

- `git status --short` e `git diff --name-only` mostram dezenas de ficheiros modificados (não commitados).
- Entre eles, os que interessam para a UI de TPV/módulos:

| Ficheiro | Alterado? |
|----------|-----------|
| `merchant-portal/src/features/admin/modules/pages/ModulesPage.tsx` | Sim (M) |
| `merchant-portal/src/features/admin/devices/AdminDevicesPage.tsx` | Sim (M) |
| `merchant-portal/src/features/admin/devices/AdminTPVTerminalsPage.tsx` | Sim (M) |
| `merchant-portal/src/features/admin/devices/DesktopPairingSection.tsx` | Sim (M) |
| `merchant-portal/src/features/admin/modules/components/ModuleCard.tsx` | Sim (M) |
| `merchant-portal/src/features/admin/modules/data/modulesDefinitions.ts` | Sim (M) |

**Conteúdo em disco (prova de que as alterações estão presentes):**

- **AdminTPVTerminalsPage.tsx** (linhas 125–134): contém  
  - `data-chefiapp-tpv-mother="true"` e `data-runtime-page="AdminTPVTerminalsPage"`  
  - badge `TPV_RUNTIME_V2`  
  - título "TPV — Tela oficial"  
  - parágrafo com `[FLUXO_TPV_MÃE_V2]` e texto do fluxo em 5 passos.
- **DesktopPairingSection.tsx**: bloco `data-block="pairing-tpv-redirect-v2"` e link "Ir para página TPV" para `/admin/devices/tpv`.
- **ModulesPage.tsx**: comentários e lógica para "Ir para TPV" → `/admin/devices/tpv`, label único TPV.

Ou seja: os ficheiros que alimentam a rota `/admin/devices/tpv` **já têm** as alterações no disco.

---

## 4. Marcadores V3 vs código

Pedido: procurar `MODULES_RUNTIME_V3`, `DEVICES_RUNTIME_V3`, `TPV_RUNTIME_V3`, `CARD_TPV_RUNTIME_V3`, `DEVICES_TPV_BLOCK_RUNTIME_V3`, `TPV_MOTHER_RUNTIME_V3`.

- **grep em `merchant-portal/src`:** **nenhuma ocorrência** dessas strings exatas.
- No código existem variantes **V2**: `TPV_RUNTIME_V2`, `[FLUXO_TPV_MÃE_V2]`, `[PAIRING_TPV_REDIRECT_V2]`, `fluxo-tpv-mae-v2`, `pairing-tpv-redirect-v2`.

Conclusão: os marcadores que o utilizador pediu (V3) **não existem** no código; as alterações usam nomenclatura **V2**.

---

## 5. Rota que renderiza a página TPV

- **Rota:** `/admin/devices/tpv`
- **Componente:** `AdminTPVTerminalsPage`
- **Definida em:**
  - `merchant-portal/src/routes/modules/AdminRoutes.tsx` (import direto)
  - `merchant-portal/src/routes/OperationalRoutes.tsx` (lazy load do mesmo módulo)
- O componente usado é **sempre** o de `merchant-portal/src/features/admin/devices/AdminTPVTerminalsPage.tsx`, que **no disco** já tem o novo título, badge e fluxo.

---

## 6. Divergência encontrada (ou não)

- **Worktree:** Não há divergência. Uma única árvore (raiz, `main`) contém o merchant-portal; o processo na 5175 usa essa mesma árvore (cwd = `.../chefiapp-pos-core/merchant-portal`).
- **Ficheiros:** Não há divergência. Os ficheiros editados estão na mesma árvore e o seu conteúdo em disco inclui as alterações descritas.
- **O que pode explicar a “UI antiga” no browser:**
  1. **Cache do browser** (página ou assets em cache).
  2. **Servidor Vite** iniciado antes das alterações e HMR não aplicado a esses ficheiros (ou falha de HMR).
  3. **Service Worker** (a consola da captura menciona limpeza de SW; noutras sessões o SW pode ter servido cache).

Não foi encontrada prova de que o processo 5175 esteja a ler outra pasta ou outro branch.

---

## 7. Causa raiz única (inferência)

Dado que:
- o processo 5175 usa **esta** árvore,
- e os ficheiros nesta árvore **já contêm** o novo texto e os data-attributes,

a causa raiz mais plausível para a UI antiga é **runtime/cache**: o browser ou o servidor de desenvolvimento a servir uma versão em cache do bundle/componente, e não o estado atual do disco.

---

## 8. Próximo passo único

1. **Reiniciar o servidor de desenvolvimento** que está na porta 5175 (matar o processo 90617 e iniciar de novo a partir da raiz do repo, por exemplo `pnpm --filter merchant-portal run dev`).
2. **Hard refresh no browser** na página `http://localhost:5175/admin/devices/tpv` (Ctrl+Shift+R ou Cmd+Shift+R), ou abrir em aba anónima.
3. **Verificar na UI:** presença do badge "TPV_RUNTIME_V2", título "TPV — Tela oficial" e do parágrafo com "[FLUXO_TPV_MÃE_V2]". Se aparecerem, fica provado que árvore = processo = código = UI.

---

## Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| Em que árvore está o Cursor? | `/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core`, branch `main`. |
| O processo 5175 usa outra pasta? | Não. cwd = `.../chefiapp-pos-core/merchant-portal` (mesma árvore). |
| Os ficheiros editados estão nesta árvore? | Sim. E o conteúdo em disco já inclui as alterações (título, badge, fluxo, data-attributes). |
| Existem marcadores V3 no código? | Não. Existem apenas variantes V2. |
| Divergência worktree/processo/ficheiro? | Não encontrada. |
| Causa raiz provável da “UI antiga”? | Cache do browser ou do servidor Vite / HMR. |
| Próximo passo único | Reiniciar o dev server, hard refresh, confirmar na UI os novos textos e atributos. |
