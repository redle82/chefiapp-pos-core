# Gateway Deployment Matrix

**Propósito:** Mapear a estratégia de expansão do ChefIApp por **payment gateway**, não por geografia.  
**Ref:** [GATEWAY_FIRST_GLOBAL_EXPANSION.md](../strategy/GATEWAY_FIRST_GLOBAL_EXPANSION.md)

---

## 1. Matriz de gateways activos

| Gateway | Countries | Payment Stack      | Regulation Risk | Activation Priority | Notes              |
|---------|-----------|--------------------|-----------------|---------------------|--------------------|
| **Pix** | BR        | Pix + Stripe       | Low             | High                | Fast cash          |
| **SumUp** | ES, GB  | SumUp + Stripe     | Medium          | High                | Hardware ready     |
| **Stripe** | US      | Stripe only        | Medium          | Medium              | Scale positioning  |

---

## 2. Regiões bloqueadas

| Região | Países | Motivo |
|--------|--------|--------|
| **Europa regulatória** | DE, AT, PT | Regulatory heavy. Postponed until capital raised. |

---

## 3. Países activos (landings)

| Código | País  | Gateway | Moeda | Rota |
|--------|-------|---------|-------|------|
| BR     | Brasil | PIX    | BRL   | `/br` |
| ES     | España | SumUp  | EUR   | `/es` |
| GB     | UK     | SumUp  | GBP   | `/gb` |
| US     | USA    | Stripe | USD   | `/us` |

---

## 4. Referências técnicas

- `merchant-portal/src/landings/countries.ts` — config por país
- `billing-core/gatewayConfig.ts` — mapeamento país → gateway
- [COUNTRY_DEPLOYMENT_SYSTEM.md](./COUNTRY_DEPLOYMENT_SYSTEM.md) — especificação de landings
