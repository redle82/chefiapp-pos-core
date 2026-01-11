# Genesis Audit: ChefApp (Status e Dívida Consciente)
**Data:** 2025-12-28
**Camada:** Layer 0 (Architectural Awareness)
**Status:** MONOLITHIC BUT HONEST

## 🗺️ Onde estamos (The Genesis Map)
O ChefApp atualmente ocupa uma posição híbrida no sistema.

| Camada | Status Genesis | Descrição Real |
| :--- | :--- | :--- |
| **L0 (Code)** | ✅ **PROVED** | Código compila, rotas funcionam, sem segredos. |
| **L1 (Data)** | ⚠️ **PARTIAL** | DB acessível, mas schema vive dentro do App (não isolado). |
| **L2 (Logic)** | ⚠️ **COUPLED** | Regras de negócio misturadas com UI/Infrastructure. |
| **L3 (Action)** | ⚠️ **COUPLED** | Ações dependem de funções globais (`App.tsx`). |
| **L4 (React)** | ⚠️ **GLOBAL** | Telemetria não distingue domínios. |
| **L5 (Intel)** | ❌ **PREMATURE** | Inteligência (GM) tenta ler UI, não dados puros. |

## ⚖️ Julgamento Genesis (The Verdict)

### 1. O Problema
"ChefApp nasceu como produto antes de nascer como mundo independente."
Ele viola a separação estrita de camadas L1/L2. Ele é um Monólito.

### 2. A Decisão (Phase K vs Phase L)
A pergunta correta não é "Como separar?", mas "Quando separar?".

*   **Agora (Phase K - Operations):** O valor está no **uso real**, não na pureza arquitetural. O acoplamento atual garante estabilidade e velocidade de iteração para um único produto.
*   **Futuro (Phase L - Scalability):** A separação será necessária apenas quando houver múltiplos produtos ou escala massiva.

### 3. A Dívida Consciente (Architectural Debt)
Aceitamos formalmente a seguinte dívida para viabilizar o Pilot:

> "O merchant-portal será tratado como um Monólito Operacional durante a Fase K. A refatoração para Modularidade (Worlds) está agendada e bloqueada até a Fase L."

## 🛣️ Plano de Ação
1.  **Stop Refactoring:** Proibido tentar desacoplar componentes durante a operação piloto.
2.  **Start Operating:** Foco total em gerar dados reais (Phase K).
3.  **Audit Logs:** Registar dores de acoplamento no `PILOT_FEEDBACK_LOG.md` como "Debt Hints", não como bugs urgentes.

---
**Assinado:** Genesis Kernel (2025-12-28)
