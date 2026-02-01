# Checklist de Validação Visual - Fase 4

## URLs para Testar


### Alpha (alpha)

- **KDS Interno:** http://localhost:5173/kds-minimal
  - ✅ Deve mostrar todos os pedidos ativos (OPEN, IN_PREP, READY)
  - ✅ Deve mostrar tempos e atrasos
  - ✅ Deve permitir marcar itens como prontos

- **KDS Público:** http://localhost:5173/public/alpha/kds
  - ✅ Deve mostrar APENAS pedidos READY
  - ❌ NÃO deve mostrar pedidos em preparo
  - ❌ NÃO deve mostrar tempos ou atrasos

- **Status do Cliente:** http://localhost:5173/public/alpha/order/bdd0bc72-2972-4d05-8bf8-1b1dd82aadbf
  - ✅ Deve mostrar APENAS este pedido
  - ❌ NÃO deve mostrar outros pedidos
  - ❌ NÃO deve mostrar informações de produção

- **Mini KDS (AppStaff):** http://localhost:5173/garcom
  - ✅ Deve mostrar pedidos do restaurante correto
  - ✅ Deve mostrar tarefas relacionadas


### Beta (beta)

- **KDS Interno:** http://localhost:5173/kds-minimal
  - ✅ Deve mostrar todos os pedidos ativos (OPEN, IN_PREP, READY)
  - ✅ Deve mostrar tempos e atrasos
  - ✅ Deve permitir marcar itens como prontos

- **KDS Público:** http://localhost:5173/public/beta/kds
  - ✅ Deve mostrar APENAS pedidos READY
  - ❌ NÃO deve mostrar pedidos em preparo
  - ❌ NÃO deve mostrar tempos ou atrasos

- **Status do Cliente:** http://localhost:5173/public/beta/order/b272d2aa-6709-4213-b2d0-f0e5311f5ac5
  - ✅ Deve mostrar APENAS este pedido
  - ❌ NÃO deve mostrar outros pedidos
  - ❌ NÃO deve mostrar informações de produção

- **Mini KDS (AppStaff):** http://localhost:5173/garcom
  - ✅ Deve mostrar pedidos do restaurante correto
  - ✅ Deve mostrar tarefas relacionadas


### Gamma (gamma)

- **KDS Interno:** http://localhost:5173/kds-minimal
  - ✅ Deve mostrar todos os pedidos ativos (OPEN, IN_PREP, READY)
  - ✅ Deve mostrar tempos e atrasos
  - ✅ Deve permitir marcar itens como prontos

- **KDS Público:** http://localhost:5173/public/gamma/kds
  - ✅ Deve mostrar APENAS pedidos READY
  - ❌ NÃO deve mostrar pedidos em preparo
  - ❌ NÃO deve mostrar tempos ou atrasos

- **Mini KDS (AppStaff):** http://localhost:5173/garcom
  - ✅ Deve mostrar pedidos do restaurante correto
  - ✅ Deve mostrar tarefas relacionadas


### Delta (delta)

- **KDS Interno:** http://localhost:5173/kds-minimal
  - ✅ Deve mostrar todos os pedidos ativos (OPEN, IN_PREP, READY)
  - ✅ Deve mostrar tempos e atrasos
  - ✅ Deve permitir marcar itens como prontos

- **KDS Público:** http://localhost:5173/public/delta/kds
  - ✅ Deve mostrar APENAS pedidos READY
  - ❌ NÃO deve mostrar pedidos em preparo
  - ❌ NÃO deve mostrar tempos ou atrasos

- **Mini KDS (AppStaff):** http://localhost:5173/garcom
  - ✅ Deve mostrar pedidos do restaurante correto
  - ✅ Deve mostrar tarefas relacionadas


## Validações de Isolamento


### Entre Restaurantes

- [ ] KDS de Alpha NÃO mostra pedidos de Beta/Gamma/Delta
- [ ] KDS de Beta NÃO mostra pedidos de Alpha/Gamma/Delta
- [ ] KDS de Gamma NÃO mostra pedidos de Alpha/Beta/Delta
- [ ] KDS de Delta NÃO mostra pedidos de Alpha/Beta/Gamma

### Entre Views

- [ ] Cliente vê APENAS seu pedido
- [ ] KDS público vê APENAS pedidos READY
- [ ] KDS interno vê todos os pedidos ativos
- [ ] Nenhuma view mostra informações de outros restaurantes

## Dados de Teste


- Total de pedidos criados: 12
- Pedidos READY: 4
- Pedidos OPEN: 8
- Restaurantes: 4
