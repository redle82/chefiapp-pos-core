# Checklist de implementação — Códigos + Device Pairing (sem quebrar baseline)

**Tipo:** Guia executável e critérios de pronto  
**Contrato:** [CODE_AND_DEVICE_PAIRING_CONTRACT.md](../architecture/CODE_AND_DEVICE_PAIRING_CONTRACT.md)  
**Baseline intocável:** [APPSTAFF_BASELINE_CONSOLIDATED.md](../architecture/APPSTAFF_BASELINE_CONSOLIDATED.md)

---

## Regras sagradas (não violar)

- **NÃO mexer no baseline:** AppStaff único; role vem da sessão/contrato/invite; nunca URL; rotas e fluxo de entrada não mudam.
- **Remover qualquer role derivado do texto do código** (ex.: `deriveRoleFromCode`) no demo.
- **/admin NÃO vira launcher operacional.**
- **Nenhuma nova rota operacional.** Device pairing vive na página já existente de gestão de dispositivos.

---

## 0) Auditoria rápida (antes de mexer)

**Comandos / buscas:**

1. Lógica de role por texto:
   - `grep`: `deriveRoleFromCode` `roleFromCode` `parseRole` `code.includes` `split('-')` em StaffContext e connect views.
2. Uso de `?role=` fora do debug guard:
   - `grep`: `role=` e confirmar que só existe dentro de `CONFIG.ALLOW_STAFF_ROLE_QUERY && isDebugMode()`.

**Critério de pronto (step 0):**

- [ ] Lista de pontos onde role é derivado do texto do código **deve virar 0 após as mudanças**.

---

## 1) Contrato canónico

**Criar:** `docs/architecture/CODE_AND_DEVICE_PAIRING_CONTRACT.md`

**Conteúdo obrigatório:**

- **A)** Restaurant Master Code (setup/admin).
- **B)** Operator Invite Code (inviteId; role vem do invite).
- **C)** Device Pairing PIN (4–6 dígitos; 60s; vira deviceId + deviceSecret).
- Regras de segurança: expiração, rate limit, tentativas, revogação.
- Referência a [DEVICE_TURN_SHIFT_TASK_CONTRACT.md](../architecture/DEVICE_TURN_SHIFT_TASK_CONTRACT.md).

**Critério de pronto:**

- [ ] Contrato existe e está referenciado (se houver índice de contratos, adicionar link).

---

## 2) Módulo connectByCode (sem criar rota)

**Criar:**

- `merchant-portal/src/features/auth/connectByCode/connectByCode.ts`
- `merchant-portal/src/features/auth/connectByCode/types.ts` (opcional)

**API:**

```ts
connectByCode(
  code: string,
  ctx?: { deviceId?: string; restaurantHint?: string }
): Promise<ConnectByCodeResult>
```

**Tipos:**

```ts
type ConnectByCodeResult = {
  success: boolean;
  operationalContract?: OperationalContract;
  resolvedRole?: StaffRole;
  roleSource: 'invite' | 'contract' | 'session' | null;
  message?: string;
};
```

**Implementação:**

- **Produção:** usar `active_invites` (code → invite → restaurant_id + role_granted). Mover lógica existente para dentro de `connectByCode`. Retornar `resolvedRole = invite.role_granted` e `roleSource = 'invite'`.
- **Demo/mock:**
  - **PROIBIDO:** `deriveRoleFromCode(code)`.
  - Em vez disso: simular “active_invites” com tabela (ex.: `DEMO_INVITES` ou lookup por código → role no registo). O role vem do **registo** (ex.: `DEMO_INVITES[code].roleGranted`), não do parsing do texto.
  - (Opcional) parse `CHEF-SLUG-KIND-CHECK-SHORT` só para validar formato/checksum, sem extrair role.

**Critério de pronto:**

- [ ] `connectByCode` retorna `roleSource = 'invite'` em demo e prod (quando for invite).
- [ ] Nenhuma parte do sistema decide role lendo texto do `code`.

---

## 3) Integrar connectByCode no StaffContext (remover deriveRoleFromCode)

**Alterar:** `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`

**Mudanças obrigatórias:**

1. Substituir `joinRemoteOperation(code)` / `joinRemoteOperationHelper`:
   - Chamar `connectByCode(code, { restaurantHint: <demoRestaurantId se existir> })`.
   - Se success: `setOperationalContract(result.operationalContract)`, `setActiveRole(result.resolvedRole)`, `setTabIsolated("staff_role", result.resolvedRole)`.
   - Se falhar: set error message.
2. Remover completamente: `deriveRoleFromCode` e qualquer atribuição do tipo `role = code.includes(...)` / `split` / `substring`.

**Critério de pronto:**

- [ ] `grep` por `deriveRoleFromCode` retorna **0 ocorrências**.
- [ ] Entrar com código válido no demo ainda funciona e entra no papel correto, decidido via “invite mock”.

---

## 4) Device Pairing MVP (local-first)

**Tipos (local coerente):**

- Preferência: `merchant-portal/src/features/admin/devices/devicePairing.ts`
- Alternativa: `merchant-portal/src/features/auth/connectByCode/devicePairing.ts`

**Tipos:**

- `PairingRequest`: `{ pairingPin, expiresAt, restaurantId, deviceType?, assignedRole? }`
- `PairingResult`: `{ deviceId, deviceSecret, restaurantId, deviceType, assignedRole? }`
- `DeviceIdentity`: `{ deviceId, deviceSecret, type, assignedRole?, restaurantId }`

