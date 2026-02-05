# Reservas

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/reservations`

## 3. Objetivo
Ver e gerir reservas do dia/semana: confirmar, cancelar, no-shows, capacidade e horários. O dono usa para alinhar sala e equipa com a procura. Referência possível: RESERVATION_ENGINE.md.

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; estado vazio com CTA para Config (horários/localização) |
| TRIAL | Permitido; dados reais |
| ACTIVE | Permitido; dados reais |
| SUSPENDED | Permitido (read-only ou aviso conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `resolveNextRoute` — rota não é operacional; ALLOW para hasOrg.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): tabela lógica `reservations` (restaurant_id, date, time, guest_name, guests_count, status, table_id). RPCs esperadas: `list_reservations_by_date`, `create_reservation`, `update_reservation_status`.
- Backend futuro: mesmo contrato; se não existir, lista vazia e estado vazio.
- Pode operar sem backend real? SIM ("Ainda não há reservas para esta data." / "Configure horários e mesas em Config para aceitar reservas.")

## 8. Impacto Operacional
- **TPV:** Nenhum directo; reservas podem ser mostradas no TPV se implementado.
- **KDS:** Nenhum.
- **AppStaff:** Nenhum.
- **Relatórios:** Dados de reservas podem alimentar relatórios de ocupação.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [x] Parcial
- [ ] Funcional
- Observações: `ReservationsDashboardPage` existe; motor de reservas e RPCs podem estar parciais.

## 10. Próximos Passos Técnicos
- [ ] Incluir `/reservations` em `isWebConfigPath` se o fluxo usar prefixos diferentes.
- [ ] Implementar ou ligar RPCs/tabelas de reservas no backend local.
- [ ] Estado vazio e CTAs alinhados com Config (horários, mesas).
