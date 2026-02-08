# Contrato Canónico — Códigos e Vínculo de Dispositivos

**Status:** CANONICAL  
**Tipo:** Contrato de Arquitetura (Auth / Runtime)  
**Subordinado a:** [APPSTAFF_BASELINE_CONSOLIDATED.md](./APPSTAFF_BASELINE_CONSOLIDATED.md), [DEVICE_TURN_SHIFT_TASK_CONTRACT.md](./DEVICE_TURN_SHIFT_TASK_CONTRACT.md).

---

## 1. Regra de segurança fundamental

**O código nunca "contém" o papel (role) de forma confiável.**

- O código é um **token de associação**.
- O papel vem do **registo/convite no backend** ou do **storage do contrato**.
- Internamente o código resolve para um identificador (inviteId, devicePairId) que o servidor ou o contrato local validam.

Exemplo: pode exibir "SOFIA-OW-1234" ao humano, mas internamente resolve para um inviteId que o servidor valida; o role vem do invite, não do texto.

---

## 2. Três tipos de código

### A) Restaurant Master Code (Admin / Owner setup)

- **Uso:** criar/recuperar autoridade do restaurante; bootstrap.
- **Exemplo:** SOFIA-MASTER-XXXX.
- **Segurança:** alta; pouco usado; pode ter rotação.
- **Regra:** nunca usado em dispositivo de operação diária.

### B) Operator Invite Code (Owner / Manager / Staff / Kitchen / Cleaning)

- **Uso:** entrar no AppStaff e cair no perfil correto.
- **Exemplo:** SOFIA-STAFF-XXXX (o "STAFF" é apenas cosmético; o papel vem do invite).
- **Segurança:** médio/alta; expiração e rotação; limite de ativações.
- **Origem:** criado a partir de um registo em `restaurant_people` (ver `RESTAURANT_PEOPLE_AND_INVITES_CONTRACT.md`) e materializado em `active_invites`.
- **Inteligência:** gerar convites com validade (ex.: "Convite Garçom 10 min", "Convite Cozinha 24h", "Convite permanente Owner/Manager").
- **Regras:** expiração por padrão (ex.: 10–60 min), exceto Owner; limite de ativações (ex.: 1 uso → vira sessão); revogação (owner pode matar convites ativos); rate limit contra brute force.

### C) Device Pairing PIN (estilo LastApp)

- **Uso:** portal/admin gera um PIN curto; TPV/KDS digita para virar terminal confiável.
- **Formato:** 4–6 dígitos, ex.: 4020, válido por ~60s.
- **Contexto:** restaurantId + validade curta + tentativas limitadas.
- **Resultado:** dispositivo recebe deviceId + deviceSecret; a partir daí autentica por header/handshake (deviceSecret), não por PIN.
- **Regras:** PIN só funciona com validade curta + contexto (restaurantId); após vínculo, uso de deviceSecret.

---

## 3. Formato humano (opcional)

Formato consistente para exibição e digitação:

```
CHEF-<SLUG>-<KIND>-<CHECK>-<SHORT>
```

- **Exemplo:** CHEF-SOFIA-OPER-7K-9Q2F
- **SLUG:** identificador do restaurante (ex.: SOFIA).
- **KIND:** MASTER | OPER | DEVICE | INVITE.
- **CHECK:** 2 caracteres (checksum) para reduzir erro de digitação.
- **SHORT:** 4–6 caracteres base32.

**Internamente:** o código resolve para um token (inviteId / devicePairId) que o backend ou o storage do contrato validam. O role nunca é inferido do texto do código.

**Offline/local:** pode validar localmente checksum + prefix; a autorização real vem do contrato local (AUTO-JOIN) ou do servidor quando existir.

---

## 4. Regras de segurança (resumo)

| Tipo        | Expiração     | Limite ativações | Revogação | Rate limit |
|------------|---------------|-------------------|-----------|------------|
| Master (A) | Rotação       | —                 | Sim       | Sim        |
| Invite (B) | 10–60 min*    | Ex.: 1 uso        | Sim       | Sim        |
| PIN (C)    | ~60s          | Tentativas limit. | —         | Sim        |

\* Exceto convites permanentes Owner/Manager.

- **"E se alguém roubar o código?"**  
  Operador: expira + limite de uso + revogação. Dispositivo: precisa do deviceSecret (não do PIN). Owner: master code com rotação e/ou segunda prova (email/sessão owner).

---

## 5. Resolver canónico: connectByCode

- **Entrada:** `connectByCode(code, context)` com opcional deviceId / restaurantHint.
- **Saída:** OperationalContract + role vindo do **contrato/invite**, não do texto do código.
- **Fluxos:**
  1. Owner no browser (já logado): entra no portal → gera "PIN de vincular dispositivo" → PIN no TPV/KDS → portal vê "Device Online".
  2. Staff no dispositivo: abre /app/staff/home → digita código/convite → sistema cria session/contract local ou valida via backend → entra no AppStaff com visibilidade filtrada.
  3. Dispositivo TPV/KDS: tela de vincular → digita PIN do portal → recebe deviceId + secret → modo TPV/KDS com role gate interno.

---

## 6. Device Pairing Contract (MVP)

- **PairingRequest:** pairingPin (4–6 dígitos), expiresAt, restaurantId, deviceType (tpv/kds), assignedRole (opcional).
- **PairingResult:** deviceId, deviceSecret, restaurantId, deviceType, assignedRole (opcional).
- **Após vínculo:** dispositivo guarda DeviceIdentity (deviceId, deviceSecret, type, assignedRole?); heartbeat com deviceSecret; admin vê dispositivos online/offline por lastHeartbeat.

Referência: [DEVICE_TURN_SHIFT_TASK_CONTRACT.md](./DEVICE_TURN_SHIFT_TASK_CONTRACT.md) (identidade dispositivo, DeviceShiftBinding).
