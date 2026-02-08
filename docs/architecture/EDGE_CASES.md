# Edge Cases e Resiliência — ChefIApp

**Propósito:** Documento canónico que consolida **edge cases**, **modelo de falha** e **resiliência da UI operacional**: [CORE_FAILURE_MODEL](./CORE_FAILURE_MODEL.md) e [OPERATIONAL_UI_RESILIENCE_CONTRACT](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md). Define o que acontece quando algo falha e o que a UI nunca deve fazer.  
**Público:** Dev, arquitetura, QA.  
**Referência:** [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) · [OFFLINE_STRATEGY](./OFFLINE_STRATEGY.md)

---

## 1. Quem manda na falha

| Papel | Responsabilidade |
|-------|------------------|
| **Core** | Define classes de falha (aceitável, degradação, crítica); o que acontece em cada caso (retry, fila, bloquear, alertar); fonte de verdade do estado de falha. |
| **UI / Terminais** | Mostram estado de falha conforme o Core expõe; não inventam "ignorar" ou "repetir para sempre" sem regra; não escondem falha crítica. |

---

## 2. Classes de falha (CORE_FAILURE_MODEL)

| Classe | Descrição | Exemplo | Comportamento típico |
|--------|-----------|---------|----------------------|
| **Aceitável** | Falha esperada, recuperável, sem impacto em verdade ou dinheiro. | Timeout de reader; impressora ocupada. | Retry com backoff; "em fila" ou "a repetir"; não bloquear operação principal. |
| **Degradação** | Serviço parcial; sistema continua operável com limitações. | Sem rede; fila local activa. | Seguir CORE_OFFLINE_CONTRACT; mostrar estado claro; não fingir normalidade. |
| **Crítica** | Impacto em verdade, dinheiro ou segurança. Requer decisão ou intervenção. | Falha de persistência; inconsistência; falha de auth em operação sensível. | Bloquear acção/fluxo; registar; alertar; não continuar "como se nada fosse". |

A **UI** não reclassifica falha por conta própria (ex.: tratar crítica como aceitável). O Core (ou contrato) classifica; a UI obedece.

---

## 3. Resiliência da UI operacional (OPERATIONAL_UI_RESILIENCE_CONTRACT)

TPV e KDS **nunca crasham visivelmente**:

| Regra | O que significa |
|-------|-----------------|
| **ErrorBoundary em /op/** | Rotas /op/tpv e /op/kds envolvidas por ErrorBoundary; captura erros de render; evita ecrã branco. |
| **Mensagens neutras** | Erros expostos ao utilizador não incluem stack, Docker, Supabase ou RPC; usar toUserMessage (ou equivalente). |
| **Fallback ou estado degradado** | Em erro não recuperável, mostrar UI de fallback (ex.: "Algo correu mal. Volte ao painel.") em vez de crash. |

---

## 4. Cenários de edge (consolidados)

| Cenário | O que acontece | Mecanismo |
|---------|----------------|-----------|
| **Core não responde (rede)** | UI usa fallback (menu/TPV/KDS conforme OFFLINE_STRATEGY); nunca polui Core. | MENU_FALLBACK, B1/B2/B4; ErrorBoundary. |
| **Crash em componente /op/** | ErrorBoundary mostra fallback neutro; nunca ecrã branco. | OPERATIONAL_UI_RESILIENCE_CONTRACT. |
| **Tenant não resolve (0 tenants, timeout)** | Redirect /bootstrap ou /app/select-tenant. | TenantContext, SelectTenantPage. |
| **Runtime falha ou Core lento** | runtime.loading = true; RequireOperational mostra "Verificando estado operacional...". | RestaurantRuntimeContext, RequireOperational. |
| **Acesso a /op/tpv ou /op/kds sem published** | RequireOperational bloqueia; "Sistema não operacional" + link /dashboard. | RequireOperational. |
| **Billing past_due/suspended** | Hoje: gate não aplica. Futuro: bloquear operação conforme BILLING_SUSPENSION_CONTRACT. | RequireOperational (futuro). |
| **Rota não reconhecida** | CoreResetPage (catch-all); página neutra de reset. | App.tsx path="*". |

---

## 5. O que a UI não faz

- Não trata falha crítica como "só um erro" e continua o fluxo como se nada tivesse acontecido.
- Não inventa retry infinito sem regra do Core.
- Não esconde falha (ex.: "Tudo bem!" quando não está) para "melhorar UX" sem política explícita.
- Não decide sozinha que "esta falha não importa"; a classificação é do Core.
- Não mostra stack trace, "Failed to fetch", Docker, Supabase ou RPC ao utilizador.

---

## 6. Referências

- [CORE_FAILURE_MODEL](./CORE_FAILURE_MODEL.md) — Modelo de falha completo.
- [OPERATIONAL_UI_RESILIENCE_CONTRACT](./OPERATIONAL_UI_RESILIENCE_CONTRACT.md) — Contrato de resiliência /op/.
- [CORE_SILENCE_AND_NOISE_POLICY](./CORE_SILENCE_AND_NOISE_POLICY.md) — Quando alertar vs quando não alertar.
- [OFFLINE_STRATEGY](./OFFLINE_STRATEGY.md) — Estratégia offline e fallback.
- [ARQUITETURA_GERAL_CHEFIAPP_AS_IS](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) §13 — Falhas e recuperação AS-IS.

---

*Documento vivo. Alterações em CORE_FAILURE_MODEL ou OPERATIONAL_UI_RESILIENCE devem ser reflectidas aqui.*
