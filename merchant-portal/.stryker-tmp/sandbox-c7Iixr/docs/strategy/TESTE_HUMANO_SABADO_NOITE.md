# TESTE HUMANO: SÁBADO À NOITE

> **Entidade:** La Última Ola & Burger Rush (2 Restaurantes)
> **Objetivo:** Stress Test Humano em Produção (Docker Core)

## Pré-Requisitos

1. **Docker Core Ativo** (`npm run docker:up` / Porta 3000/4320).
2. **Merchant Portal** (`npm run dev` @ `http://localhost:5175`).
3. **Dispositivos**:
   - 1 Computador (Admin/KDS)
   - 1 Telemóvel (Garçom/Cliente QR)
4. **Limpeza**: `localStorage.clear()` antes de começar.

---

## FASE 1: SETUP (La Última Ola)

### TAREFA 1: Criar Restaurante

- **Onde clicar**: `/onboarding` ou `SelectTenant > Criar Novo`
- **Ação**: Criar "La Última Ola" (Gastrobar, ES, EUR).
- **Esperado**: Redirecionamento para Dashboard. `restaurant_id` criado no Core.

### TAREFA 2: Menu Realista

- **Onde clicar**: `Menu > Editor`
- **Ação**:
  - Criar Categorias: "Tapas", "Principal", "Bebidas".
  - Criar Produtos (com preço > 0 e impostos):
    - "Patatas Bravas" (5.00€)
    - "Caña" (2.50€)
    - "Paella" (15.00€, Modificador: Ponto)
  - **Publicar Menu**.
- **Esperado**: `MenuState` fica `LIVE`. TPV desbloqueia.

### TAREFA 3: Stock

- **Onde clicar**: `Stock > Ingredientes`
- **Ação**: Criar "Batatas" (kg). Ligar receita a "Patatas Bravas" (0.3kg).
- **Esperado**: Deduzir 0.3kg ao vender.

### TAREFA 4: Staff & Turno

- **Onde clicar**: `/op/tpv` (Como Admin)
- **Ação**: Abrir Turno ("Caixa: 150€").
- **Esperado**: Status muda para "OPEN". Botão "Novo Pedido" fica ativo.

---

## FASE 2: EXECUÇÃO (O Caos)

### ATO 1: O Rush (Latência)

1. **QR Code (Cliente)**:
   - Aceder a `/public/menu/{slug}/table/1`.
   - Pedir 3 Cañas. Enviar.
   - **Olho**: Tempo até "Bling" no KDS.
2. **Garçom (TPV Mobile)**:
   - Aceder `/op/tpv`.
   - Adicionar "Patatas Bravas" à Mesa 1.
   - **Olho**: KDS atualiza sem refresh?

### ATO 2: O Erro Humano (Falhas)

1. **Falha de Rede**:
   - Desligar Wi-Fi do Telemóvel.
   - Tentar enviar pedido.
   - **Esperado**: Aviso visual (Blocking Screen ou Toast "Offline"). Não perder o pedido.
2. **Edição Tardia**:
   - Cliente quer cancelar 1 Caña (já enviada).
   - Garçom tenta remover no TPV.
   - **Esperado**: KDS mostra "CANCELADO" ou riscado.

### ATO 3: O Meltdown (2 Restaurantes)

1. **Troca de Contexto**:
   - Abrir nova aba. Criar "Burger Rush".
   - Tentar vender no Burger Rush _sem_ fechar turno no La Última Ola.
   - **Esperado**: Sessão isolada ou aviso claro.
2. **Pagamento Split**:
   - Mesa 1 Pede a conta.
   - Pagar 50% dinheiro, 50% cartão.
   - **Esperado**: Recibo fiscal gerado com 2 pagamentos.

---

## Relatório de Dor

Se algo falhar:

1. **Print/Foto**.
2. **Anotar**: "Tarefa X - Onde doeu (confuso/lento/quebrou)".
3. **Não corrigir**. Siga para a próxima.
