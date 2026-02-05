# QR Mesa

## 1. Tipo de Rota
- Web de Configuração (config) + rota pública (uso pelo cliente)

## 2. Caminho(s)
- Config: `/config` (secção Localização — "QR para página pública"); Público: `/public/:slug/mesa/:number`

## 3. Objetivo
O dono configura o slug e obtém QR por mesa; o cliente escaneia o QR e acede ao menu já associado à mesa (`/public/:slug/mesa/:number`), faz pedido com origem `QR_MESA`. Liga sala (mesa) ao pedido sem intervenção do garçom no momento do pedido. Componentes: PublicQRSection (config), TablePage (público).

## 4. Quem acessa
- Dono na web (config); cliente no browser (página pública por mesa). Rota pública não exige auth.

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido em /config; mostrar "Complete a configuração do restaurante (Config → Identidade) para gerar QR codes." |
| TRIAL | Permitido; gerar QR do menu geral e QR por mesa |
| ACTIVE | Permitido; idem |
| SUSPENDED | Permitido (leitura/config conforme política) |

> Nunca bloquear por billing ou dados. Página pública `/public/*` é ALLOW sem auth (CoreFlow Public Void Protocol).

## 6. Conexão com o Core
- CoreFlow: `/config` em `isWebConfigPath` → ALLOW. `/public/*` → ALLOW (público).
- Guards aplicáveis: não usar guards operacionais na config; público sem guard de auth.
- Nunca usar guards operacionais na config

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): `restaurants` (slug), `menu_items` ou equivalente, `orders` (com `origin: QR_MESA`, `table_number`). RPC: `create_order_atomic` com parâmetros de mesa (OrderWriter FASE 9).
- Backend futuro: mesmo contrato; página pública deve ler menu e escrever pedido no Core.
- Pode operar sem backend real? Config SIM (estado vazio se sem slug). Público: pedido falha com mensagem humana se Core indisponível.

## 8. Impacto Operacional
- **TPV:** Pedidos QR_MESA aparecem no fluxo do TPV; estado pronto pode ser fechado no TPV.
- **KDS:** Pedidos QR_MESA entram no KDS como qualquer pedido.
- **AppStaff:** Nenhum directo; mesa associada ao pedido.
- **Relatórios:** Pedidos por origem QR_MESA.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [x] Parcial (config: PublicQRSection em ConfigLocationPage)
- [x] Funcional (público: TablePage implementado)
- Observações: Config em /config; público em /public/:slug/mesa/:number. Backend/Core para pedidos QR_MESA conforme OrderWriter.

## 10. Próximos Passos Técnicos
- [ ] Garantir que rotas `/config` e `/public/*` estão cobertas pelo CoreFlow (já estão).
- [ ] Verificar que `create_order_atomic` aceita `origin` e `table_number`.
- [ ] Revisar mensagens de estado vazio na PublicQRSection para alinhar com doc.
