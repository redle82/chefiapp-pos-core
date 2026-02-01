# DESKTOP_DISTRIBUTION_CONTRACT — PWA e Electron (TPV / KDS)

**Status:** CANONICAL
**Tipo:** Contrato de distribuição — como empacotar TPV e KDS para desktop
**Local:** docs/architecture/DESKTOP_DISTRIBUTION_CONTRACT.md
**Hierarquia:** Subordinado a [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) e [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)

---

## Princípio

TPV e KDS rodam hoje no browser. Em fase seguinte podem ser distribuídos como **PWA** (instalável) ou **Electron** (app desktop). Este contrato define como empacotar, atualizar e versionar — sem alterar o fluxo de rotas (/op/tpv, /op/kds).

---

## Escopo

| Alvo | Rota canónica | Uso                                  |
| ---- | ------------- | ------------------------------------ |
| TPV  | /op/tpv       | Caixa; pode ser PWA ou Electron      |
| KDS  | /op/kds       | Cozinha; fullscreen; PWA ou Electron |

Landing, portal (/app) e web pública não são obrigatoriamente empacotados; foco em operação.

---

## PWA (Progressive Web App)

| Aspecto        | Regra                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Manifest       | manifest.json com nome, ícones, start_url = /op/tpv ou /op/kds (ou raiz com redirect). |
| Service Worker | Em produção; em DEV desativado (ver APPLICATION_BOOT_CONTRACT / dev stable mode).      |
| Instalação     | Utilizador instala a partir do browser; abre como janela standalone.                   |
| Atualizações   | Nova versão do frontend = refresh ou prompt de atualização; sem store.                 |

PWA não altera rotas; é a mesma app web acessível por /op/tpv e /op/kds, instalável.

---

## Electron (fase seguinte)

| Aspecto      | Regra                                                                                                            |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| URL interna  | App Electron carrega merchant-portal (localhost ou URL de deploy) nas rotas /op/tpv ou /op/kds.                  |
| Janela       | TPV: janela redimensionável; KDS: fullscreen, sem barra de título.                                               |
| Atualizações | Política de versão: auto-update (e.g. electron-updater) ou notificação de nova versão; não quebrar sessão ativa. |
| Versão       | Versão do app desktop alinhada a versão do frontend (tag, changelog).                                            |

Electron é shell; a lógica continua no frontend e no Core. Não duplicar lógica no processo main.

---

## Política de versão (recomendação)

| Canal            | Uso                                                                               |
| ---------------- | --------------------------------------------------------------------------------- |
| Produção         | Versão estável; atualizações com changelog; compatibilidade com Core em produção. |
| Piloto / staging | Versão de teste; pode exigir versão específica do Core.                           |

Não fazer deploy de frontend que exija Core mais novo sem aviso; documentar compatibilidade Core ↔ frontend.

---

## Referências

- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — rotas /op/tpv, /op/kds
- [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md) — Service Worker em DEV
- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — Desktop como “fase seguinte”

**Violação = alterar rota ou gate de /op/\* no desktop sem atualizar este contrato.**
