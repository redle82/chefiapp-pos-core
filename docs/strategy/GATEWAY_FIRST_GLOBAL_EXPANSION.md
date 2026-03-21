# Gateway-First Global Expansion

**Propósito:** Fundamentar a estratégia de expansão do ChefIApp por **payment gateway**, não por geografia.  
**Ref:** [GATEWAY_DEPLOYMENT_MATRIX.md](../commercial/GATEWAY_DEPLOYMENT_MATRIX.md)

---

## 1. Por que gateway > geografia

- **Eficiência de capital:** Cada gateway requer integração técnica, conformidade regulatória e suporte comercial. Expandir por gateway concentra esforço em mercados onde o stack de pagamento está já validado.
- **Risco regulatório:** Países com requisitos fiscais ou de certificação pesados (DE, AT, PT) consomem recursos desproporcionais. Adiar até capital adequado.
- **Posicionamento cash-first:** ChefIApp optimiza para restaurantes que precisam de cash rápido e hardware pronto. Pix (BR), SumUp (ES/GB) e Stripe (US) cobrem esse âmbito.

---

## 2. Lógica de eficiência de capital

| Fase | Acção | Resultado esperado |
|------|-------|--------------------|
| 1 | Activar gateways já integrados (Pix, SumUp, Stripe) | Receita em BR, ES, GB, US sem custo marginal |
| 2 | Adicionar gateways sob demanda (ex: Adyen, iZettle) | Só quando pipeline justificar |
| 3 | Entrar em mercados regulatórios pesados (DE, AT, PT) | Após capital levantado para compliance |

---

## 3. Modelo de camadas regulatórias

- **Baixo:** BR (Pix), US (Stripe)
- **Médio:** ES, GB (SumUp + Stripe)
- **Alto (bloqueados):** DE, AT, PT — adiados

---

## 4. Rollout em 3 fases

1. **Phase 1 — Clean country structure:** Apenas BR, ES, GB, US nas landings e rotas.
2. **Phase 2 — Gateway matrix:** Documentar mapeamento país → gateway; billing/onboarding consomem `gatewayConfig`.
3. **Phase 3 — Blocked regions:** Manter DE, AT, PT como "postponed" até capital para compliance.

---

## 5. Filosofia cash-first

ChefIApp expande onde a sua infraestrutura de pagamento está legal e tecnicamente optimizada. Geografia é secundária face ao gateway disponível.
