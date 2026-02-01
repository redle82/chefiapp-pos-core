# Contrato de Bootstrap — Nascimento do Sistema

**Propósito:** Define formalmente o ritual de nascimento do ChefIApp: como o sistema nasce, como o Kernel cria o primeiro tenant, como os contratos são carregados e como o sistema entra em RUNNING. Subordinado ao Kernel e ao [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md).

**Uso:** Qualquer alteração ao fluxo de arranque (docker-compose, criação de tenant root, carga de contratos, transição INIT → RUNNING) deve respeitar este contrato.

---

## 1. O que é o Bootstrap

**Bootstrap** é o ritual de nascimento. Não é UI, não é Core financeiro, não é terminal — é **camada fundacional**.

Bootstrap responde:

- Como um restaurante **nasce**?
- Como o **Core** se inicializa?
- Como o **Kernel** cria o primeiro tenant?
- Como os **contratos** são carregados?
- Como o sistema entra em modo **operacional** (RUNNING)?

Sem Bootstrap concluído, o sistema não está operacional.

---

## 2. Fases do Bootstrap

| Fase | Nome | O que acontece | Quem executa |
|------|------|----------------|--------------|
| 0 | **INIT** | Ambiente detectado; config lida; Kernel sobe. | Docker + Kernel |
| 1 | **BOOTING** | Criação do tenant root (se inexistente); carga de contratos; validação de guards. | Kernel |
| 2 | **RUNNING** | Core financeiro activo; terminais podem ligar; Command Center mostra estado. | Kernel + Core |

**Regra:** O estado "Kernel: RUNNING", "Mode: RUNNING" só existe **depois** do Bootstrap. Em INIT/BOOTING, o Command Center deve mostrar "Sistema a inicializar" (ou equivalente), não estado operacional falso.

---

## 3. Sequência canónica (exemplo real)

```
docker-compose up
  → Kernel sobe (INIT)
  → Kernel lê bootstrap config
  → Kernel cria tenant root (se não existir)
  → Kernel carrega contratos
  → Kernel valida guards (assertNoMock em prod, etc.)
  → Kernel activa Core financeiro
  → Sistema entra em RUNNING
  → Terminais podem registar-se; Command Center mostra System Health
```

Não é permitido expor "RUNNING" ou dados operacionais antes desta sequência estar concluída.

---

## 4. O que deve existir antes de RUNNING

- **Tenant root** (ou primeiro tenant) criado e registado.
- **Contratos** carregados (referência: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)); pelo menos os contratos de autoridade (Kernel, Core, Financial Sovereignty).
- **Guards de produção** validados (ex.: assertNoMock em prod; DbWriteGate conforme ambiente).
- **SYSTEM_STATE** emitido (referência: [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md)) com `kernel: OK` e `environment` correcto.

---

## 5. O que o Bootstrap NÃO é

- **Não** é "instalação de um terminal" (KDS/TPV/AppStaff). Isso é **Instalação** (ato de soberania), definida em [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) e [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md).
- **Não** é criação de menu, produto ou primeiro pedido. Isso é operação **dentro** de RUNNING.
- **Não** é deploy de código. É o **primeiro ciclo de vida** do sistema já deployado.

---

## 6. Falha durante Bootstrap

- Se criação do tenant root falhar → sistema **não** entra em RUNNING; modo INIT ou BOOTING com erro explícito.
- Se carga de contratos falhar → conforme política (bloquear RUNNING ou degradar com contratos parciais; definir em CORE_FAILURE_MODEL se ainda não estiver).
- O Kernel **nunca** deve declarar RUNNING sem os requisitos da secção 4 satisfeitos.

---

## 7. Referências cruzadas

| Documento | Relação |
|-----------|---------|
| [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) | Hierarquia; Bootstrap como nascimento; Instalação como soberania. |
| [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md) | SYSTEM_STATE; guards; Surfaces Registry; ciclo de vida técnico. |
| [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md) | Estado "Kernel: RUNNING" / "Mode: RUNNING" só após Bootstrap. |
| [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) | Core activo após Bootstrap; Docker Core como soberano. |

---

## 8. Status

**FECHADO** para a definição de Bootstrap (fases INIT → BOOTING → RUNNING, sequência canónica, o que deve existir antes de RUNNING). Implementação concreta (scripts, ordem exacta de migrações, APIs) pode evoluir; a lei está definida.

---

*Contrato de Bootstrap. Alterações que permitam RUNNING sem tenant root, sem contratos carregados ou sem guards validados violam este contrato.*
