# System Tree vs Execution — Mapa Visual

**Propósito:** Diagramas ASCII que separam **plano de controlo** (o que o Command Center mostra) de **plano de execução** (quem executa o quê na pilha). Evita confundir "árvore de estado" com "árvore de dependências".

**Uso:** Referência rápida para quem desenha UI (Command Center) ou quem desenha fluxos (Kernel → Core → Terminais).

---

## 1. Pilha de execução (quem está em cima de quem)

```
    ┌─────────────────────────────────────────────────────────┐
    │  TERMINAIS                                              │
    │  AppStaff · TPV · KDS · Web (público + Command Center)   │
    └──────────────────────────┬──────────────────────────────┘
                               │ obedecem
    ┌──────────────────────────▼──────────────────────────────┐
    │  CONTRATOS                                               │
    │  AppStaff, TPV, KDS, Web, Billing, … (quem pode o quê)   │
    └──────────────────────────┬──────────────────────────────┘
                               │ autorizam
    ┌──────────────────────────▼──────────────────────────────┐
    │  CORE (negócio)                                          │
    │  pedidos, dinheiro, estado, tempo, autoridade            │
    └──────────────────────────┬──────────────────────────────┘
                               │ roda sobre
    ┌──────────────────────────▼──────────────────────────────┐
    │  KERNEL (execução)                                       │
    │  gates, isolamento, eventos, retries, degradação         │
    └──────────────────────────┬──────────────────────────────┘
                               │
    ┌──────────────────────────▼──────────────────────────────┐
    │  DOCKER · HARDWARE / VM                                  │
    └─────────────────────────────────────────────────────────┘
```

**Frase:** O Core decide. O Kernel garante. Os contratos autorizam. Os terminais executam.

---

## 2. Operational Control Plane Tree (o que o Command Center mostra)

**Não** é a pilha de execução. É a **estrutura de consciência operacional**: o que existe, em que estado está.

```
    Command Center
    │
    ├── System Health              ← estado (não "apps")
    │   ├── Kernel: RUNNING | BOOTING | DEGRADED | SHUTDOWN
    │   ├── Core:   OK | DEGRADED | ERROR
    │   └── Mode:   INIT | RUNNING | MAINTENANCE | DEGRADED
    │
    ├── Terminals                  ← o que está instalado / online
    │   ├── AppStaff (ex.: 12 online)
    │   ├── TPV     (ex.: 1 active)
    │   ├── KDS     (ex.: Kitchen A, Kitchen B)
    │   └── Web     (Public, Command Center)
    │
    ├── Operations                 ← fluxos vivos
    │   ├── Orders
    │   ├── Tasks
    │   ├── Incidents
    │   └── …
    │
    └── Commerce
        ├── Billing  (ChefIApp → restaurante)
        └── Payments (restaurante → cliente)
```

**Regra:** Kernel e Core aparecem como **estado**, não como nós irmãos de TPV/KDS. Contrato: [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md).

---

## 3. Bootstrap na pilha (quando o sistema nasce)

```
    ANTES do Bootstrap:   Kernel sobe (INIT)
                         ↓
                         Cria tenant root, carrega contratos (BOOTING)
                         ↓
    DEPOIS do Bootstrap:  Core activo → RUNNING
                         ↓
                         Terminais podem registar-se
                         Command Center mostra System Health
```

Bootstrap = ritual de nascimento; não é instalação de terminal. Contrato: [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md).

---

## 4. Resumo lado a lado

| Vista | O que mostra | Onde se usa |
|-------|----------------|-------------|
| **Pilha de execução** | Quem está em cima de quem (Hardware → Docker → Kernel → Core → Contratos → Terminais). | Arquitetura, onboarding, documentos. |
| **Control Plane Tree** | Estado + Terminais + Operations + Commerce. Kernel/Core = estado, não nós. | UI do Command Center. |
| **Bootstrap** | INIT → BOOTING → RUNNING; o que deve existir antes de RUNNING. | Arranque do sistema; mensagem "Sistema a inicializar". |

---

*Documento de referência visual. Lei nos contratos: [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md), [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md), [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md).*