**Storage MVP (localStorage):**

- Shared (admin ↔ device demo): key request (ex.: `chefiapp_pairing_request_${restaurantId}` ou um activo global); key devices list (ex.: `chefiapp_admin_devices_${restaurantId}` ou `chefiapp_devices_list`).
- Local (no device): key identity (ex.: `chefiapp_device_identity` ou `chefiapp_paired_device_identity`).

**Funções:**

- Gerar PIN (admin): pin 4–6 dígitos, `expiresAt = Date.now() + 60_000`, persistir em storage shared.
- `pairLocal(restaurantId?, pin, deviceType?)` ou `pairLocal(pin)`: ler PairingRequest, validar pin e expiresAt, gerar deviceId + deviceSecret, salvar DeviceIdentity local, actualizar lista de dispositivos no storage shared (adicionar/actualizar entrada com lastHeartbeat).
- `startHeartbeat(deviceId)`: setInterval (ex.: 10s ou 30s) a actualizar lastHeartbeat no storage shared.

**Critério de pronto:**

- [ ] Admin gera PIN; device pareia com PIN dentro de 60s; admin passa a ver dispositivo “online” com lastHeartbeat a actualizar.

---

## 5) Admin UI — “Gerar PIN” na Gestão de Dispositivos (sem nova rota)

**Local:** Página já existente de dispositivos (rota `/admin/config/dispositivos` ou equivalente).

**Adicionar:**

- Secção “Vincular dispositivo”.
- Botão “Gerar PIN”.
- Mostrar PIN + countdown 60s.
- Selector deviceType (tpv/kds) opcional.
- **NÃO** adicionar botão que abra AppStaff/TPV/KDS.

**Critério de pronto:**

- [ ] Clicar gera PIN e mostra countdown.
- [ ] (Opcional) Refresh mantém request até expirar.

---

## 6) Operacional (TPV/KDS) — Tela “Vincular dispositivo”

**Sem criar rota nova:**

- Se DeviceIdentity **não** existe no storage local: renderizar gate antes do TPV/KDS (input PIN + botão “Vincular”).
- Ao vincular: salvar identity, iniciar heartbeat, seguir fluxo actual (TPV ou KDS).

**Critério de pronto:**

- [ ] Dispositivo sem identity vê “Vincular”.
- [ ] Dispositivo com identity entra normal no TPV/KDS.

---

## 7) Testes manuais (checklist final)

**Staff / Owner no demo:**

- [ ] Entrar com código → connectByCode → roleSource = 'invite' → entra no AppStaff.
- [ ] Confirmar que role NÃO veio do texto (ex.: log no connectByCode só em debug).

**Device pairing:**

- [ ] Admin gera PIN (60s).
- [ ] Device digita PIN dentro do tempo → pareia → admin vê device online.
- [ ] Esperar 30s e ver lastHeartbeat mudar.

**Segurança básica:**

- [ ] PIN expirado falha.
- [ ] PIN errado falha.
- [ ] (Opcional) Rate limit: bloquear após 5 tentativas em 60s.

---

## Entrega

- Código implementado conforme acima.
- Comentários **TODO:** storage seguro do deviceSecret (Keychain/Keystore) no futuro.
- **Zero regressões no baseline:** rotas, bottom bar e entrada do AppStaff intactos.

---

## Nota estratégica

- **Invite** = “chave do operador”.
- **Pairing PIN** = “chave de parear o terminal”.
- **deviceSecret** = “imobilizador/ignição” (LastApp feeling).

Quando o backend real entrar, trocar o storage shared por tabela (Supabase/Firebase) e manter a UX idêntica.

---

## Mapa de aceitação (10 asserts para PR)

Usar como checklist de regressão em PRs que toquem em códigos, device pairing ou AppStaff.

1. **Nenhum `deriveRoleFromCode`** no repositório (grep retorna 0).
2. **Role nunca do texto do código:** toda atribuição de role em fluxo de “inserir código” vem de `connectByCodeResult.resolvedRole` (invite/contract), nunca de parse do string.
3. **`?role=` só com guard:** uso de query `role=` apenas onde `CONFIG.ALLOW_STAFF_ROLE_QUERY && isDebugMode()`.
4. **connectByCode é o ponto único:** `joinRemoteOperation` chama apenas `connectByCode`; não existe lógica duplicada de active_invites em StaffContext.
5. **Contrato existe:** `docs/architecture/CODE_AND_DEVICE_PAIRING_CONTRACT.md` existe e descreve Master / Invite / Device PIN.
6. **Admin “Gerar PIN” na página existente:** botão e countdown em `/admin/config/dispositivos` (ou equivalente); nenhuma nova rota para pairing.
7. **TPV/KDS sem identity mostram “Vincular”:** gate com input PIN antes do conteúdo operacional; com identity entram normal.
8. **pairLocal valida PIN e expiresAt:** PIN errado ou expirado retorna falha; sucesso grava DeviceIdentity e actualiza lista/heartbeat.
9. **Baseline intacto:** rotas oficiais inalteradas; bottom bar AppStaff inalterada; fluxo auth → sessão → operação inalterado.
10. **TODO explícito:** comentário no código para storage seguro do deviceSecret (Keychain/Keystore) no futuro.
