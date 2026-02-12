# SLA_INTERNAL_CONTRACT — Contrato interno de serviço ChefIApp™ OS

> Documento interno. Não é contrato legal com clientes. Define **como a
> equipa mede e acompanha** a qualidade do serviço para chegar a
> “enterprise‑ready 2026”.

---

## 1. Escopo

- Abrange apenas:
  - Docker Core (Postgres + PostgREST + serviços de suporte);
  - portal `merchant-portal` em produção (não dev);
  - módulos operacionais (TPV, KDS, Tasks, Observabilidade, Web Pública).
- Não cobre:
  - disponibilidade de POS fiscal externo;
  - redes Wi‑Fi do cliente;
  - integrações de terceiros (delivery, pagamentos) fora do controlo direto.

---

## 2. SLIs/SLOs alvo (espelho de `OBSERVABILITY_MINIMA.md`)

### 2.1. Disponibilidade Core

- **SLI:** % de tempo dentro do mês em que:
  - PostgREST responde 200 nas rotas de health;
  - Postgres responde `pg_isready` com exit code 0.
- **SLO alvo 2026:** ≥ 99,0% / mês.

### 2.2. Latência de operações críticas

- Operações monitorizadas:
  - `create_order_atomic`,
  - `performOrderAction('pay')`,
  - `markItemReady`.
- **SLI:** p95 da latência observada, do browser até resposta útil do Core.
- **SLO alvo 2026:** p95 < 400 ms em redes estáveis.

### 2.3. Erros em sincronização fiscal

- **SLI:** nº `FISCAL_SYNC_FAILED` / nº total `FISCAL_SYNC_*` no período.
- **SLO alvo 2026:** < 0,5% / mês.

### 2.4. Erros em criação de pedidos

- **SLI:** nº falhas em `create_order_atomic` / nº tentativas.
- **SLO alvo 2026:** < 0,1% / mês.

---

## 3. Reação a incidentes (interno)

Quando um SLO é violado num mês:

- abrir issue interna com:
  - descrição do incidente,
  - impacto estimado (nº de restaurantes / turnos afetados),
  - causa provável (Core, infra, código, dependência externa),
  - plano de mitigação/prevenção.
- marcar incidente relevante nos runbooks (`docs/ops`).

Não há compromisso automático com clientes; serve para
**disciplinar o roadmap** e priorizar melhorias de fiabilidade.

---

## 4. Comunicação externa

Para não criar overpromise:

- em materiais públicos:
  - não anunciar SLAs que ainda não são contratualizados;
  - usar linguagem tipo “desenhado para alta disponibilidade”,
    “monitorizamos Core e latência das operações críticas”.
- SLAs formais (com créditos, penalizações, etc.) devem viver em:
  - contratos comerciais específicos,
  - eventualmente com números mais conservadores que os SLOs internos.

