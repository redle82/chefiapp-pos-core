# Modelo de Consciência do Sistema — Core

## Lei do sistema

**O sistema sabe o que está a monitorizar, o que não está, e quando está “cego”. O Core expõe esse estado; a UI não finge visibilidade nem esconde cegueira.**

Este documento é contrato formal no Core. Evita que dashboards mintam, silêncio pareça normal e falhas passem despercebidas.

---

## 1. Quem manda

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define: o que é monitorizado (ex.: pedidos, cozinha, rede), cadência (ex.: heartbeat, polling), quando o sistema está “cego” (ex.: sem dados há N min). Fonte de verdade do estado de consciência. |
| **UI / Terminais** | Mostra estado de consciência conforme o Core expõe (ex.: “dados actualizados há X s”, “sem dados da cozinha há 3 min”). Não finge “tudo normal” quando há cegueira. |

---

## 2. O que o sistema sabe que sabe

- **Monitorizado:** Lista ou contrato do que está a ser observado (pedidos, tarefas, conectividade, etc.). A UI pode mostrar “fonte: Core” ou indicador de frescura.
- **Não monitorizado:** O que explicitamente não está na scope (ex.: métrica X não contratada). A UI não mostra “—” ou “N/A” como se fosse dado; pode indicar “não disponível” conforme contrato.
- **Cego:** Período em que não há dados (ex.: último heartbeat há N min). O Core (ou contrato) define o limiar. A UI mostra estado “desactualizado” ou “sem dados” em vez de mostrar último valor como se fosse actual.

---

## 3. O que a UI não faz

- Não mostra dados como “actuais” quando o Core indica atraso ou cegueira.
- Não esconde “não recebo dados há X min” para “não assustar”; o contrato pode definir mensagem e acção (ex.: aviso, bloqueio).
- Não inventa “estado provável” sem regra do Core (ex.: “deve estar ok” sem fonte).

---

## 4. Relação com outros contratos

- **Falha:** [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md) — cegueira prolongada pode ser degradação ou crítica.
- **Silêncio e ruído:** [CORE_SILENCE_AND_NOISE_POLICY.md](./CORE_SILENCE_AND_NOISE_POLICY.md) — quando “sem dados” dispara alerta.
- **Consciência operacional:** [CORE_OPERATIONAL_AWARENESS_CONTRACT.md](./CORE_OPERATIONAL_AWARENESS_CONTRACT.md) — métricas e mini KDS/TPV; frescura dos dados governada por este modelo.

---

## 5. Status

**FECHADO** para definição do modelo: o que é monitorizado, cegueira, quem manda. Implementação (heartbeat, limiares) pode evoluir; a lei está definida.
