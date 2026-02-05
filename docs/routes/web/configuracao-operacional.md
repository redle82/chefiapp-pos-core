# Configuração Operacional

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/config` (layout) e subpaths: `/config/identity`, `/config/location`, `/config/schedule`, `/config/people`, `/config/payments`, `/config/integrations`, `/config/modules`, `/config/perception`, `/config/status`

## 3. Objetivo
Árvore de configuração do restaurante: identidade, localização, horários, pessoas, pagamentos, integrações, módulos, percepção operacional e estado. O dono configura tudo o que afecta a operação (TPV, KDS, App Staff, página pública, QR, etc.) a partir desta rota. "Configurar restaurante" no sidebar = esta rota.

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; essencial para bootstrap (identidade, localização, primeiro produto) |
| TRIAL | Permitido; dados reais |
| ACTIVE | Permitido; dados reais |
| SUSPENDED | Permitido (read-only ou aviso conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `isWebConfigPath(path)` para `path.startsWith("/config")` → ALLOW para hasOrg.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): restaurants, gm_restaurant_people, horários, localização, módulos, etc. Cada subpath pode ter suas tabelas (ex.: ConfigIdentityPage, ConfigLocationPage, ConfigPeoplePage, ConfigPerceptionPage).
- Backend futuro: mesmo contrato; escrita em tabelas de configuração; leitura para estado vazio.
- Pode operar sem backend real? SIM para muitas secções (estado vazio ou mocks); algumas (ex.: pessoas) podem precisar de backend para persistir.

## 8. Impacto Operacional
- **TPV:** Configuração de pagamentos, módulos e status afecta o que o TPV pode fazer.
- **KDS:** Módulos e status afectam disponibilidade do KDS.
- **AppStaff:** Pessoas (código/QR) e módulos afectam App Staff.
- **Relatórios:** Configuração de horários e localização afecta relatórios.
- **Billing:** Nenhum directo (billing é rota separada); config pode mostrar link para billing.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Funcional
- Observações: ConfigLayout e páginas por secção (identity, location, schedule, people, payments, perception, modules, status) implementados. Índice em implementation/ e web-config/ referenciam estas secções.

## 10. Próximos Passos Técnicos
- [ ] Manter lista de subpaths alinhada com App.tsx (Route path="/config" ...).
- [ ] Garantir que nenhuma secção termina em return null; estado vazio ou loading conforme RETURN_NULL_AUDIT.
