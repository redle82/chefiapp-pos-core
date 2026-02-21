# EXECUTION ORDER: B → A → C

> **Strategy:** Human Reality First, Code Perfection Second.
> **Objective:** Expose UX failures and operational pain points _before_ solidifying the architecture or writing the narrative.

## Introdução

Esta estratégia define a ordem de execução para a finalização do ciclo atual. A premissa é inverter a lógica tradicional: em vez de polir o código (A) e depois testar (B), vamos **quebrar o sistema com humanos reais (B)** para descobrir o que realmente importa corrigir (A), e só então contar a história (C).

Não é um teste de software. É um ensaio geral de caos operacional.

---

## FASE B: Stress Test Humano (IMEDIATO)

_“Encontrar dor humana, não bug técnico.”_

**Cenário Obrigatório:**

- **Ambiente:** Simulação de "Sábado à Noite".
- **Escala:** 2 restaurantes operando simultaneamente.
- **Hardware:**
  - TPV Mini (Tablet/Celular).
  - KDS Mini + KDS Principal.
  - QR Web (Android + iOS).
  - Impressoras (Cozinha + Caixa).
- **Caos Controlado:** Múltiplos pedidos concorrentes, erros humanos intencionais (cancelamentos, cliques errados, pedidos duplicados).

**Objetivos:**

1.  **UX sob Pressão:** O sistema guia ou atrapalha quando o operador está com pressa?
2.  **Resiliência ao Erro:** Recuperação de falhas humanas (ex: voltar atrás em um pagamento, corrigir um pedido na cozinha).
3.  **Fluxo de Informação:** A comunicação entre QR -> TPV -> KDS -> Fiscal é fluida e instantânea?

**Critérios de Sucesso:**

- O sistema não "fica em silêncio" (feedback visual constante).
- Erros operacionais são reversíveis sem chamar o suporte.
- Nenhuma perda de dados financeiros ou fiscais durante o caos.

---

## FASE A: Consolidação Técnica (PÓS-B)

_“Consertar o que doeu.”_

O trabalho técnico desta fase será ditado exclusivamente pelas dores descobertas na Fase B.

**Foco Provável:**

- **Autenticação P2:** Se o login cair durante o stress test, a Auth híbrida será prioridade.
- **Performance:** Se houver latência perceptível no KDS.
- **Robustez:** Tratamento de edge-cases descobertos no uso real.
- **Refatoração:** Apenas do que foi gargalo. Nada de "clean code" por vaidade.

---

## FASE C: Narrativa (FINAL)

_“Contar a história da vitória.”_

Apenas quando o sistema sobreviver ao caos (B) e for curado (A), escreveremos a narrativa.

**Entregáveis:**

- Documentação final de produto.
- Materiais de marketing baseados em "Battle Tested".
- O "Prompt-Book" operacional final.

---

## Próximos Passos

1.  Preparar o Roteiro do Ensayo (Fase B).
2.  Executar a "Noite do Caos".
3.  Registrar os ferimentos (bugs/UX issues).
4.  Planejar a Fase A.
