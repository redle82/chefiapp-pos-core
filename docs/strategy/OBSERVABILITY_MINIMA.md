# Observability mínima — Core ChefIApp OS

Um único sítio para saber onde ver logs do Core e como verificar se Postgres e PostgREST estão saudáveis. Sem ferramentas novas; só comandos e endpoints existentes.

---

## Logs do Core

**Como ver logs:** stdout dos containers; sem agregação externa por agora.

```bash
# Todos os serviços
docker compose -f docker-core/docker-compose.core.yml logs -f

# Serviço específico
docker compose -f docker-core/docker-compose.core.yml logs -f postgres
docker compose -f docker-core/docker-compose.core.yml logs -f postgrest
docker compose -f docker-core/docker-compose.core.yml logs -f nginx
docker compose -f docker-core/docker-compose.core.yml logs -f realtime
```

**Onde estão:** stdout dos containers. Para persistência ou agregação, configurar driver de logging do Docker ou ferramenta externa (fora do âmbito deste doc).

---

## Saúde do Postgres

**Comando:** exit code 0 = aceita conexões.

```bash
docker compose -f docker-core/docker-compose.core.yml exec postgres pg_isready -U postgres
```

**Esperado:** saída `accepting connections` e exit code 0.

---

## Saúde do PostgREST

**Comando:** HTTP 200 ou 404 (não 5xx).

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
```

Ou:

```bash
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/gm_restaurants?limit=1"
```

**Esperado:** `200` (ou `404` para alguns paths; o importante é não `5xx`). Se o Core estiver atrás de nginx na porta 3001, usar `http://localhost:3001`.

**Alternativa:** GET `http://localhost:3001/gm_restaurants?limit=1` retorna 200 e JSON com (possivelmente) array vazio ou uma linha.

---

## Saúde do Realtime (opcional)

- **Porta:** 4000 (WebSocket).
- **Verificação:** Porta aberta; handshake WebSocket possível (ex.: cliente browser ou ferramenta como websocat). Sem comando curl simples para WebSocket; ver documentação do Realtime (Supabase Realtime) se precisar de healthcheck automatizado.

---

## Referências

- Docker Core README: [docker-core/README.md](../../docker-core/README.md)
- ERO (consciência do sistema): [ERO_CANON.md](../ERO_CANON.md)
- Bootstrap 0 (World Boot) — smoke tests: [docs/boot/BOOTSTRAP_0_WORLD.md](../boot/BOOTSTRAP_0_WORLD.md)
- Troubleshooting no README do docker-core: secção "Troubleshooting" com logs por serviço.
