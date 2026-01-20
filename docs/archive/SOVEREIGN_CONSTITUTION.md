# SOVEREIGN CONSTITUTION
## The Operational Nervous System (Type 3)

**ChefIApp is not just a POS (Point of Sale).**

The market is dominated by two types of systems:
1.  **Accounting TPV (Type 1)**: Focuses on fiscal compliance and recording the past. "Register what happened."
2.  **Operational UX TPV (Type 2)**: Focuses on speed, touch, and ease of use. "Facilitate execution."

**ChefIApp anchors the Third Type: The Cognitive-Regulatory TPV.**
It governs human behavior. It acts *before* the sale, *before* the error, and *before* the loss.
It creates a "System Nervous System" where:
-   **Regulation > Registration**: It detects patterns and corrects behavior in real-time.
-   **Education > Facilitation**: Workflows teach the standard; they don't just bypass it.
-   **Sovereignty > Convenience**: Fiscal truth (Z-Reports) is immutable and sacred.

> "Existem TPVs que registram vendas, TPVs que facilitam operações, e TPVs que regulam comportamento humano em tempo real."

---

## I. THE FOUNDATION: IDENTITY & TRUTH
**(Immutable Laws of the Sovereign Core)**EMA
**DECLARAÇÃO DE SOBERANIA**

Este documento define as regras imutáveis arquiteturais do ChefIApp POS Core. 
Qualquer alteração nestes princípios não é uma refatoração, é uma violação de contrato.

- **Status**: TPV MVP 1.0 — ENCERRADO, CONGELADO E SOBERANO.
- **Permissão de Mudança**: ❌ PROIBIDA (Exceto via nova fase arquitetural explícita).

**Congelamento**:
*   O core financeiro (`gm_payments`) é a verdade absoluta.
*   O `CoreExecutor` deduz estado, nunca o inventa.
*   O modelo de eventos (`ORDER_PAID`, `ORDER_COMPLETED`) é definitivo.
*   O trigger de banco (`fn_process_payment_signal`) fecha o ciclo.
*   A moeda é estritamente **EUR**.

---

## 🔒 2. A REGRA DE OURO (ONBOARDING)
> "O onboarding nunca cria realidade. Ele apenas pede permissão à realidade."

1.  **Soberania da Entidade**: O sistema não reconhece "restaurantes fantasmas". Só existe no sistema quem provou existir no mundo real.
2.  **Identidade > UI**: O `SystemBlueprint` é a fonte da verdade, não o estado da tela.
3.  **Reality Gate**:
    *   `draft` → Dashboard bloqueado (Waiting Room).
    *   `verified` → Acesso liberado ao TPV.
    *   O filtro é ontológico: sem verificação, o restaurante não completa o ciclo de vida e morre no onboarding.

---

## 📐 3. ARQUITETURA CANÔNICA (FLUXO IMUTÁVEL)

Todo restaurante deve passar por este funil estrito. Nenhuma etapa pode ser pulada.

1.  **Boot & Identity**: Definição legal do tenant.
2.  **Organization & Operation**: Definição operacional.
3.  **Produto**: Estratégia de venda.
4.  **Review & Commit**: Aceite explícito do contrato.
5.  **Reality Gate (O Filtro)**:
    *   Prova de Existência (Google Places ou Documento).
    *   Transição: Status `draft` ➔ `verified`.
6.  **Activation**: Feedback visual soberano.
7.  **Liberação Total**: Acesso ao Menu Real e TPV Real.

---

## 💸 4. CORE FINANCEIRO (O LEDGER)

> "Venda não é pagamento. Venda é um evento econômico."

1.  **Fonte da Verdade**: `gm_payments` (Tabela de Pagamentos). A tabela `gm_orders` é apenas logística/status.
2.  **Trigger de Fechamento**: O banco de dados (via Trigger) é quem decide que um pedido está fechado, baseado na inserção de um pagamento. Nunca o Frontend.
3.  **Eventos Semânticos**:
    *   `ORDER_PAID` (Financeiro)
    *   `ORDER_COMPLETED` (Logístico)
4.  **Moeda**: `Intl.NumberFormat('pt-PT', { currency: 'EUR' })`. BRL/R$ é proibido.
5.  **Tipagem Strict**: `PaymentMethod = 'cash' | 'card' | 'pix'`. Nada de strings soltas.

---

## 🧭 5. O FUTURO (O QUE VEM DEPOIS)

A partir deste ponto (v1.0), o Core está selado. O desenvolvimento deve focar em camadas superiores:

1.  **Fase 8 - Fiscal & Reports**: Z-Reports, Fechamento Diário, Impostos.
2.  **Fase 9 - Multi-Tenant**: Grupos, Franquias.
3.  **Fase 10 - External Value**: Reputação, Fidelidade.

**Qualquer modificação no CORE exige emenda constitucional.**
