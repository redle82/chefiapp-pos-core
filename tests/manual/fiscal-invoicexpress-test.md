# 🧾 Teste Manual: Fiscal (InvoiceXpress)

**Objetivo:** Validar a emissão correta de faturas certificadas pela autoridade tributária via integração InvoiceXpress.

---

## Pré-requisitos
1.  Conta sandbox ou produção no InvoiceXpress.
2.  API Key e Account Name configurados em `gm_restaurants.fiscal_config`.
    ```json
    {
      "accountName": "seurestaurante",
      "apiKey": "sua-api-key"
    }
    ```

## Cenários de Teste

### 1. Emissão Simples (Sucesso)
1.  Abra o POS.
2.  Adicione 1 produto (ex: Coca-Cola).
3.  Vá para Pagamento > Dinheiro > Finalizar.
4.  **Verificação:**
    *   O pedido deve fechar imediatamente (non-blocking).
    *   No banco de dados (`gm_orders`), o campo `fiscal_status` deve mudar para `EMITTED` em alguns segundos.
    *   Deve haver uma URL de PDF em `fiscal_doc_url`.

### 2. Falha de Conexão (Timeout)
1.  Desconecte a internet OU altere a API Key para uma inválida.
2.  Finalize uma venda.
3.  **Verificação:**
    *   A venda DEVE ser concluída (o cliente não espera).
    *   O sistema deve tentar a emissão em background.
    *   `fiscal_status` deve ficar `PENDING` ou `ERROR`.

### 3. Reimpressão
1.  Vá para "Pedidos Fechados".
2.  Localize o pedido emitido.
3.  Tente "Imprimir Fatura".
4.  **Verificação:**
    *   O PDF deve abrir ou o comando de impressão deve ser enviado.
