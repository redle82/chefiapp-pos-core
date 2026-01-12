# 📡 Teste Manual: Offline Sync & Idempotência

**Objetivo:** Garantir que vendas offline sejam sincronizadas sem duplicação ou perda de dados.

---

## Cenários de Teste

### 1. Venda Offline Simples
1.  **Desconecte** a internet da máquina POS.
2.  Verifique se o indicador "OFFLINE" apareceu.
3.  Crie um pedido com 2 itens e finalize em Dinheiro.
4.  Verifique na tela "Pedidos": o pedido deve estar lá com ícone de "Não Sincronizado" (nuvem cortada ou cor amarela).
5.  **Reconecte** a internet.
6.  **Verificação:**
    *   O ícone deve mudar para "Sincronizado" (verde).
    *   Verifique no Supabase: Existe APENAS 1 registro desse pedido em `gm_orders`? (Critical Check).

### 2. Idempotência Extrema (O Teste do "Network Jitter")
1.  Abra o DevTools do navegador > Network > Throttling > "Slow 3G" ou simule queda intermitente.
2.  Clique em "Finalizar" múltiplas vezes rapidamente (se o botão não estiver desabilitado).
3.  Aguarde a estabilização.
4.  **Verificação:**
    *   Deve existir apenas UM pedido no backend.
    *   O campo `sync_metadata->localId` deve garantir a unicidade.

### 3. Sync de Filas Longas
1.  Fique offline.
2.  Crie 5 pedidos seguidos rapidamente.
3.  Fique online.
4.  **Verificação:**
    *   Os 5 pedidos devem subir sequencialmente ou em paralelo.
    *   Nenhum deve ser perdido.
