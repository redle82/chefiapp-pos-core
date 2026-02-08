# Contrato do Plano de Controlo — Command Center Tree

**Propósito:** Define a forma **correcta** da árvore do Command Center. Separa **plano de controlo** (o que governa, o que existe) de **plano de execução** (o que está a acontecer). Corrige o erro de misturar Core/Kernel com terminais como "nós irmãos".

**Uso:** Qualquer UI que mostre "System Tree", "Dashboard", "Command Center" deve seguir esta estrutura. Kernel e Core aparecem como **estado**, não como aplicações ao lado dos terminais.

---

## 1. O que estava errado (e o que é correcto)

**Erro:** Tratar o System Tree como se Core, TPV, KDS fossem nós ao mesmo nível.

```
❌ ERRADO (mistura fundação com periféricos):
System Tree
├── Core
├── TPV
├── KDS
├── AppStaff
├── Web
```

**Correcto:** Core não é nó irmão dos terminais. **Core é o substrato.** O que a árvore mostra é:

- **Estado** do Kernel e do Core (RUNNING, OK, Mode)
- **Terminais** e o que está instalado/online
- **Operações** (pedidos, tarefas, incidentes)
- **Comércio** (billing ChefIApp, pagamentos restaurante)

Ou seja: **Operational Control Plane Tree** (ou Command Center Tree), não Execution Tree nem Dependency Graph.

---

## 2. Nome técnico do que o Command Center mostra

O que se chama "System Tree" é, tecnicamente:

**Operational Control Plane Tree**  
(ou: Command Center Tree / Operational Topology / System Awareness Graph)

**Não é:**

- Execution Tree
- Dependency Graph
- Runtime Graph

É a **estrutura de consciência operacional**: o que existe, em que estado está, o que está a acontecer.

---

## 3. Estrutura correcta da árvore (contrato)

A camada de **visualização** (Web Command Center) deve seguir esta forma:

```
Command Center
│
├── System Health                    ← estado da fundação (não "apps")
│   ├── Kernel: RUNNING | BOOTING | DEGRADED | SHUTDOWN
│   ├── Core: OK | DEGRADED | ERROR
│   └── Mode: INIT | RUNNING | MAINTENANCE | DEGRADED
│
├── Terminals                        ← o que está instalado / online
│   ├── AppStaff (ex.: 12 online)
│   ├── TPV (ex.: 1 active)
│   ├── KDS (ex.: Kitchen A, Kitchen B)
│   └── Web (Public, Command Center)
│
├── Operations                       ← fluxos vivos
│   ├── Orders
│   ├── Tasks
│   ├── Incidents
│   └── (outros conforme contrato)
│
└── Commerce                        ← billing e pagamentos
    ├── Billing (ChefIApp → restaurante)
    └── Payments (restaurante → cliente)
```

**Regra:** Kernel e Core aparecem como **estado** (RUNNING, OK, Mode), **não** como "aplicações" ao lado de TPV/KDS. São fundação; os nós irmãos dos terminais são **outros terminais** e, em seguida, Operations e Commerce.

---

## 4. System Tree vs Work Tree

| Árvore | Função |
|--------|--------|
| **System Tree** (ou Control Plane Tree) | **Estrutura:** o que existe, estado do Kernel/Core, terminais, operações, comércio. |
| **Work Tree** | **Fluxos vivos:** o que está a acontecer (pedidos em curso, tarefas abertas, incidentes). |

Separação clássica: **estrutura** vs **acção**. Ambas podem coexistir na mesma UI (por exemplo, painel esquerdo = System Tree; painel central = conteúdo do nó seleccionado, incluindo Work Tree quando o nó for Orders/Tasks/Incidents).

---

## 5. Seleccionar nó não muda de sistema

**Correcto (já acertado):** Seleccionar um nó **não** muda de página; muda de **contexto**. Single-pane-of-glass, context switching, navegação stateful. Isso é Command Center, não site.

O conteúdo do painel central é determinado pelo nó seleccionado (ex.: seleccionar "KDS" mostra estado dos KDS; seleccionar "Orders" mostra Work Tree de pedidos). Não se navega para "outra app"; permanece no mesmo plano de controlo.

---

## 6. O que a Web faz (e não faz)

**Web Operacional (Command Center):**

- **Configura** AppStaff, TPV, KDS, Web pública
- **Cria** tarefas
- **Delega**
- **Observa** (estado do Kernel, Core, terminais, operações)
- **Não executa** — é painel de orquestração, não de execução

Isso está alinhado com sistemas como ServiceNow, AWS Console, Google Cloud Console.

---

## 7. Onde entra Bootstrap e Instalação

- **Bootstrap:** O estado "Kernel: RUNNING", "Mode: RUNNING" só existe **depois** do Bootstrap. Em INIT/BOOTING, o Command Center pode mostrar "Sistema a inicializar" conforme [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md) e [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md).
- **Instalação:** Os terminais listados em "Terminals" são os **registados** no Core (provisionamento, identidade, heartbeat). Um terminal "não instalado" ou "não autorizado" não aparece como activo na árvore. Instalação = acto de soberania; a árvore reflecte o resultado desse acto.

---

## 8. Status

**FECHADO** para a forma da árvore (System Health como estado; Terminals/Operations/Commerce; separação System Tree vs Work Tree). Implementação (exactamente quais nós, labels, métricas) pode evoluir; a lei está definida.

---

*Contrato do plano de controlo. Alterações que misturem de novo fundação com periféricos ou que tratem Core/Kernel como nós irmãos dos terminais violam este contrato.*
