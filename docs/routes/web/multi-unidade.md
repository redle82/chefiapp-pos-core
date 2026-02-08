# Multi-Unidade

## 1. Tipo de Rota
- Web de Configuração (Portal do Dono)

## 2. Caminho(s)
- `/groups`

## 3. Objetivo
Para donos com mais de um local: ver e comparar unidades (vendas, desempenho, benchmarks), gerir grupos de restaurantes e eventualmente configuração partilhada. Um único local usa esta rota como "pronto para o futuro" com estado vazio honesto.

## 4. Quem acessa
- Dono (hasOrganization === true)
- Nunca staff
- Nunca TPV/KDS

## 5. Estados do Sistema
| Estado | Comportamento |
|--------|----------------|
| SETUP | Permitido; estado vazio: "Um único restaurante configurado." |
| TRIAL | Permitido; se houver mais de um tenant, mostrar lista e benchmarks; senão estado vazio |
| ACTIVE | Permitido; idem |
| SUSPENDED | Permitido (read-only conforme política) |

> Nunca bloquear por billing ou dados.

## 6. Conexão com o Core
- CoreFlow: `resolveNextRoute` — rota não é operacional; ALLOW para hasOrg.
- Guards aplicáveis: não usar guards operacionais.
- Nunca usar guards operacionais

## 7. Fonte de Dados
- Banco local (Docker Core / Supabase local): `restaurants` (multi-tenant), `groups` ou `restaurant_groups`, agregação por tenant. RPCs esperadas: `list_restaurants_by_owner`, `get_group_benchmarks`, `get_sales_by_unit`. Modelo pode incluir `operation_type: 'MULTIUNIDADE'` (docker-core/types).
- Backend futuro: mesmo contrato; sem dados = estado vazio.
- Pode operar sem backend real? SIM ("Um único restaurante configurado." / "Multi-unidade estará disponível quando tiver mais locais.")

## 8. Impacto Operacional
- **TPV:** Nenhum directo; totais por unidade podem ser agregados.
- **KDS:** Nenhum.
- **AppStaff:** Nenhum.
- **Relatórios:** Comparação de vendas/desempenho por unidade.
- **Billing:** Nenhum; multi-unidade não bloqueia billing.

## 9. Estado Atual
- [ ] Mock
- [ ] Parcial
- [x] Documentado
- Observações: Rota listada no dashboard em "EM EVOLUÇÃO"; implementação completa pendente.

## 10. Próximos Passos Técnicos
- [ ] Garantir `/groups` em `isWebConfigPath` se necessário.
- [ ] Definir modelo de grupos/unidades no Core ou Supabase.
- [ ] Implementar página com estado vazio e depois lista/benchmarks quando houver dados.
