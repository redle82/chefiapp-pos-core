# Compras

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/purchases`

## 3. Objetivo
Gestão de compras e fornecedores: listar e criar pedidos de compra, associar fornecedores, acompanhar entregas e stock resultante. O dono usa esta ecrã para repor matérias-primas e manter inventário alinhado com a operação.

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; estado vazio ou CTA para Config |
| TRIAL | Permitido; dados reais |
| ACTIVE | Permitido; dados reais |
| SUSPENDED | Permitido (read-only ou aviso conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `resolveNextRoute` — rota não está em `isWebConfigPath`; após auth e hasOrg, não é operacional → ALLOW.
- Guards aplicáveis: não usar guards operacionais; nunca bloquear por systemState/billing.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): tabelas lógicas `purchase_orders`, `purchase_order_lines`, `suppliers`. RPCs esperadas: `list_purchase_orders`, `create_purchase_order`, `list_suppliers`, `get_inventory_low_stock`.
- Backend futuro: contrato esperado = mesmo esquema; se RPC não existir, retornar lista vazia e UI em estado vazio.
- Pode operar sem backend real? SIM (estado vazio honesto: "Ainda não há pedidos de compra." / "Adicione fornecedores para criar o primeiro pedido.")

## 8. Impacto Operacional
- **TPV:** Nenhum directo; compras podem repor stock que o TPV consome.
- **KDS:** Nenhum directo.
- **AppStaff:** Nenhum directo.
- **Relatórios:** Pedidos de compra e entregas podem alimentar relatórios de stock/custos.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [x] Parcial
- [ ] Funcional
- Observações: Página `PurchasesDashboardPage` existe; backend/RPCs podem estar incompletos. 404 em endpoints de compras em ambiente local não bloqueia render; estado vazio deve ser mostrado.

## 10. Próximos Passos Técnicos
- [ ] Garantir que `/purchases` está em `isWebConfigPath` se for exigido tratamento explícito.
- [ ] Implementar ou mapear RPCs/tabelas de compras no backend local.
- [ ] Estado vazio com mensagens humanas e CTAs: "Criar pedido de compra", "Adicionar fornecedor".
