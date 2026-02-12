# RUNBOOK — Core offline em grupo multi‑unidade

> Procedimento quando o Docker Core fica indisponível afetando vários
> restaurantes/unidades em simultâneo.

---

## 1. Detetar e confirmar

- Alertas automáticos:
  - `HealthDashboardPage` mostra Core offline em múltiplas unidades;
  - tasks técnicas `CORE_UNAVAILABLE` aparecem no Monitor de Risco.
- Confirmar:
  - healthcheck PostgREST (porta 3001);
  - estado do cluster Docker (máquina, disco, rede).

---

## 2. Comunicar internamente

- Informar:
  - canal interno de incidentes (Slack/Teams/…);
  - quem está de on‑call técnico;
  -, se for grave, responsável de produto/comercial.

---

## 3. Medidas imediatas

- Verificar se há **modo local** / trial em terminais:
  - TPV pode operar com dados em cache apenas se e enquanto for seguro;
  - nunca prometer persistência quando Core está offline prolongado.
- Para operações críticas:
  - orientar equipas a usar POS fiscal direto enquanto o OS recupera;
  - registar manualmente notas de serviço para posterior input.

---

## 4. Recuperar Core

- Seguir troubleshooting do `docker-core/README.md`:
  - verificar Postgres;
  - verificar PostgREST;
  - verificar disco/espaço;
  - reiniciar serviços de forma controlada.
- Garantir que, após recovery:
  - migrations estão aplicadas;
  - healthchecks passam;
  - não existem erros graves em logs.

---

## 5. Pós‑incidente

- Registar:
  - duração da indisponibilidade;
  - nº de unidades afetadas;
  - causa raiz provável;
  - ações de mitigação/follow‑up (infra, código, processos).
- Se afetou clientes enterprise:
  - alinhar narrativa com `SLA_INTERNAL_CONTRACT.md` e, se aplicável,
    com contratos específicos.

