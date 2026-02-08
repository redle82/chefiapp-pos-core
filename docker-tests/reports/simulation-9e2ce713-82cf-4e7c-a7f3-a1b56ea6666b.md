# MEGA OPERATIONAL SIMULATOR - Relatório v2

## Configuração
- **Modo:** small
- **Seed:** 1769275869949
- **Duração Real:** 300.8s
- **Horas Simuladas:** 24h
- **Multiplicador:** 288.0x
- **Restaurantes:** 20

## Métricas Gerais

| Métrica | Valor |
|---------|-------|
| Pedidos Criados | 964 |
| Print Jobs | 2171 |
| Eventos | 994 |
| Tarefas Criadas | 210 |
| Tarefas Completadas | 196 |
| Tarefas Escaladas | 89 |
| Tarefas Failed | 14 |

## Escalonamento (SLA + Hard-Blocking)

| Métrica | Valor |
|---------|-------|
| Escalações → Manager | 66 |
| Escalações → Owner | 23 |
| Bloqueios de Turno | 45 |
| Overrides de Turno | 10 |

## Offline (FASE 2B)

| Métrica | Valor |
|---------|-------|
| Eventos Offline | 40 |
| Janelas Ativadas | 40 |
| Pedidos Enfileirados | 70 |
| Pedidos Sincronizados | 70 |
| Pedidos Failed | 0 |
| Duplicatas Prevenidas | 0 |

## Pedidos por Fonte

| Fonte | Quantidade |
|-------|------------|
| Mobile | 395 |
| POS | 409 |
| QR Web | 160 |

## Distribuição por Hora

| Hora | Pedidos |
|------|---------|
| 0:00 | 0 |
| 1:00 | 0 |
| 2:00 | 0 |
| 3:00 | 0 |
| 4:00 | 0 |
| 5:00 | 0 |
| 6:00 | 0 |
| 7:00 | 0 |
| 8:00 | 0 |
| 9:00 | 0 |
| 10:00 | 54 |
| 11:00 | 79 |
| 12:00 | 83 |
| 13:00 | 79 |
| 14:00 | 86 |
| 15:00 | 77 |
| 16:00 | 87 |
| 17:00 | 85 |
| 18:00 | 95 |
| 19:00 | 74 |
| 20:00 | 78 |
| 21:00 | 62 |
| 22:00 | 25 |
| 23:00 | 0 |

## Log de Escalações

| Hora | Restaurante | Tarefa | De → Para | Atraso |
|------|-------------|--------|-----------|--------|
| 10:06 | Test Restaurant 1 | Verificar caixa inicial | manager (L0) → owner (L1) | 3min |
| 10:06 | Test Restaurant 1 | Verificar equipamentos | manager (L0) → owner (L1) | 3min |
| 10:06 | Test Restaurant 3 | Verificar equipamentos | manager (L0) → owner (L1) | 3min |
| 10:06 | Test Restaurant 5 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 3min |
| 10:06 | Test Restaurant 5 | Verificar equipamentos | manager (L0) → owner (L1) | 3min |
| 10:06 | Restaurant 7 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 10:06 | Restaurant 7 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 7 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 9 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 10:06 | Restaurant 9 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 11 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 10:06 | Restaurant 11 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 13 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 10:06 | Restaurant 13 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 13 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 15 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 10:06 | Restaurant 15 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |
| 10:06 | Restaurant 15 | Verificar equipamentos | manager (L0) → owner (L1) | 2min |
| 10:07 | Restaurant 17 | Verificar temperatura das câma | kitchen (L0) → manager (L1) | 2min |
| 10:07 | Restaurant 17 | Verificar caixa inicial | manager (L0) → owner (L1) | 2min |

*... e mais 69 escalações*

## Validação

| Assert | Resultado |
|--------|-----------|
| Orphan Items | ✅ 0 |
| Pedidos Criados | ✅ 964 |
| Eventos | ✅ 994 |
| Tarefas Criadas | ✅ 210 |
| Tarefas Completadas | ✅ 196 |
| Tarefas Escaladas | 89 |
| Tarefas Failed | ⚠️ 14 |
| Offline Sync Failed | ✅ 0 |
| Duplicatas Prevenidas | ✅ 0 |

## Log Offline

| Hora | Restaurante | Evento | Detalhes |
|------|-------------|--------|----------|
| 13:05 | Test Restaurant 2 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Test Restaurant 3 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Test Restaurant 5 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Restaurant 6 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Restaurant 7 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Restaurant 9 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Restaurant 17 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Restaurant 18 | OFFLINE_START | Lunch peak - queda de rede |
| 13:05 | Restaurant 20 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Test Restaurant 1 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Test Restaurant 4 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 8 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 11 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 12 | OFFLINE_START | Lunch peak - queda de rede |
| 13:10 | Restaurant 13 | OFFLINE_START | Lunch peak - queda de rede |

## Status: ✅ PASSED

---
*FASE 2A: SLA + Escalonamento + Hard-Blocking*
*FASE 2B: Offline Agressivo Durante Picos*
*Gerado em 2026-01-24T17:36:10.826Z*
