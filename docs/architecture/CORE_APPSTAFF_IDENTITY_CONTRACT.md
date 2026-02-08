# Contrato de Identidade e Presença — AppStaff

## Lei do sistema

**O AppStaff não abre sem identidade confirmada.**

Este documento é subcontrato do [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md). Tudo começa aqui.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Pré-condição de uso

O AppStaff **não** deve permitir uso operacional sem:

- **Identidade confirmada** (quem está a usar)
- **Vínculo com restaurante** (onde opera)
- **Papel** (staff / gerente / dono)
- **Estado** (ativo, suspenso, fora de turno)

Sem estes quatro, o terminal não é “terminal humano do OS”; é ecrã solto.

---

## 2. Elementos obrigatórios (comuns a todos)

| Elemento        | Descrição                                              | Fonte              |
| --------------- | ------------------------------------------------------ | ------------------ |
| Perfil básico   | Nome, papel, função (ex.: garçom, cozinha, caixa)      | Core / sessão      |
| Estado atual    | Em turno / fora de turno                               | Core (Time & Turn) |
| Último check-in | Quando entrou em turno (se aplicável)                  | Core (Time & Turn) |
| QR pessoal      | Identidade operacional (ex.: para check-in, validação) | Core               |

O AppStaff **mostra** estes elementos. Não os inventa. O Core é a fonte de verdade.

---

## 3. Papel e permissões

- **staff** — Funcionário. Vê tarefas, mini KDS, mini TPV (se autorizado), check-in; não vê finanças completas nem config.
- **manager** — Gerente. Vê tudo o que staff vê + resumo financeiro do turno, desvios, alertas; não vê billing nem integrações críticas.
- **owner** — Dono. Pode aceder ao backoffice; no AppStaff, comportamento pode ser igual a manager para uso operacional.

O contrato de papéis formal está em [CHEFIAPP_ROLE_SYSTEM_SPEC.md](../CHEFIAPP_ROLE_SYSTEM_SPEC.md). O AppStaff consome esse contrato; não redefine papéis.

---

## 4. Estado (ativo / suspenso / fora de turno)

- **Ativo** — Em turno, pode executar tarefas e operações permitidas.
- **Suspenso** — Bloqueado pelo Core (ex.: incidente, decisão do gerente). O AppStaff mostra o estado; não decide.
- **Fora de turno** — Não está em turno. Pode ver informação limitada (ex.: próximas tarefas) conforme política do Core; não executa operações de turno.

O Core decide quando alguém está “em turno”. O AppStaff reflecte.

---

## 5. Regras de implementação

1. **Identidade** deve vir do Core (sessão, backend). Fallback local (ex.: localStorage para dev) é exceção documentada. Em `AppStaffMinimal.tsx`, o `restaurantId` usa `identity.id` + `getTabIsolated("chefiapp_restaurant_id")` + fallback hardcoded até haver sessão/API; está documentado no código como exceção dev.
2. **Restaurante** deve vir do contexto operacional (OperationalContext.restaurantId) ou da sessão. AppStaff não pede “escolha o restaurante” como estado normal.
3. **QR pessoal** é gerado/validado pelo Core; o AppStaff exibe ou usa para check-in conforme [CORE_TIME_AND_TURN_CONTRACT.md](./CORE_TIME_AND_TURN_CONTRACT.md).
4. **Perfil** (nome, papel, função) é só leitura no AppStaff; edição é fora do terminal (config, backoffice).

---

## 6. Resumo

- Sem identidade + vínculo + papel + estado, o AppStaff não é operacional.
- Perfil, estado, último check-in e QR pessoal são elementos obrigatórios; fonte = Core.
- Papel define o que se vê e o que se pode fazer; estado define se se pode agir agora.
- O AppStaff mostra; o Core decide.
