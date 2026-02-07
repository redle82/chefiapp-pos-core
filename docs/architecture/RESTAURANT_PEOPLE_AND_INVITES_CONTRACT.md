# Contrato Canónico — Pessoas do Restaurante e Invites

**Status:** CANONICAL  
**Tipo:** Contrato de modelo (Organização → Invite → AppStaff)  
**Subordinado a:** [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md), [APPSTAFF_RUNTIME_MODEL.md](./APPSTAFF_RUNTIME_MODEL.md), [CODE_AND_DEVICE_PAIRING_CONTRACT.md](./CODE_AND_DEVICE_PAIRING_CONTRACT.md).

---

## 1. Princípio

A tela de **Empleados** (portal de gestão) é **fundação organizacional**, não ambiente operacional.

- Cria e mantém a estrutura humana do restaurante.
- Define papéis lógicos (staff / manager / kitchen / cleaning / owner).
- Prepara, mas **não executa**, a operação.

O AppStaff só vê **contratos operacionais** (invites / sessões), nunca a UI de configuração.

---

## 2. Entidade `restaurant_people`

Tabela lógica (nome exemplificativo: `gm_restaurant_people`):

```sql
restaurant_people {
  id             uuid primary key,
  restaurant_id  uuid not null,
  name           text not null,
  role           text not null, -- 'staff' | 'manager' | 'kitchen' | 'cleaning' | 'owner' (mapa para StaffRole)
  status         text not null default 'inactive', -- 'inactive' | 'active' | 'suspended'
  staff_code     text unique,  -- código humano curto (local/demo); NÃO é fonte de truth do role
  qr_token       text unique,  -- token usado em QR; resolve para invite/contract
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
}
```

Regras:

- Um registo em `restaurant_people` **não cria sessão** nem abre turno.
- É um **potencial operador**; só se torna “vivo” quando existe invite/contrato activo.
- `role` mapeia 1:1 para `StaffRole` no AppStaff.

Superfícies:

- Criação/edição principal: `EmpleadosConfigPage` → `RestaurantPeopleSection`  
  (`merchant-portal/src/features/admin/config/pages/EmpleadosConfigPage.tsx`,  
  `merchant-portal/src/pages/Config/RestaurantPeopleSection.tsx`).

---

## 3. Entidade `active_invites`

Tabela lógica (Supabase/Core):

```sql
active_invites {
  id             uuid primary key,
  code           text unique not null,  -- CHEF-<SLUG>-<KIND>-<CHECK>-<SHORT>
  restaurant_id  uuid not null,
  person_id      uuid references restaurant_people(id),
  role_granted   text not null,         -- StaffRole
  permissions    jsonb,                 -- opcional; escopo fino (TPV, KDS, etc.)
  max_uses       int default 1,
  used_count     int default 0,
  expires_at     timestamptz,
  status         text not null default 'active' -- 'active' | 'expired' | 'revoked' | 'used'
}
```

Regras:

- `code` é um **Operator Invite Code** (tipo B em `CODE_AND_DEVICE_PAIRING_CONTRACT.md`).
- O **papel efectivo** vem de `role_granted`, nunca do texto do código.
- `person_id` liga explicitamente a um registo em `restaurant_people`.
- Um invite pode expirar, ser revogado ou consumido (`max_uses`, `used_count`, `status`).

Papel:

- `active_invites` é a **ponte exclusiva** entre `restaurant_people` e AppStaff.
- O AppStaff nunca lê `restaurant_people` directamente; só vê invites/contratos.

---

## 4. Fluxo Empleados → Invite → AppStaff

1. Dono/manager cria ou edita pessoa em **Empleados**:

   ```ts
   // RestaurantPeopleSection
   restaurant_people.insert({ restaurant_id, name, role, ... })
   ```

2. O sistema cria ou actualiza um registo em `active_invites` para essa pessoa:

   ```ts
   active_invites.insert({
     code,
     restaurant_id,
     person_id,
     role_granted: role,
     permissions,
     max_uses,
     expires_at
   })
   ```

3. A UI mostra para cada pessoa:

   - Estado do convite: “nunca usou / válido / expirado / revogado / usado hoje”.
   - Acções: revogar, regenerar código / QR.

4. Quando o funcionário abre o AppStaff e insere o código:

   - `connectByCode(code)` resolve `active_invites`.
   - O backend devolve `restaurant_id + role_granted (+ permissions)`.
   - `StaffContext` aplica:
     - `operationalContract.id = restaurant_id`.
     - `activeRole = role_granted`.
     - `roleSource = 'invite'`.

---

## 5. Ligação com `connectByCode` e AppStaff

- `connectByCode` (cliente) é o **único caminho** para entrada por código:
  - Lê `active_invites` (produção) ou mock equivalente (demo).
  - Preenche `resolvedRole` com `role_granted`.
  - Define `roleSource = 'invite'`.

- `StaffContext` consome apenas `ConnectByCodeResult`:
  - Nunca deriva role de `code` (string).
  - Não lê `restaurant_people` directamente; toda a autoridade vem de `active_invites`/contrato.

---

## 6. Interacção com Escalas (schedule) e Turnos

Escalas e turnos são definidos noutros contratos, mas relacionam‑se com pessoas e invites:

- `ScheduleEntry { person_id, role, day, time_range, location_id? }` (ver `DEVICE_TURN_SHIFT_TASK_CONTRACT.md`).
- `DeviceShiftBinding { device_id, shift_id }` (mesmo contrato).

Regras de alto nível:

- Uma sessão AppStaff válida pode, no futuro, exigir:

  ```ts
  canExecuteOperation =
    hasOperationalContract &&
    isInShift(person_id, now) &&
    roleAllowsAction(activeRole)
  ```

- No MVP, a Escala alimenta sobretudo:
  - Alertas (“entrou fora de escala”).
  - Métricas de presença e disciplina.
  - Telemetria para dashboards (owner/manager).

---

## 7. Diferença entre chaves (resumo)

Ver também `CODE_AND_DEVICE_PAIRING_CONTRACT.md`.

- **Invite Code (active_invites.code)** — entrada no AppStaff (sessão/role).
- **PIN TPV (futuro, por pessoa)** — autenticação/autorização local no TPV (abrir caixa, apagar item, etc.).
- **Device Pairing PIN** — vínculo dispositivo ↔ restaurante (gera `deviceId + deviceSecret`).

Cada chave abre uma **porta diferente**; todas são derivadas de contratos, não de UI ad‑hoc.

