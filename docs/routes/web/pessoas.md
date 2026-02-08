# Pessoas (Perfis Operacionais)

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/config/people` (e `/config/people/employees`, `/config/people/roles`)

## 3. Objetivo
Criar e gerir pessoas (funcionários/gerentes) com nome e função; cada pessoa recebe um código e QR para check-in no App Staff. FASE 3 Passo 1: perfis operacionais (gm_restaurant_people) com código/QR. Não é gestão de "perfis Dono/Gerente/Staff" na web como muletas — é cadastro de pessoas para operação (App Staff).

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff (staff usa App Staff no telemóvel com o código/QR)
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; estado vazio ou CTA para criar primeira pessoa |
| TRIAL | Permitido; dados reais |
| ACTIVE | Permitido; dados reais |
| SUSPENDED | Permitido (read-only ou aviso conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `/config` em `isWebConfigPath` → ALLOW. Subpath `/config/people` herda.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): tabela `gm_restaurant_people` (id, restaurant_id, name, role, staff_code, qr_token, created_at, updated_at). Reader: RestaurantPeopleReader; escrita via Supabase/client.
- Backend futuro: mesmo contrato; criar/editar pessoas; gerar código e QR.
- Pode operar sem backend real? SIM (estado vazio: "Crie pessoas (funcionários/gerentes) com nome e função. Cada pessoa recebe um código e QR para check-in no App Staff.")

## 8. Impacto Operacional
- **TPV:** Nenhum directo.
- **KDS:** Nenhum.
- **AppStaff:** Directo — pessoas criadas aqui fazem check-in no App Staff com código/QR; podem alimentar permissões e relatórios.
- **Relatórios:** Pessoas podem ser usadas em relatórios de desempenho/tarefas.
- **Billing:** Nenhum.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Funcional
- Observações: ConfigPeoplePage e RestaurantPeopleSection implementados; criação de pessoas com código e QR; integração com gm_restaurant_people.

## 10. Próximos Passos Técnicos
- [ ] Garantir que subpaths `/config/people*` estão cobertos por `isWebConfigPath` (já estão via `/config`).
- [ ] Alinhar mensagens de estado vazio com CONTRATO_OWNER_ONLY_WEB (sem "modo Gerente/Staff" na web).
