---
title: DEVICE_CONTRACT
status: CANONICAL
type: Contrato geral — dispositivos operacionais
hierarchy:
  - docs/architecture/OPERATIONAL_INSTALLATION_CONTRACT.md
  - docs/contracts/TERMINAL_INSTALLATION_RITUAL.md
  - docs/operations/DEVICES_PROVISIONING.md
---

## 1. Definição

**Device** é qualquer superfície operacional ligada a um restaurante via terminal:

- Desktop: TPV, KDS (Electron)
- Mobile: AppStaff, Waiter (Expo/React Native)
- Web dedicada: ADMIN / BACKOFFICE / WEB (apenas controlo, nunca execução TPV/KDS/AppStaff)

Um device é sempre representado por um registo em `gm_terminals` e, opcionalmente,
por um token em `gm_device_install_tokens` durante o processo de pairing.

## 2. Identidade canónica

### 2.1. Tabela `gm_terminals`

Identidade mínima por device:

- `id` (`device_id`) — UUID, chave primária e identificador do terminal
- `restaurant_id` — UUID do restaurante
- `type` — `TPV | KDS | APPSTAFF | WAITER | WEB | BACKOFFICE | ADMIN`
- `name` — etiqueta humana (ex.: `TPV_BALCAO_01`, `KDS_COZINHA_01`)
- `registered_at` — quando foi criado
- `last_heartbeat_at` — último sinal de vida
- `last_seen_at` — última actividade observada
- `status` — `active | inactive | revoked`
- `metadata` — JSONB com campos livres:
  - `app_version` — versão da app (desktop/mobile/web)
  - `os` — `macos | windows | ios | android | web`
  - `runtime` — `electron | mobile | web`
  - qualquer outra telemetria operacional (userAgent, resolução, etc.)

### 2.2. Tabela `gm_device_install_tokens`

Tokens de instalação de uso único:

- `id` — UUID do token
- `restaurant_id` — restaurante alvo
- `token` — segredo único (32 bytes hex)
- `device_type` — mesmo domínio de `gm_terminals.type`
- `device_name` — sugestão de `name`
- `expires_at` / `consumed_at`
- `terminal_id` — `gm_terminals.id` criado ao consumir o token

### 2.3. Device Runtime

Cada device expõe também um runtime lógico:

- `runtime = "electron"` — TPV/KDS via ChefIApp Desktop
- `runtime = "mobile"` — AppStaff / Waiter nativo (Expo/RN)
- `runtime = "web"` — Admin/Backoffice/WEB em browser

O runtime é persistido em `gm_terminals.metadata.runtime` e deduzido pelo cliente
no momento do pairing.

## 3. Estados operacionais (provisioning_status)

`provisioning_status` é um estado **lógico** derivado de `gm_terminals` +
`gm_device_install_tokens` + heartbeats. Pode ser materializado como coluna no
futuro, mas o contrato já define a semântica:

- `UNPAIRED`
  - Não existe `gm_terminals` para aquele restaurante+tipo+identidade local
  - Nenhum token pendente relevante
- `PAIRING`
  - Token activo em `gm_device_install_tokens` (não expirado, `consumed_at IS NULL`)
- `PAIRED`
  - Token consumido → `gm_terminals` criado
  - Ainda **sem heartbeat recente** (device ainda não iniciou app operacional)
- `ACTIVE`
  - `gm_terminals.status = 'active'`
  - `last_heartbeat_at` recente (janela contratual, ex.: < 60s/120s)
- `REVOKED`
  - `gm_terminals.status = 'revoked'`

Mapeamento mínimo:

- `gm_terminals.status = 'revoked'` → `provisioning_status = REVOKED`
- Sem `gm_terminals` + token pendente → `PAIRING`
- `gm_terminals` existente + sem heartbeat recente → `PAIRED`
- `gm_terminals` + heartbeat recente → `ACTIVE`

## 4. Fluxo de pairing (QR/PIN)

Arquitectura unificada (`DEVICES_PROVISIONING.md`):

1. Admin em `/admin/devices` chama `create_device_install_token`
2. Token é mostrado como QR/PIN, com TTL curto (5–15 minutos)
3. Device abre `/install?token=…` (via PWA WebView, Electron ou mobile WebView)
4. Página `/install` chama `consume_device_install_token(p_token, p_device_meta)`
5. Core:
   - valida token
   - cria `gm_terminals` com `metadata` preenchido (incluindo `runtime`, `os`,
     `app_version` quando disponível)
   - marca token como consumido (`consumed_at`, `terminal_id`)
6. Cliente persiste:
   - `chefiapp_terminal_id`
   - `chefiapp_restaurant_id`
   - `chefiapp_terminal_type`
   - `chefiapp_terminal_name`
7. A app operacional passa a usar `device_heartbeat` periodicamente.

Tanto Desktop (Electron) quanto AppStaff Mobile usam **o mesmo** endpoint
`consume_device_install_token` e o mesmo contrato de metadados.

## 5. Heartbeat e saúde

Função `device_heartbeat(p_terminal_id, p_meta)`:

- Actualiza `last_heartbeat_at` e `last_seen_at`
- Agrega `metadata = metadata || p_meta`
- Regista linha em `gm_device_heartbeats`

Regras:

- Janela de `Online` é definida no contrato de leitura (ex.: 60s em
  `useTerminals`).
- Clientes devem incluir pelo menos:
  - `runtime`
  - `app_version`
  - `os`

## 6. RBAC operacional (resumo)

- **Admin (merchant-portal)**:
  - pode gerar tokens (`create_device_install_token`)
  - pode revogar terminals (`revoke_terminal`)
  - pode listar `gm_terminals` do seu restaurante
- **Devices (anon)**:
  - podem consumir token (`consume_device_install_token`) com o segredo
  - podem enviar heartbeats (`device_heartbeat`) para o seu `terminal_id`

Detalhes finos de RLS e roles vivem nos contratos de Core e migrações.

## 7. Pontos de integração

- **Admin / merchant-portal**
  - `features/admin/devices/AdminDevicesPage.tsx`
  - `features/admin/devices/api/devicesApi.ts`
  - `pages/InstallPage.tsx`
- **Runtime / Operational**
  - `core/terminal/useTerminals.ts`
  - `core/storage/installedDeviceStorage.ts`
  - Electron Desktop: `desktop-app/src/main.ts` (TerminalConfig + deep link)
- **Core / DB**
  - `docker-core/schema/migrations/20260303_device_install_tokens.sql`
  - `docker-core/schema/migrations/20260203_gm_terminals.sql`
  - `migrations/20260217_03_device_heartbeats_table.sql`

## 8. Invariantes

- Um `device_id` (`gm_terminals.id`) pertence a exactamente um `restaurant_id`.
- `device_type` em `gm_device_install_tokens` e `gm_terminals.type` partilham o
  mesmo domínio de valores.
- Um token só pode ser consumido uma vez; múltiplas tentativas devolvem
  `TOKEN_NOT_FOUND` ou `TOKEN_EXPIRED`.
- Rotas operacionais (`/op/tpv`, `/op/kds`, `/app/staff/*`) **nunca** são
  acedidas em browser comum; apenas em runtimes `electron` ou `mobile`.

