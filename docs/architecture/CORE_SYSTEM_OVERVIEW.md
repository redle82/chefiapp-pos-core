# ChefIApp — Visão do Sistema em 2 Páginas (v2 — corrigida)

**Propósito:** Documento canónico do modelo mental. Referência única para "o que é o ChefIApp", a hierarquia real (Kernel → Core → Contratos → Terminais), nascimento (Bootstrap), instalação e tempo/verdade.  
**Público:** Qualquer pessoa (dev, produto, investidor) que precise de clareza em minutos.  
**Atualização:** Qualquer alteração que mude Kernel, Core, Bootstrap ou terminais deve passar por aqui e pelo [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md).

---

## 1. O que é o ChefIApp

**ChefIApp não é um app.**  
É um **sistema operacional distribuído para restaurantes**, com **Kernel soberano**, **Core operacional** e **terminais especializados**.

Frase de trabalho (corrigida):

> **O Core decide (negócio). O Kernel garante (execução). Os contratos autorizam. Os terminais executam.**

**Quem é intocável:** o **Kernel**. O Core financeiro/operacional é estável mas **evolui** (fiscalidade, split, marketplace, países). O Kernel quase nunca muda.

---

## 2. Hierarquia real (não pular camadas)

A pilha correcta é:

```
[ Hardware / VM ]
        ↓
[ Docker Runtime ]
        ↓
[ Kernel Soberano ]     ← motor de execução, não de negócio
  - executar, validar, persistir
  - gates, isolamento por tenant
  - transações, versionamento, migração, rollback
  - eventos, retries, dead letters
  - degradação, shutdown
        ↓
[ Core Financeiro / Operacional ]
  - pedidos, dinheiro, estado, tempo, autoridade
  - roda SOBRE o Kernel
        ↓
[ Contratos ]
  - AppStaff, TPV, KDS, Web
  - quem pode o quê, ciclo de vida
        ↓
[ Terminais ]
  - AppStaff (iOS/Android), TPV (PC), KDS (cozinha), Web (config / público)
```

**Erro a evitar:** tratar Core como "a coisa mais baixa" ou como irmão dos terminais. Core é **substrato** dos terminais; Kernel é **substrato** do Core.

Referências: [KERNEL_EXECUTION_MODEL.md](./KERNEL_EXECUTION_MODEL.md), [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md).

---

## 3. Kernel vs Core (onde estava incompleto)

| | Kernel | Core (Financeiro/Operacional) |
|---|--------|--------------------------------|
| **O que é** | Motor soberano de **execução**. | Camada de **negócio**: pedidos, pagamentos, estado, tempo. |
| **Sabe** | Executar, validar, persistir, gates, isolamento, eventos, retries, dead letters, degradação. | Pedidos, tarefas, KDS, TPV, caixa, reconciliação. |
| **Não sabe** | O que é "pedido", "tarefa", "KDS". | (Implementa regras de negócio sobre o Kernel.) |
| **Muda** | Quase nunca. **Intocável absoluto.** | Estável mas evolui (fiscalidade, split, novos países). |
| **Roda** | Em Docker, abaixo de tudo. | **Sobre** o Kernel. |

O Core financeiro **não** é "a primeira coisa que nasce". Abaixo dele está o Kernel; antes do sistema "vivo" está o **Bootstrap**.

---

## 4. Bootstrap (nascimento do sistema)

**Bootstrap** é o ritual de nascimento. Sem ele, o sistema é frágil.

Bootstrap responde:

- Como um restaurante **nasce**?
- Como o **Core** se inicializa?
- Como o **Kernel** cria o primeiro tenant?
- Como os **contratos** são carregados?
- Como o sistema entra em modo **operacional** (RUNNING)?

Exemplo real:

```
docker-compose up
  → Kernel sobe
  → Kernel lê bootstrap config
  → Kernel cria tenant root
  → Kernel carrega contratos
  → Kernel ativa Core financeiro
  → Sistema entra em RUNNING
```

Isso não é UI, não é Core financeiro, não é terminal. É **camada fundacional**.

Referências: [BOOTSTRAP_KERNEL.md](./BOOTSTRAP_KERNEL.md) (auto-consciência, SYSTEM_STATE), [BOOTSTRAP_CONTRACT.md](./BOOTSTRAP_CONTRACT.md) (contrato formal: INIT → BOOTING → RUNNING).

---

## 5. Instalação dos terminais (ato de soberania)

"Botão instalar KDS / TPV" é **interface**. A instalação **real** é:

- **Provisionamento** do terminal
- **Identidade** do terminal (quem é este dispositivo)
- **Chave de confiança**
- **Registro no Core**
- **Permissão por papel**
- **Heartbeat** e **health check**

Sem isso: qualquer KDS falso poderia ligar-se, qualquer TPV poderia enviar pedido, qualquer app poderia fingir ser garçom.

**Instalação ≠ download. Instalação = ato de soberania.**

