# Contrato: Ritual de Instalação de Terminais e Terminal como Objeto Vivo

**Propósito:** Definir o ritual de instalação de TPV/KDS em `/app/install`, o conceito de "terminal como objeto vivo" (nome + estado Online/Offline) e quando o dashboard mostra lista de terminais vs "Não instalado" + CTA.

**Referências:** [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](OPERATIONAL_DASHBOARD_V2_CONTRACT.md), [CORE_CONTRACT_INDEX.md](../architecture/CORE_CONTRACT_INDEX.md).

---

## 1. Ritual (passos em `/app/install`)

1. Utilizador escolhe **TPV** ou **KDS** e opcionalmente o **nome do dispositivo** (ex.: TPV_BALCAO_01, KDS_COZINHA_01).
2. Requer **restaurante no runtime** (login e restaurante seleccionado).
3. Cria registo em **gm_equipment** (restaurant_id, name, kind TPV|KDS, is_active) e chama `insertInstalledModule` no Core.
4. Guarda identidade local em **installedDeviceStorage** (device_id, restaurant_id, module_id, device_name) para este browser — o dispositivo não volta a perguntar o restaurante.

**Rota operacional:** `/app/install` é rota **operacional** (não onboarding): `requiresRestaurant = true`, `allowedInOperationalOS = true`, nunca redirecionar para Landing. Ver [OPERATIONAL_NAVIGATION_SOVEREIGNTY.md](OPERATIONAL_NAVIGATION_SOVEREIGNTY.md).

**Objeto vivo:** um terminal é um equipamento com **nome** + **estado** (Online = heartbeat recente ou "este browser é este dispositivo"; Offline = sem heartbeat recente e não é o dispositivo local).

---

## 2. Quando o dashboard mostra

- **Sem equipamento:** não há registos em gm_equipment para o restaurant_id **e** não existe dispositivo instalado localmente (getInstalledDevice) para o mesmo restaurant_id. Mostrar "TPV — Não instalado" / "KDS — Não instalado" + CTA "Instalar terminal" → `/app/install`.
- **Com equipamento:** existe pelo menos um registo em gm_equipment para o restaurant_id **ou** getInstalledDevice() existe e restaurant_id coincide com o runtime. Mostrar lista de terminais: "TPV [nome]" / "KDS [nome]" com estado **Online** (se este browser for esse dispositivo instalado, ou se houver heartbeat recente em gm_terminals) ou **Offline**, e link para `/op/tpv` ou `/op/kds` conforme o tipo.

---

## 3. Fontes de dados

| Dado | Fonte |
|------|--------|
| Lista de equipamento por restaurante | **gm_equipment** (id, name, kind, is_active) filtrado por restaurant_id. |
| Dispositivo instalado neste browser | **installedDeviceStorage** — getInstalledDevice() (device_id, restaurant_id, module_id, device_name). |
| Estado Online/Offline | **gm_terminals** — last_heartbeat_at; Online = heartbeat nos últimos N segundos (ex.: 60) ou "este browser é este dispositivo". |

---

## 4. Feature-flag (opcional)

- **TERMINAL_INSTALLATION_TRACK** (config): quando `false`, o dashboard pode esconder a lista real e mostrar apenas "Não instalado" + CTA (comportamento Gap A). Quando `true`, usar lista de gm_equipment + estado de gm_terminals para mostrar terminais com nome e Online/Offline.

---

## 5. Instalação PWA (FASE 2.1)

Modo de instalação oficial para TPV e KDS: **PWA** (um PWA único; atalhos para `/op/tpv` e `/op/kds`).

- **URL fixa:** Cada terminal abre sempre `/op/tpv` ou `/op/kds` (bookmark ou atalho PWA criado a partir dessa página).
- **Modo fullscreen:** O layout operacional ([OperationalFullscreenWrapper](../../merchant-portal/src/components/operational/OperationalFullscreenWrapper.tsx)) garante 100vh, viewport e meta apple-mobile-web-app; sem sidebar/header de dashboard na superfície.
- **Ícone direto:** Para ícone que abre direto no TPV (ou KDS), o utilizador pode "Adicionar ao ecrã" a partir de `/op/tpv` (ou `/op/kds`); muitos browsers usam a URL atual como contexto do atalho.
- **Checklist de validação:** Antes de dar o terminal por "instalado", cumprir a secção 6 abaixo.

---

## 6. Checklist de validação por terminal

Checklist mínimo por terminal (TPV e KDS). Sem passar por isto o terminal não é considerado instalado.

| # | Item | TPV | KDS |
|---|------|-----|-----|
| 1 | **URL fixa** — Dispositivo abre sempre `/op/tpv` ou `/op/kds` (bookmark ou PWA). | [ ] | [ ] |
| 2 | **Modo fullscreen** — Layout ocupa 100vh; sem sidebar/header de dashboard na superfície. | [ ] | [ ] |
| 3 | **Teste de reconnect** — Desligar rede → agir na superfície → religar; verificar que volta a carregar (ou documentar comportamento esperado). | [ ] | [ ] |
| 4 | **Teste de reload** — F5 na página da superfície; sessão/identidade instalada mantém-se (installedDeviceStorage); não redireciona para login/install se já instalado. | [ ] | [ ] |
| 5 | **Teste de perda de foco** — Abrir outra janela e voltar à superfície; não perde estado crítico (ex.: rascunho no TPV, lista no KDS). | [ ] | [ ] |

---

Última atualização: Contrato Ritual de Instalação de Terminais; alinhado ao plano A+B (ritual + terminais como objetos vivos).
