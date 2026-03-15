# Validação: rebuild + restart do Electron (main/preload)

Procedimento mínimo para garantir que o desktop está a usar o **main** e **preload** actualizados (redirecionamento Admin, `__CHEFIAPP_ELECTRON`).

---

## 1. Depende mesmo de rebuild + restart?

**Sim.** O processo Electron em execução carrega o `main.js` e o `preload.js` que existiam quando arrancou. Alterações no código (main.ts, preload.ts) só passam a valer depois de:

1. **Recompilar** o desktop-app (tsc → `dist-electron/main.js`, `dist-electron/preload.js`).
2. **Fechar por completo** o processo Electron actual.
3. **Abrir de novo** o desktop (para carregar os ficheiros recompilados).

Sem isso, o Electron continua a correr com o main/preload antigos e o redirecionamento Admin no main não existe nesse processo.

---

## 2. Comandos mínimos

**Na raiz do repositório:**

```bash
# 1) Fechar completamente o app desktop (Cmd+Q ou fechar a janela).
#    Se tiveres corrido com pnpm run dev:desktop, podes matar o processo no terminal (Ctrl+C).

# 2) Recompilar o desktop-app (main + preload).
cd desktop-app && pnpm run build && cd ..

# 3) Reiniciar o desktop (usa o script que já faz build + electron).
pnpm run dev:desktop
```

Ou, se preferires fazer tudo numa sequência (com portal já a correr noutro terminal):

```bash
cd desktop-app && pnpm run build && cd .. && pnpm run dev:desktop
```

O `pnpm run dev:desktop` inicia o portal na 5175 (se estiver livre) e depois corre `pnpm run build` dentro de `desktop-app` e `electron .` — por isso um único restart com `dev:desktop` já garante build fresco + processo novo.

---

## 3. Resultado esperado no terminal (main process)

Quando o **main** estiver actualizado e detectar tentativa de abrir Admin:

- Ao **navegar** para uma rota admin dentro da janela, deve aparecer algo como:
  - `[boot] admin route attempted in operational window; opening externally`
  - `[boot] forced back to` com `reason: "admin-in-main-window"`

- Se a janela **acabar de carregar** já em URL admin (ex.: restauro de estado), deve aparecer:
  - `[boot] admin URL after load — forcing back to operational route`
  - `[boot] forced back to` com `reason: "did-finish-load-admin-check"`

Se **não** vires nenhuma destas mensagens ao tentar abrir “Página web do restaurante” / Ajustes do Núcleo, o processo em execução ainda está com main antigo (não reiniciaste ou o build não correu).

---

## 4. Resultado esperado na janela do desktop

Com a correção do main a funcionar:

- **Não** deves conseguir manter a página “Página web do restaurante” aberta na janela do desktop.
- A janela deve **voltar** para a superfície operacional (`/op/tpv` ou `/op/kds`) e, opcionalmente, o Admin abre no **browser do sistema** (comportamento do `setWindowOpenHandler` / `did-navigate-in-page`).

Se a página administrativa **permanecer** visível na janela do desktop após um restart real (passos 2 e 3 feitos), então o próximo bloqueio é outro (ex.: evento de navegação não disparar, URL em formato não previsto) e deve ser identificado com base nos logs do terminal e no URL efectivo.

---

## 5. Critério de prova (resumo)

| O quê | Esperado |
|------|----------|
| **Terminal (Electron)** | Aparecer `[boot] admin route attempted` ou `[boot] admin URL after load — forcing back` (e `[boot] forced back to`) quando tentas abrir o caminho que leva a “Página web do restaurante”. |
| **Janela do desktop** | A página administrativa **não** permanece aberta; a app volta para TPV ou KDS. |

Ref.: alterações em `desktop-app/src/main.ts` (did-finish-load, extractPathnameFromUrl, did-navigate-in-page) e `desktop-app/src/preload.ts` (`__CHEFIAPP_ELECTRON`).
