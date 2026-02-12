# Mentor IA

## 1. Tipo de Rota

- Web de Configuração (Portal do Dono)

## 2. Caminho(s)

- `/mentor`

## 3. Objetivo

IA mentora como observador operacional: sugestões baseadas em tarefas, pedidos, tempos e saúde do restaurante (ex.: "Verificar gargalo na cozinha", "Priorizar saída de pedidos"). O dono usa para ter um "segundo par de olhos" sobre a operação, sem substituir decisões humanas. Referência: aiGateway (mentor_advice), taskMentor, trialGuideContent.

## 4. Quem acessa

- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema

| Estado    | Comportamento                                                                           |
| --------- | --------------------------------------------------------------------------------------- |
| SETUP     | Permitido; estado vazio: "Complete a configuração e abra o TPV para receber sugestões." |
| TRIAL     | Permitido; sugestões baseadas em dados reais do trial                                   |
| ACTIVE    | Permitido; sugestões reais                                                              |
| SUSPENDED | Permitido (read-only conforme política)                                                 |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core

- CoreFlow: rota não está em `isWebConfigPath`; após auth e hasOrg, não é operacional → ALLOW.
- Guards aplicáveis: não usar guards operacionais. rolePermissions inclui `/mentor` para owner/manager; na web só Dono (CONTRATO_OWNER_ONLY_WEB).
- Nunca usar guards operacionais

## 7. Fonte de Dados

- Banco local (Docker Core / Supabase local): dados agregados de pedidos, tarefas, métricas operacionais (ex.: `get_operational_metrics`). RPCs/endpoints esperados: `get_mentor_suggestions`, `get_task_suggestions`. aiGateway e taskMentor analisam contexto.
- Backend futuro: mesmo contrato; sugestões derivadas de eventos existentes.
- Pode operar sem backend real? SIM ("Ainda não há sugestões. Opere o restaurante (TPV, tarefas) para o Mentor analisar.")

## 8. Impacto Operacional

- **TPV:** Nenhum directo; sugestões podem referir pedidos/tempos do TPV.
- **KDS:** Nenhum directo; sugestões podem referir cozinha.
- **AppStaff:** Pode alimentar permissões e relatórios; sugestões podem referir tarefas.
- **Relatórios:** Nenhum directo.
- **Billing:** Nenhum.

## 9. Estado Atual

- [ ] Mock
- [x] Parcial
- [ ] Funcional
- Observações: MentorDashboardPage existe; integração com aiGateway/taskMentor e RPCs podem estar parciais.

## 10. Próximos Passos Técnicos

- [ ] Garantir `/mentor` em `isWebConfigPath` se for exigido tratamento explícito.
- [ ] Ligar sugestões a EventMonitor/tarefas e métricas do Core.
- [ ] Estado vazio e mensagens humanas; nunca "sugestões de simulação".
