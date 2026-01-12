# 🏭 Cenários de Produção (Dia-a-Dia)

**Objetivo:** Simular um dia real de operação para garantir fluidez.

---

## O "Rush" do Almoço (Simulação)

### Fluxo:
1.  **Abertura:**
    *   Fazer Login.
    *   Abrir o Caixa (`tc005_open_cash_register`).
    *   Verificar se o menu está carregado.

2.  **Operação Intensa (15 min):**
    *   Abrir 3 mesas simultâneas.
    *   Lançar itens variados.
    *   Receber 1 pedido Delivery (imaginário ou via webhook simulado).
    *   Juntar duas mesas (se funcionalidade ativa) ou transferir itens.

3.  **Erros Comuns:**
    *   Tentar vender item sem stock (se houver controle).
    *   Tentar pagar com cartão falhando (simular cancelamento na maquininha).
    *   Estornar um item lançado errado.

4.  **Fechamento:**
    *   Fechar todas as mesas.
    *   Fechar o Caixa.
    *   Validar o Resumo Financeiro.

### Critérios de Sucesso
*   Nenhum "Crash" (Tela Branca ou travamento total).
*   Impressoras de cozinha devem receber os pedidos (se configuradas).
*   Totais financeiros devem bater (Vendas = Dinheiro + Cartão).
