# CHAOS SCRIPT: SÁBADO À NOITE

> **Missão:** Tentar quebrar o ChefIApp com uso humano agressivo.
> **Mindset:** "Operador cansado, cliente impaciente, internet instável."

## 1. O Palco (Setup)

_Antes de começar, garanta que tudo isto está ligado._

| Componente      | Configuração Real          | Papel                        |
| :-------------- | :------------------------- | :--------------------------- |
| **Tablet/iPad** | App TPV (/op/tpv)          | **Caixa Principal** (O Dono) |
| **Telemóvel 1** | App Garçom (/op/staff)     | **Garçom Estressado**        |
| **Laptop**      | KDS (/op/kds)              | **Cozinha**                  |
| **Telemóvel 2** | QR Code Mesa (/public/...) | **Cliente Chato**            |
| **Impressora**  | USB/Rede ou Mock Visual    | **Expedição**                |

**Pré-requisitos:**

- 2 Restaurantes criados (Ex: "Bistrô Caos" e "Burger Rush").
- Menu com pelo menos 10 itens (alguns com modificadores obrigatórios).
- Turno ABERTO em ambos.

---

## 2. ATO 1: O Rush (Carga Normal)

_Objetivo: Verificar fluidez básica e latência visual._

1.  **O Cliente Chato (Celular 2):**

    - Abre o QR Code da Mesa 1.
    - Adiciona 3 itens rápidos (Bebidas).
    - Envia o pedido.
    - _👀 OLHO: Quanto tempo demora para aparecer no KDS e no TPV? (Cronometre)_

2.  **O Garçom (Celular 1):**

    - Vê o pedido da Mesa 1.
    - Adiciona mais 1 item (Entrada) manualmente a pedido da mesa.
    - _👀 OLHO: O KDS atualiza instantaneamente ou precisa de refresh?_

3.  **A Cozinha (Laptop):**
    - Vê os itens chegando.
    - Marca bebídas como "Prontas" (Bar).
    - Deixa a comida em "Preparação".

---

## 3. ATO 2: O Erro Humano (O Teste Real)

_Objetivo: Ver se o sistema perdoa erros._

4.  **O Cliente Indeciso (Celular 2):**

    - Tenta pedir mais um item, mas a internet falha (ative o Modo Avião por 5s e tente enviar).
    - _👀 OLHO: O sistema avisa que deu erro ou fica girando eternamente?_
    - Restaura internet e envia de novo. Duplicou o pedido?

5.  **O Garçom Confuso (Celular 1):**

    - A mesa 1 diz: "Não queria com gelo!".
    - Tenta EDITAR um pedido já enviado para a cozinha.
    - _👀 OLHO: O sistema deixa? O KDS mostra a alteração? Ou o operador tem que gritar para a cozinha?_

6.  **O Caixa (Tablet):**
    - Tenta fechar a conta da Mesa 1.
    - Cliente paga metade em Dinheiro, metade Cartão.
    - _👀 OLHO: Quão doloroso é fazer split de pagamento? Quantos cliques?_

---

## 4. ATO 3: O Meltdown (Alta Concorrência)

_Objetivo: Quebrar a sincronia._

7.  **Caos Simultâneo (Precisa de 2 humanos ou mãos rápidas):**

    - **Humano A (Garçom):** Lança pedido na Mesa 2.
    - **Humano B (Cozinha):** Tenta completar pedido da Mesa 1.
    - **Humano A (Cliente):** Pede a conta da Mesa 1 via QR simultaneamente.
    - _👀 OLHO: Alguém tomou "Erro de Conflito"? O estado ficou inconsistente?_

8.  **Troca de Restaurante:**

    - O Dono muda para o "Burger Rush" no TPV para ver como está o outro negócio.
    - _👀 OLHO: O Cache limpou? Ou apareceram pedidos do Bistrô no Burger? (CRÍTICO)_

9.  **O Turno Esquecido:**
    - Tenta vender sem abrir o caixa no "Burger Rush".
    - _👀 OLHO: O bloqueio é claro ou uma tela de erro criptica?_

---

## 5. O Relatório de Dor ("The Hurt Report")

_Anote apenas o que doeu._

| Momento             | O que aconteceu?                         | Nível de Dor (1-10) | O sistema ajudou ou atrapalhou? |
| :------------------ | :--------------------------------------- | :------------------ | :------------------------------ |
| Ex: Split Pagamento | "Não achei o botão de dividir"           | 8                   | Atrapalhou (escondido)          |
| Ex: KDS Refresh     | "Tive que dar F5 para ver o novo pedido" | 9                   | Atrapalhou (quebra fluxo)       |
| ...                 | ...                                      | ...                 | ...                             |

---

> **DICA DE OURO:** Se você tiver que explicar pro Garçom como fazer algo > 2 vezes, **é uma falha de design**. Anote.