Quem **instala**, **regista**, **autoriza**, **provisiona** e **invalida** terminais é arquitectura, não detalhe.

---

## 6. Os 4 terminais

| Terminal | Onde | Papel em uma frase |
|----------|------|--------------------|
| **Web Pública** | Navegador, QR da mesa | **Vende:** menu, pedido do cliente, status, pagamento. Não entra no sistema operacional. |
| **AppStaff** | iOS/Android (Expo) | **Trabalha:** login, check-in, tarefas, mini-KDS, mini-TPV, avisos. Terminal humano portátil. |
| **KDS** | App instalado (cozinha) | **Executa cozinha:** recebe pedidos do Core, mostra fila, tempo, confirma estados. Não cria pedidos. |
| **TPV** | App instalado (caixa) | **Executa caixa:** pedidos, pagamentos, impressora, gaveta. Não governa regras. |

Nenhum terminal é fonte de verdade. Todos obedecem ao Core; o Core roda sobre o Kernel.

---

## 7. Tempo e verdade (o que faltava)

Sem isto, o sistema funciona em **demo**, não em restaurante real.

O que acontece quando:

- o **KDS** cai?
- o **AppStaff** está offline?
- o **TPV** perde conexão?

Quem tem a **verdade final**? Quem pode operar **em atraso**? Quem **bloqueia**?

Isso entra em:

- **[CORE_TRUTH_HIERARCHY.md](./CORE_TRUTH_HIERARCHY.md)** — camadas de verdade (instantânea, eventual, histórica, percebida); Core define qual vale; UI não inventa.
- **[CORE_TIME_GOVERNANCE_CONTRACT.md](./CORE_TIME_GOVERNANCE_CONTRACT.md)** — tempo como elemento de primeira classe; SLA, atrasos, "em preparo".
- **[CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md)** — falha aceitável vs degradação vs crítica; quem manda; o que acontece automaticamente.

Contratos de **ciclo de vida** (quando algo pode existir, morrer, ser bloqueado, entrar em degradado) são parte do sistema operacional, não "feature".

---

## 8. Regra de ouro: quem fala com quem

**Os sistemas parecem falar entre si. Na verdade, todos falam com o Core.**

| O que parece | O que é |
|--------------|--------|
| Pedido no TPV → aparece no KDS | Core publicou o evento; TPV e KDS são clientes do Core. |
| Pedido no mini-TPV do garçom → aparece no KDS | Core. |
| Tarefa criada na Web → aparece no AppStaff e no KDS | Core. |

**Nenhum terminal fala directamente com outro.** Obedecem ao mesmo cérebro (Core); o Core obedece ao Kernel.

---

## 9. Contratos: funcionais e de ciclo de vida

Um contrato diz:

- o que este elemento **faz**
- **de onde** lê
- **o que** pode escrever
- o que **não** pode fazer
- **a quem** obedece
- **quando** pode existir, morrer, ser bloqueado, entrar em modo degradado (ciclo de vida)

O contrato central de **autoridade** é o **Kernel** (execução) e o **Core** (negócio). Todos os outros contratos citam e subordinam-se a estes.

Índice completo: [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md).

---

## 10. Resumo (guardar na cabeça)

1. **Hierarquia:** Hardware → Docker → **Kernel** → **Core** → Contratos → Terminais. Não pular Kernel nem Bootstrap.
2. **Kernel** = intocável absoluto. Motor de execução (gates, isolamento, eventos, retries, degradação). Não sabe pedido/tarefa/KDS.
3. **Core** = estável mas evolui. Pedidos, dinheiro, estado, tempo. Roda **sobre** o Kernel.
4. **Bootstrap** = nascimento do sistema (como nasce, como sobe, como entra em RUNNING).
5. **Instalação** de terminais = ato de soberania (provisionamento, identidade, registro, heartbeat). Não é só UI.
6. **Tempo e verdade:** Truth Hierarchy, Time Governance, Failure Model — quem tem verdade final, quem opera em atraso, quem bloqueia.
7. **O Core decide. O Kernel garante. Os contratos autorizam. Os terminais executam.**

---

## 11. Proibição (documentos que NÃO devem existir)

Os seguintes nomes **não** correspondem a contratos. Nenhum documento no repositório deve referenciá-los como ficheiros a criar ou a usar.

| Nome proibido | Motivo |
|---------------|--------|
| **TERMINAL_REGISTRATION_CONTRACT** | O registro de terminais é governado por [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md). Um contrato separado duplicaria essa dimensão e criaria ambiguidade de autoridade. |
| **CORE_PAYMENT_RECONCILIATION_CONTRACT** | A reconciliação de pagamentos está incluída em [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md). Um contrato distinto criaria sobreposição e autoridade circular. |

Referência completa: [CONTRACT_AUDIT_REFERENCED.md](./CONTRACT_AUDIT_REFERENCED.md).

---

*Documento vivo. Alterações que mudem Kernel, Core, Bootstrap ou terminais devem actualizar este overview e o CORE_CONTRACT_INDEX.*
