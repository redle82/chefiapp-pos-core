# Percepção Operacional

## 1. Tipo de Rota

- Web de Configuração (Portal do Dono)

## 2. Caminho(s)

- `/config/perception`

## 3. Objetivo

Configuração de câmera e análise com IA para percepção operacional (ex.: ocupação, filas, alertas visuais). O dono configura e visualiza dados derivados desta camada. Referência: PERCEPCAO_ARQUITETURA_EDGE.md; módulo no dashboard "Percepção Operacional" com route `/config/perception`.

## 4. Quem acessa

- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema

| Estado    | Comportamento                                    |
| --------- | ------------------------------------------------ |
| SETUP     | Permitido; estado vazio ou CTA para configurar   |
| TRIAL     | Permitido; dados reais se câmera/IA activos      |
| ACTIVE    | Permitido; idem                                  |
| SUSPENDED | Permitido (read-only ou aviso conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core

- CoreFlow: `path.startsWith("/config")` → `isWebConfigPath` = true → ALLOW.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados

- Banco local (Docker Core / Supabase local): configuração de percepção (câmera, endpoints de análise); dados agregados ou eventos de IA. Backend futuro: edge/cloud conforme PERCEPCAO_ARQUITETURA_EDGE.
- Pode operar sem backend real? SIM (estado vazio: "Configure a percepção operacional (câmera e análise) para activar.").

## 8. Impacto Operacional

- **TPV:** Nenhum directo; alertas visuais podem ser mostrados noutras rotas.
- **KDS:** Nenhum directo.
- **AppStaff:** Nenhum directo.
- **Relatórios:** Dados de ocupação/filas podem alimentar relatórios.
- **Billing:** Nenhum.

## 9. Estado Atual

- [ ] Mock
- [x] Parcial
- [ ] Funcional
- Observações: ConfigPerceptionPage existe; integração com edge/IA pode estar parcial. Módulo listado no dashboard em "EM USO HOJE" ou "EM EVOLUÇÃO" conforme implementação.

## 10. Próximos Passos Técnicos

- [ ] Alinhar estado da página com PERCEPCAO_ARQUITETURA_EDGE.
- [ ] Estado vazio e mensagens humanas; nunca "simulação" para percepção.
