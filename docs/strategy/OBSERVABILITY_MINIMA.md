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

## SLIs/SLOs mínimos de OS (2026-alvo)

> Não são SLAs contratuais; são metas internas para tornar o ChefIApp™
> “enterprise-ready”. Devem ser medidos e acompanhados, não apenas
> declarados.

- **Disponibilidade Core (Postgres+PostgREST)**  
  - SLI: % de tempo em que o healthcheck Core (PostgREST 200) está verde.  
  - SLO alvo inicial: ≥ 99,0% mensal em ambientes de produção.

- **Latência de operações críticas (TPV/KDS)**  
  - Abertura de pedido (`create_order_atomic`)  
  - Pagamento de pedido (`performOrderAction('pay')`)  
  - Marcar item pronto (`markItemReady`)  
  - SLI: p95 da latência observada (do browser até resposta do Core).  
  - SLO alvo inicial: p95 < 400 ms em redes estáveis.

- **Taxa de erro em sincronizações fiscais**  
  - SLI: nº de `FISCAL_SYNC_FAILED` / nº total de `FISCAL_SYNC_*` no período.  
  - SLO alvo inicial: < 0,5% em produção.

- **Taxa de erro em criação de pedidos**  
  - SLI: nº de falhas em `create_order_atomic` / nº total de tentativas.  
  - SLO alvo inicial: < 0,1%.

Medições podem ser armazenadas no próprio Core ou num sistema de métricas
externo; o mínimo viável é ter:

- logs com `restaurant_id`/`device_id` (ver contrato de logging);  
- contadores agregados por dia/unidade, para análise posterior.

---

## Health real de módulos / terminais

Em modo Docker Core, cada módulo/terminal deve expor pelo menos:

- **Heartbeat** periódico (TPV, KDS, Staff) registado no Core:  
  - tabela sugerida: `gm_device_heartbeats` com `device_id`, `restaurant_id`,
    `module_id`, `last_seen_at`, `status`.
- **Estado agregado por restaurante**:  
  - view sugerida: `vw_runtime_health_by_restaurant` com:
    - nº de terminais TPV online/offline;  
    - nº de ecrãs KDS online/offline.

Essas informações alimentam:

- `HealthDashboardPage` (estado técnico);  
- cards de KDS/TPV online no dashboard multi‑unidade
  (`MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md`).

---

## Referências

- **Contrato de logging (app):** [OBSERVABILITY_LOGGING_CONTRACT.md](../architecture/OBSERVABILITY_LOGGING_CONTRACT.md) — Logger central, restaurant_id/device_id em cada log.
- **Painel interno (admin):** Rota `/admin/observability` — Core status + métricas (pedidos criados hoje, erros 24h, latência). O card **"Erros (últimas 24h)"** vem do store in-memory (esta sessão); evolução futura: tabela `gm_app_logs` no Core + Logger a escrever quando o backend for Docker. O card **"Latência média"** vem do store in-memory (últimas 50 chamadas desta sessão, operação `create_order_atomic`); evolução futura: métricas no Core ou Prometheus. Uso interno.
- Docker Core README: [docker-core/README.md](../../docker-core/README.md)
- ERO (consciência do sistema): [ERO_CANON.md](../ERO_CANON.md)
- Bootstrap 0 (World Boot) — smoke tests: [docs/boot/BOOTSTRAP_0_WORLD.md](../boot/BOOTSTRAP_0_WORLD.md)
- Troubleshooting no README do docker-core: secção "Troubleshooting" com logs por serviço.
