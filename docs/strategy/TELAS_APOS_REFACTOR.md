# Telas após refatoração — ver no browser

Guia mínimo para abrir o sistema no browser e percorrer o que existe hoje.

---

## Serviços

| Serviço             | Comando / Estado                                                    | URL / Porta                     |
| ------------------- | ------------------------------------------------------------------- | ------------------------------- |
| **Docker Core**     | `cd docker-core && docker compose -f docker-compose.core.yml up -d` | PostgREST: 3001, Realtime: 4000 |
| **Merchant Portal** | `cd merchant-portal && npm run dev`                                 | **<http://localhost:5175>**       |

Se a porta 5175 estiver ocupada, o Vite falha (strictPort). Liberta a porta ou para o processo que a usa.

---

## Ordem sugerida (fluxo real)

Abre **<http://localhost:5175>** e segue por esta ordem:

### 1. Entrada

| O que ver                    | URL                                     |
| ---------------------------- | --------------------------------------- |
| Landing                      | <http://localhost:5175/>                  |
| Auth (login/registo)         | <http://localhost:5175/auth>              |
| Bootstrap (restaurante novo) | <http://localhost:5175/bootstrap>         |
| Seleção de tenant            | <http://localhost:5175/app/select-tenant> |

### 2. Operação (requer tenant + operacional)

| O que ver                | URL                                 |
| ------------------------ | ----------------------------------- |
| Dashboard                | <http://localhost:5175/app/dashboard> |
| **TPV** (ponto de venda) | <http://localhost:5175/op/tpv>        |
| **KDS** (cozinha)        | <http://localhost:5175/op/kds>        |
| Menu Builder             | <http://localhost:5175/menu-builder>  |
| App Staff (garçom)       | <http://localhost:5175/op/staff>      |

### 3. Config e outros

| O que ver                                           | URL                                   |
| --------------------------------------------------- | ------------------------------------- |
| Config (identidade, local, horários, pessoas, etc.) | <http://localhost:5175/config>          |
| Inventário / stock                                  | <http://localhost:5175/inventory-stock> |
| Tarefas                                             | <http://localhost:5175/task-system>     |
| Lista de compras                                    | <http://localhost:5175/shopping-list>   |
| Alertas                                             | <http://localhost:5175/app/alerts>      |
| Billing                                             | <http://localhost:5175/billing>         |

### 4. Público (sem auth)

| O que ver                         | URL                                    |
| --------------------------------- | -------------------------------------- |
| Web pública (slug do restaurante) | <http://localhost:5175/public/:slug>     |
| KDS público                       | <http://localhost:5175/public/:slug/kds> |

---

## Fluxo TPV → Pedido → KDS (pós-refatoração)

1. **op/tpv** — Desbloquear (lock screen) → iniciar turno → abrir caixa.
2. Selecionar mesa → adicionar primeiro item → **pedido nasce aqui**.
3. Enviar à cozinha (prepare) → mudança de estado.
4. **op/kds** — Pedido entra; marcar item pronto; impacto no pedido.
5. Voltar ao TPV — Pronto → Servir → Pagar → fechar ciclo.

Guards (caixa, turno, Core online) usam mensagens centralizadas em `GuardMessages.ts` (Fase 4).

---

## Se algo não abrir

- **Core em baixo:** TPV/KDS podem mostrar indisponível ou fallback; sobe o Docker Core.
- **Sem tenant / sem bootstrap:** Vai a `/bootstrap` ou `/app/select-tenant` conforme o fluxo.
- **Porta 5175 em uso:** `lsof -i :5175` para ver o processo; mata ou usa esse mesmo browser que já está a servir a app.

Quando tiveres a app a correr, usa o [Ritual de abrir o sistema em telas](./RITUAL_ABRIR_SISTEMA_TELAS.md) para observar sem julgar.
