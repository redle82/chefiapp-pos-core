# Query Discipline Contract (1000-ready)

**Objetivo:** Garantir isolamento por tenant e performance previsível em escala. Nenhuma query operacional ao Core sem âmbito por restaurante.

**Status:** OBRIGATÓRIO para Fase 1 (1000 restaurantes).  
**Autoridade:** Docker Core (PostgREST); aplicação (readers/writers em core-boundary).

---

## Regra

**Todas as queries ao Core devem ser scoped por `restaurant_id` (ou por entidade filha de restaurant, ex.: `order_id` obtido de lista já filtrada por `restaurant_id`).**

- **Listagens:** Sem exceção, toda a listagem (SELECT que devolve múltiplas linhas) deve incluir filtro por `restaurant_id` (ou equivalente tenant).
- **Leituras por PK:** Aceitável ler por `id` quando o `id` foi obtido em contexto já scoped (ex.: order_id de lista de pedidos do restaurante).
- **Escritas:** Toda a escrita (INSERT/UPDATE) deve incluir `restaurant_id` no payload ou validar que a entidade pertence ao restaurante.

**Falha explícita se faltar filtro:** Em desenvolvimento, considerar assert ou log quando algum reader/writer for chamado sem `restaurant_id` em contexto de listagem.

---

## Índices

Tabelas de alto volume devem ter índices compostos com `restaurant_id` em primeiro lugar:

- `gm_orders(restaurant_id, created_at DESC)` — listagens por restaurante ordenadas por data.
- `gm_reservations(restaurant_id, reservation_date)` — já existente.
- `gm_equipment(restaurant_id)`, `gm_tables(restaurant_id)` — já existentes.

Ver migration `docker-core/schema/migrations/20260217_query_discipline_indexes.sql`.

---

## Auditoria

Checklist de verificação: [docs/audit/QUERY_DISCIPLINE_CHECKLIST.md](../audit/QUERY_DISCIPLINE_CHECKLIST.md).

---

**Conclusão:** Query Discipline é lei de infraestrutura. Uma query sem filtro em 1000 restaurantes mata o banco. Este contrato protege a escala.
