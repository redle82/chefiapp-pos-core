# Contrato de Tempo, Turno e Presença — AppStaff

## Lei do sistema

**Check-in/out não é feature. É lei operacional.**

Este documento é subcontrato do [CORE_APPSTAFF_CONTRACT.md](./CORE_APPSTAFF_CONTRACT.md). O Core decide quando alguém pode dar check-in, como (QR, localização, horário), o que acontece se falhar e o que fica registado. O AppStaff mostra o que o Core decidiu.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. O que o Core decide

| Decisão                         | Descrição                                      |
| ------------------------------- | ---------------------------------------------- |
| Quando alguém pode dar check-in | Horário, janela, restrições (ex.: só no local) |
| Como se regista                 | QR, localização, horário, dispositivo          |
| O que acontece se falhar        | Alerta, bloqueio, notificação ao gerente       |
| O que fica registado            | Entrada, saída, duração, eventos (ex.: atraso) |

O AppStaff **não** calcula horas, banco de horas ou faltas. Ele mostra o que o Core decidiu e regista a ação (check-in/out) conforme regras do Core.

---

## 2. O que o AppStaff faz

- **Mostra** estado de turno (em turno / fora de turno).
- **Oferece** acção de check-in quando o Core permitir.
- **Oferece** acção de check-out quando o Core permitir (ex.: fim de turno, saída antecipada com regras).
- **Regista** a acção (envia ao Core); não decide validade.
- **Mostra** último check-in, duração do turno actual (se o Core expor).

---

## 3. O que o AppStaff não faz

- Calcular horas trabalhadas.
- Calcular banco de horas.
- Determinar faltas ou atrasos (o Core pode calcular e expor; o AppStaff mostra).
- Definir regras de “quando pode dar check-in” (ex.: geofence, horário). O Core define; o AppStaff obedece.

---

## 4. Elementos de UI (mínimo)

| Elemento                                      | Fonte                  | Nota                                    |
| --------------------------------------------- | ---------------------- | --------------------------------------- |
| Estado actual (em turno / fora)               | Core                   | Sempre visível quando identidade existe |
| Botão / acção “Check-in”                      | Core (disponibilidade) | Só activo quando Core permitir          |
| Botão / acção “Check-out”                     | Core (disponibilidade) | Idem                                    |
| Último check-in (data/hora)                   | Core                   | Opcional; melhora consciência           |
| QR pessoal (para check-in noutro dispositivo) | Core                   | Conforme política de identidade         |

---

## 5. Falhas e edge cases

- **Falha de rede ao check-in/out:** AppStaff regista localmente (queue) e reenvia quando possível; mostra estado “pendente” se aplicável. O Core é fonte de verdade quando a operação for confirmada.
- **Check-in fora de janela:** Core rejeita; AppStaff mostra mensagem do Core (não mensagem genérica).
- **Dispositivo diferente:** Se o Core permitir check-in por QR/outro meio, o AppStaff expõe o que for necessário (ex.: exibir QR para outro dispositivo escanear).

---

## 6. Resumo

- Check-in/out é lei operacional; Core decide regras, AppStaff executa e mostra.
- AppStaff não calcula horas, banco ou faltas; mostra dados que o Core expor.
- UI mínima: estado de turno, acções check-in/out quando permitidas, último check-in e QR se aplicável.
