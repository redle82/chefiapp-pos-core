# Protocolo Genesis: Fase K (Operations)
**Tipo:** Event Generation (Contact with Reality)
**Objetivo:** Gerar verdade factual para informar a criação do Layer 2 (Lógica).
**Status:** ATIVO

## 📜 Premissas Constitucionais
De acordo com a auditoria arquitetural (Genesis Protocol):
1.  **Truth before Agency:** Não criaremos agentes ou automações antes de ter dados reais.
2.  **Reality before Intelligence:** A lógica (L2) deve emergir do uso real, não de modelos hipotéticos.
3.  **Manual is Honest:** A dor do uso manual é o melhor sinal de onde o sistema precisa evoluir.

## 🚫 Regras de Engajamento
1.  **Zero Features:** Proibido codar novas funcionalidades.
2.  **Zero SQL Seeding:** A criação de dados (restaurante, menu, staff) DEVE ser feita via UI. Se for lento, registre a lentidão.
3.  **Identity Discipline:** Ao usar o sistema, comporte-se como o Usuário (Sofia), não como o Desenvolvedor (Root). Não use atalhos de URL se o usuário não os teria.

## 🔬 O Experimento (Roteiro)

### 1. The Birth (Criação de Identidade)
*   **Ação:** Criar a conta e o restaurante "Sofia Gastrobar" do zero.
*   **Validação:** O sistema permite? A UX de onboarding (Wizard) funciona sem "faith"?
*   **Output Esperado:** Registro `companies` criado no Supabase (Layer 1 validado por escrita).

### 2. The Context (Definição de Mundo)
*   **Ação:** Cadastrar manualmente:
    *   3 Categorias.
    *   10 Produtos (com fotos reais, preços reais).
    *   3 Membros de Staff (convidar e aceitar).
*   **Output Esperado:** `menus`, `products`, `profiles` populados via UI. Feedback de dor no `PILOT_FEEDBACK_LOG.md`.

### 3. The Flow (Simulação de Serviço)
*   **Ação:** Executar um "Friday Night" simulado (mas manual).
    *   Abrir Mesa.
    *   Lançar Pedidos (TPV).
    *   Produzir (KDS).
    *   Pagar (Checkout).
*   **Output Esperado:** 50+ Pedidos no banco. Logs de erro de concorrência ou UX.

### 4. The Exit (Critérios de Sucesso)
A Fase K termina quando:
1.  Tivermos >50 pedidos reais no banco de dados.
2.  Tivermos >3 pontos de fricção (Pain Points) documentados.
3.  Confirmarmos que o dinheiro (Stripe/Simulado) fluiu corretamente.

---

## 📝 Logs e Evidências
Toda observação deve ser registrada em: `docs/PILOT_FEEDBACK_LOG.md`.
Não corrija bugs na hora (exceto se bloquearem o teste). Apenas registre.

> "A verdade suprema não é o código que compilou. É o pedido que foi entregue e pago."
