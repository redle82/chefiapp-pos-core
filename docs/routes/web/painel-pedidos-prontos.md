# Painel de Pedidos Prontos

## 1. Tipo de Rota
- Operação (KDS); link na Web de Configuração é navegação para a vista operacional.

## 2. Caminho(s)
- `/op/kds` (e legacy `/app/kds`). Dashboard módulo "Painel Pedidos Prontos" aponta para esta vista.

## 3. Objetivo
Vista onde a cozinha (ou ecrã de "pedidos prontos") vê os pedidos em preparação e marca como prontos. O dono, na web, tem um link no dashboard para abrir esta vista. Designação no sidebar: "Painel Pedidos Prontos" = vista KDS.

## 4. Quem acessa
- Dono pode aceder via link no dashboard (mesmo utilizador que config). Operação: cozinha/salão na vista `/op/kds`. Não é rota exclusiva da "web de config" — é operacional, com link a partir da web.

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | REDIRECT para `/onboarding/first-product` ao tentar aceder a `/op/kds` (guard operacional) |
| TRIAL | Permitido; KDS com dados reais do trial |
| ACTIVE | Permitido; dados reais |
| SUSPENDED | Conforme política (ALLOW leitura ou REDIRECT) |

> Esta rota é OPERAÇÃO; em SETUP é bloqueada. Nunca bloquear outras rotas web por billing.

## 6. Conexão com o Core
- CoreFlow: `isOperationalPath("/op/kds")` = true; quando `systemState === "SETUP"` → REDIRECT para `/onboarding/first-product`. Quando TRIAL/ACTIVE → ALLOW.
- Guards aplicáveis: guard operacional aplicado em CoreFlow (secção 2.5).
- Nunca usar guards operacionais nas rotas web; esta rota é excepção — é operacional.

## 7. Fonte de Dados
- Banco local (Docker Core): Orders, order_items (estado: em preparo, pronto). Listagem de pedidos ativos, atualização de estado. Backend local obrigatório para dados úteis.
- Pode operar sem backend real? SIM para render (estado vazio: "Ainda não há pedidos. Os pedidos aparecem quando forem criados no TPV ou no app."); NÃO para dados em uso.

## 8. Impacto Operacional
- **TPV:** Estado "pronto" no KDS pode afetar fluxo de fecho no TPV.
- **KDS:** Esta é a rota KDS; impacto directo na operação da cozinha.
- **AppStaff:** Pedidos podem ser vistos/actualizados conforme integração.
- **Relatórios:** Tempos de preparo e estados alimentam métricas.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Funcional
- Observações: KDS implementado; guard em CoreFlow já aplicado. "Painel Pedidos Prontos" no dashboard é a entrada para esta vista.

## Regra de ouro (web vs operação)

- **Web apenas observa; nunca executa ações operacionais.** O link no dashboard para "Painel Pedidos Prontos" leva à vista KDS (operacional); na web o dono pode **ver** a vista, mas a execução (marcar pedidos como prontos, etc.) é operação, não "configuração web". Nunca permitir ações operacionais críticas (ex.: fechar caixa, alterar estado de pedido) por uma rota puramente web de configuração; KDS é rota operacional. Esta separação protege juridicamente e evita ambiguidade.

## 10. Próximos Passos Técnicos
- [ ] Manter consistência entre nome no sidebar ("Painel Pedidos Prontos") e doc.
- [ ] Se existir vista "só pedidos prontos" (pública) separada, documentar path e guard à parte.
