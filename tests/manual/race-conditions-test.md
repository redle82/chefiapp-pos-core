# 🏎️ Teste Manual: Race Conditions (Concorrência)

**Objetivo:** Verificar se o sistema impede que dois garçons manipulem o mesmo pedido simultaneamente de forma destrutiva.

---

## Cenários de Teste

### 1. O Problema do "Item Fantasma"
*Setup:* Dois dispositivos (ou duas abas) logados no mesmo restaurante.

1.  **Dispositivo A:** Abre a Mesa 10. Adiciona "Hamburguer". (NÃO ENVIA AINDA).
2.  **Dispositivo B:** Abre a Mesa 10 (se permitido) ou acessa o mesmo pedido. Adiciona "Refrigerante".
3.  **Ação Simultânea:** Tente enviar/salvar em ambos ao mesmo tempo.
4.  **Verificação:**
    *   Graças ao `Optimistic Locking` (coluna `version`), um dos dois deve falhar ou o sistema deve fazer merge inteligente.
    *   O erro esperado para um deles é "O pedido foi modificado por outro usuário".
    *   **Sucesso:** O banco não deve ficar corrompido com itens órfãos.

### 2. Pagamento vs Adição de Item
1.  **Caixa:** Abre a Mesa 5 e vai para a tela de Pagamento (bloqueando a mesa).
2.  **Garçom:** Tenta adicionar uma sobremesa na Mesa 5.
3.  **Verificação:**
    *   O Garçom deve ser impedido ou avisado que a mesa está em fechamento.
    *   Se o pagamento for processado, o item do garçom não pode entrar como "não pago".
