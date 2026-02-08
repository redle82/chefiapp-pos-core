# Contrato: Alertas Operacionais (FASE 2.4)

**Propósito:** Definir severidade real, TTL, agregação e separação estado / incidente / histórico para alertas no Control Plane. Objetivo: operador entende o sistema; não ignora alertas; não entra em pânico.

**Referências:** [FASE_2_PLANO_COMPLETO.md](../plans/FASE_2_PLANO_COMPLETO.md) § 2.4, [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](OPERATIONAL_DASHBOARD_V2_CONTRACT.md), [OBSERVABILITY_POST_CUT.md](../ops/OBSERVABILITY_POST_CUT.md).

---

## 1. Princípio

**Ruído → consciência, não ansiedade.**

Cada sinal deve ser **acionável** ou **informativo com contexto**. Nada de banners dramáticos nem contadores brutos sem acção associada.

---

## 2. Severidade real

| Severidade | Uso | Exemplo no Dashboard |
|-----------|-----|------------------------|
| **info** | Estado ou contexto útil; não exige acção imediata. | "Core ON", "Turno aberto", "3 terminais instalados". |
| **warn** | Condição que merece atenção; acção recomendada em tempo útil. | "Core offline — iniciar Docker Core", "Último pagamento há > 1 h". |
| **critical** | Bloqueio ou perda de verdade; acção imediata. | "Impossível registar pagamentos", "Caixa fechada — abrir no TPV". |

Regras:

- Não usar `critical` para coisas que não bloqueiam operação.
- Não usar `warn` para estado normal (ex.: "0 pedidos hoje" sem contexto de "ainda não vendeu" é ruído).
- Uma única severidade por alerta; não misturar níveis no mesmo bloco.

---

## 3. TTL (time-to-live)

- **info:** pode persistir enquanto o estado for verdade (ex.: "Core OFF" até Core voltar).
- **warn:** TTL máximo recomendado (ex.: 24 h); após isso descer a **histórico** ou desaparecer, consoante política.
- **critical:** até ser resolvido ou até TTL máximo (ex.: 7 dias em histórico).

Implementação futura: campo `expires_at` ou equivalente em entidades de alerta; UI não mostrar como "activo" após TTL.

---

## 4. Agregação

- **Não repetir** o mesmo tipo de alerta em loop (ex.: "Core offline" uma vez por mudança de estado, não por poll).
- **Agregar** por tipo: ex. "3 falhas de pagamento nas últimas 2 h" em vez de 3 linhas idênticas.
- Critério anti-spam: ver [OBSERVABILITY_POST_CUT.md](../ops/OBSERVABILITY_POST_CUT.md) — zero spam estrutural; apenas eventos reais.

---

## 5. Estado vs incidente vs histórico

| Camada | Descrição | Onde |
|--------|-----------|------|
| **Estado** | Condição actual (Core ON/OFF, turno aberto/fechado, terminais instalados). | Primeira dobra do Dashboard; indicadores no header/sidebar. |
| **Incidente** | Algo aconteceu agora (falha de pagamento, Core caiu, terminal perdeu ligação). | Lista de alertas activos; máx. N visíveis, resto "Ver todos". |
| **Histórico** | Registo passado para auditoria; não bloqueia nem distrai. | Página de alertas / auditoria; não na primeira dobra. |

Regra: na primeira dobra do Dashboard não misturar estado com lista infinita de incidentes. Máximo de 1–3 alertas activos visíveis; link "Ver alertas" para o resto.

---

## 6. Dashboard honesto (2.4.2)

Alinhado a [OPERATIONAL_DASHBOARD_V2_CONTRACT.md](OPERATIONAL_DASHBOARD_V2_CONTRACT.md):

- **Sem banners dramáticos:** mensagem curta, cor adequada à severidade, acção clara (ex.: "Tentar novamente", "Abrir TPV").
- **Sem contadores brutos sem contexto:** ex. "0 pedidos" só com texto "Ainda não há vendas hoje" ou "Abra o TPV para começar".
- **Sinais acionáveis:** cada aviso com pelo menos uma acção (botão, link ou instrução em 1 linha).

Exemplos já alinhados (referência):

- **CoreUnavailableBanner:** "Servidor operacional offline. Inicie o Docker Core." + "Tentar novamente" + link "Ajuda". Severidade implícita: warn.
- **OperationalMetricsCards:** SETUP → "Configure o restaurante para começar."; sem dados → "Ainda não há pedidos..."; ACTIVE → métricas com números. Sem drama.

---

## 7. O que NÃO entra neste contrato (FASE 2.4)

- Integração com PagerDuty / Slack / email (ver [alerts.md](../ops/alerts.md) para ops).
- Regras de negócio específicas (ex.: "alerta se stock < X") — definidas noutros contratos ou produto.
- Fiscal ou auditoria legal — apenas verdade operacional interna.

---

## 8. Resumo

| Área | Regra |
|------|--------|
| Severidade | info / warn / critical reais; uma por alerta. |
| TTL | info enquanto estado; warn/critical com limite no tempo. |
| Agregação | Sem repetição em loop; agregar por tipo. |
| Estado / Incidente / Histórico | Separar; primeira dobra = estado + até 1–3 incidentes. |
| Dashboard | Sem drama; contadores com contexto; sinais acionáveis. |

Última atualização: FASE 2.4 — Contrato de Alertas Operacionais.
