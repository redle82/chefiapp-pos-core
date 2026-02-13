# Optional Feature Tables Contract

**Objetivo:** Definir quais tabelas do Core são opcionais, como o frontend as trata em DEV vs PROD, e como ativá-las. O frontend nunca presume schema completo; tabelas opcionais são opt-in consciente.

---

## Lista canónica de tabelas opcionais

- `gm_customers` — clientes por restaurante (fidelidade: pontos, visitas, spend). Usado por LoyaltyService, customersService (admin), GroupEngine, OrderContextReal.
- `gm_reservations` — reservas (e tabelas relacionadas). Usado por fluxos de reserva e calendário.

Tabelas futuras “satélite” (ex.: stock avançado, loyalty logs) devem seguir o mesmo padrão: incluídas no probe opcional e na lista em `dockerCoreFetchClient.ts` (`OPTIONAL_TABLES`).

---

## Regras de comportamento

### Em DEV (browser, `import.meta.env.DEV`)

1. **Probe:** O frontend **não** faz GET a `gm_customers` nem `gm_reservations` no arranque. Evita 404 na consola quando as migrations ainda não foram aplicadas.
2. **Marcação:** Essas tabelas são marcadas como indisponíveis por **24h** (TTL em memória). Qualquer acesso posterior devolve `{ data: null, error: { message: "Table unavailable", code: "42P01" } }` **sem novo pedido de rede**.
3. **Log único:** Na primeira vez que o código tenta usar uma tabela opcional indisponível, o cliente emite **uma vez por sessão** (por tabela) um `console.info` com o texto:  
   `[DEV] <table> indisponível — aplica migrations para ativar: ./scripts/core/apply-missing-migrations.sh`

### Em PROD (ou build não-DEV)

1. **Probe:** O probe corre normalmente; faz GET a cada tabela opcional. Se a tabela não existir (404), é marcada indisponível por **30s** (TTL padrão).
2. **Acessos:** Enquanto indisponível, os acessos são short-circuited em memória (sem novo GET). Após o TTL, o próximo acesso tenta de novo a rede.

---

## Como ativar as tabelas

1. Core a correr: `docker compose -f docker-core/docker-compose.core.yml up -d`
2. Aplicar migrations: `./scripts/core/apply-missing-migrations.sh`
3. Recarregar a app; as chamadas a `gm_customers` e `gm_reservations` passam a ser feitas normalmente.

Ver também: [DEV_CORE_DOWN.md](../DEV_CORE_DOWN.md) — secção “Tabelas opcionais”.

---

## Princípio

O frontend **nunca presume** que o schema do Core está completo. Tabelas opcionais existem para funcionalidades avançadas (fidelidade, reservas, etc.); em ambientes mínimos ou em DEV sem migrations aplicadas, o sistema continua a funcionar e a consola permanece limpa. Ativação é explícita (script de migrations), não magia automática.

---

## Referências

- **Implementação:** `merchant-portal/src/core/infra/dockerCoreFetchClient.ts` — `OPTIONAL_TABLES`, `probeOptionalTables()`, `optionalTableLoggedThisSession`, resposta "Table unavailable" (42P01).
- **Script de ativação:** `scripts/core/apply-missing-migrations.sh`
- **Doc de DEV:** [DEV_CORE_DOWN.md](../DEV_CORE_DOWN.md)
