# OPERATIONAL_INSTALLATION_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato geral (NON-CORE) — instalação e execução operacional em dispositivos dedicados
**Local:** docs/architecture/OPERATIONAL_INSTALLATION_CONTRACT.md
**Classificação:** Contratos Gerais; impacto financeiro direto: NÃO; escrita no Core: NÃO
**Hierarquia:** Subordinado a [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md). Referencia [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) e [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md).

---

## Definição

**Aplicação Instalada Dedicada** é o modo em que os módulos operacionais do ChefIApp (TPV, KDS, AppStaff) são executados exclusivamente como aplicações instaladas — nunca no navegador. Cada módulo operacional tem o seu tipo de aplicação dedicada:

| Módulo   | Aplicação         | Plataforma       | Browser |
| -------- | ----------------- | ---------------- | ------- |
| TPV      | Electron desktop  | macOS / Windows  | ❌      |
| KDS      | Electron desktop  | macOS / Windows  | ❌      |
| AppStaff | Expo/React Native | iOS / Android    | ❌      |
| Waiter   | Expo/React Native | iOS / Android    | ❌      |
| Admin    | Browser (SPA)     | Qualquer browser | ✅      |

Esta regra é **imutável** — ver [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md).

---

## O que NÃO é

| Não é                  | Significado                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| **PWA standalone**     | Não depende de manifest.json nem service workers para instalação operacional.    |
| **Web app no browser** | Os módulos operacionais são bloqueados no browser pelo BrowserBlockGuard.        |
| **App única**          | Cada módulo tem a sua aplicação dedicada; não existe um "app que contenha tudo". |

---

## Enforcement Frontend

O `BrowserBlockGuard` (layout route, React Router v6) bloqueia o acesso a rotas operacionais quando detetado um navegador comum (não Electron, não standalone, não ReactNativeWebView).

| Rota            | Guard                                     | Plataforma |
| --------------- | ----------------------------------------- | ---------- |
| `/op/tpv`       | `BrowserBlockGuard(desktop, "TPV")`       | Desktop    |
| `/op/kds`       | `BrowserBlockGuard(desktop, "KDS")`       | Desktop    |
| `/app/staff/*`  | `BrowserBlockGuard(mobile, "AppStaff")`   | Mobile     |
| `/app/waiter/*` | `BrowserBlockGuard(mobile, "Comandeiro")` | Mobile     |

Em modo DEV (`import.meta.env.DEV`), o guard é bypassed com um banner de aviso.

---

## Rotas instaláveis

| Rota            | Papel         | Dispositivo dedicado                                |
| --------------- | ------------- | --------------------------------------------------- |
| `/op/tpv`       | TPV (Caixa)   | Um computador com Electron = um papel de caixa.     |
| `/op/kds`       | KDS (Cozinha) | Um computador com Electron = um papel de cozinha.   |
| `/app/staff/*`  | AppStaff      | Um telemóvel com a app instalada = um staff member. |
| `/app/waiter/*` | Waiter        | Um telemóvel com a app instalada = um comandeiro.   |

---

## Provisioning

Cada dispositivo (desktop ou mobile) deve ser provisionado via QR:

1. O administrador abre **Admin → Sistema → Dispositivos** (`/admin/devices`)
2. Gera um código QR de instalação (token de uso único, expira em 5 min)
3. O dispositivo digitaliza o QR → chega a `/install?token=xxx`
4. O token é consumido → terminal registado em `gm_terminals`
5. O dispositivo persiste o `terminal_id` localmente
6. A aplicação instalada reconhece o terminal e opera nesse restaurante

---

## Pré-condições

As rotas operacionais só devem ser acessíveis quando:

| Pré-condição                            | Fonte                                                |
| --------------------------------------- | ---------------------------------------------------- |
| Aplicação instalada (não browser)       | `BrowserBlockGuard` — detecção de plataforma         |
| Restaurante publicado                   | `isPublished === true`                               |
| Billing ativo                           | `billingStatus` permite operação                     |
| Utilizador autenticado com role correta | Autenticação e RoleGate                              |
| Dispositivo provisionado                | `terminal_id` presente em localStorage / SecureStore |

---

## Comportamento esperado

| Comportamento           | Descrição                                                                     |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Fullscreen**          | A página operacional usa altura útil total (100vh); sem barra de navegador.   |
| **Dedicado**            | Cada app é dedicada a um módulo; sem navegação para fora da rota operacional. |
| **Bloqueio no browser** | Ecrã de bloqueio fullscreen com instruções de instalação.                     |
| **DEV bypass**          | Em desenvolvimento, o guard é bypassed para facilitar iteração.               |

---

## Responsabilidades

| Parte                  | Responsabilidade                                                        |
| ---------------------- | ----------------------------------------------------------------------- |
| **Electron (desktop)** | Shell para TPV e KDS; user-agent com "Electron"; auto-update.           |
| **Expo/RN (mobile)**   | App nativa para AppStaff e Waiter; ReactNativeWebView para detecção.    |
| **merchant-portal**    | Frontend com BrowserBlockGuard, provisioning flow, gates.               |
| **Admin (browser)**    | Painel de controlo; gestão de dispositivos, downloads, QR provisioning. |

---

## Referências

- [SYSTEM_RULE_DEVICE_ONLY.md](./SYSTEM_RULE_DEVICE_ONLY.md) — regra imutável de acesso
- [DESKTOP_DISTRIBUTION_CONTRACT.md](./DESKTOP_DISTRIBUTION_CONTRACT.md) — distribuição Electron
- [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) — rotas `/op/*`
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates published / operational
- `merchant-portal/src/components/operational/BrowserBlockGuard.tsx` — guard de bloqueio

**Violação = instalação ou execução operacional fora das regras acima.**
