# Diagramas Soberanos — ChefIApp (AS-IS)

**Status:** VISUAL CANÓNICO — derivado do [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md)  
**Propósito:** Tornar explícito em forma visual o que já governa: estados, autoridade e fronteiras. Não altera o sistema; apenas compila o AS-IS.  
**Formato:** Mermaid (texto-versionável, rastreável).  
**Última atualização:** 2026-01-31

---

## 1. State Machine soberana (lifecycle + billing)

Estados formais do restaurante que governam rotas e gates. Secção 9 do ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> created: bootstrap (INSERT gm_restaurants + owner)
    created --> configured: identidade mínima existe
    configured --> published: /app/publish (isPublished = true)
    published --> operational: turno aberto (caixa aberta)

    note right of created
        Rotas permitidas: /bootstrap, /app/select-tenant,
        /dashboard, /config/*, /app/billing, /app/publish
        Bloqueadas: /op/tpv, /op/kds
        Gate: RequireOperational (!isPublished)
    end note

    note right of configured
        Portal (dashboard, config, menu, billing, publish)
        Bloqueadas: /op/tpv, /op/kds até published
        Gate: RequireOperational
    end note

    note right of published
        Portal + /op/tpv, /op/kds
        Gate: RequireOperational libera
        CASH_REGISTER exige operational para caixa
    end note

    note right of operational
        Portal + TPV/KDS + pedidos/pagamentos
        Gate: CASH_REGISTER_LIFECYCLE
    end note
```

### Billing (governa operação quando aplicado)

```mermaid
stateDiagram-v2
    direction LR
    [*] --> trial: início
    trial --> active: assinatura ativa
    active --> past_due: atraso pagamento
    active --> suspended: suspensão
    past_due --> active: regularização
    suspended --> active: regularização

    note right of trial
        AS-IS: RequireOperational NÃO lê billing ainda
        Só isPublished. Billing bloqueio = futuro (BILLING_SUSPENSION_CONTRACT)
    end note

    note right of past_due
        Deveria bloquear operação
        Gate ainda não aplica (parcial)
    end note
```

---

## 2. Autoridade por decisão (quem decide o quê, onde vive)

Quem tem autoridade final sobre cada decisão. Secção 10 do ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md.

```mermaid
flowchart TB
    subgraph Decisoes["Decisão"]
        D1[Criar restaurante]
        D2[Publicar restaurante]
        D3[Operar TPV/KDS]
        D4[Bloquear por billing]
        D5[Resolver tenant]
        D6[Redirecionar por papel]
        D7[Escrita gm_restaurants / installed_modules / setup_status]
    end

    subgraph Autoridade["Autoridade técnica"]
        A1[Frontend BootstrapPage via boundary]
        A2[Frontend + Core write]
        A3[RequireOperational + Runtime]
        A4[Core futuro]
        A5[TenantContext hoje / FlowGate desenhado]
        A6[RoleGate]
        A7[Core via boundary ou BootstrapPage criação inicial]
    end

    subgraph Onde["Onde vive"]
        O1[INSERT gm_restaurants + gm_restaurant_members\nDbWriteGate / Supabase]
        O2[PublishPage → setRestaurantStatus\nCore persiste isPublished]
        O3[Gate lê runtime.isPublished\nRuntime espelha Core]
        O4[RequireOperational ainda não lê billingStatus\nCore = fonte quando implementado]
        O5[TenantContext + SelectTenantPage\nFlowGate.tsx existe mas não montado]
        O6[App.tsx\nstaff → /garcom, outros → /dashboard]
        O7[RuntimeWriter / DbWriteGate\nBootstrapPage única exceção 1º restaurante]
    end

    D1 --> A1 --> O1
    D2 --> A2 --> O2
    D3 --> A3 --> O3
    D4 --> A4 --> O4
    D5 --> A5 --> O5
    D6 --> A6 --> O6
    D7 --> A7 --> O7
```

---

## 3. Fronteira Core / Runtime / UI (hard lines, sem exceções)

Regras que nenhum dev nem IA pode violar. Secção 12 do ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md.

```mermaid
flowchart TB
    subgraph CORE["🧱 CORE — Fonte de verdade"]
        C1[Pedidos, pagamentos, gm_restaurants\ninstalled_modules, etc.]
        C2[Escrita só via boundary\nRuntimeWriter, DbWriteGate]
        C3[Imutável: pedidos/pagamentos após fechamento]
    end

    subgraph BOUNDARY["Boundary"]
        B[RuntimeReader / RuntimeWriter / DbWriteGate]
    end

    subgraph RUNTIME["🔄 RUNTIME — Espelho do Core"]
        R1[RestaurantRuntimeContext]
        R2[Lê/escreve SÓ via boundary]
        R3[Nunca inventa estado\nisPublished vem do Core]
    end

    subgraph GATES["Gates — Aplicam contratos"]
        G1[RoleGate, RequireOperational]
        G2[Nunca fazem write]
        G3[Só leem runtime, tenant, role\nRedirecionam ou renderizam filhos]
    end

    subgraph UI["🎨 UI — Reflexo"]
        U1[Páginas, componentes]
        U2[Nunca muda estado financeiro diretamente]
        U3[Nunca escreve em gm_restaurants\norders, payments sem boundary]
    end

    CORE --> BOUNDARY
    BOUNDARY --> RUNTIME
    RUNTIME --> GATES
    RUNTIME --> UI
    GATES --> UI

    style CORE fill:#1a1a2e,stroke:#e94560,color:#fff
    style RUNTIME fill:#16213e,stroke:#0f3460,color:#fff
    style UI fill:#0f3460,stroke:#e94560,color:#fff
    style GATES fill:#533483,stroke:#e94560,color:#fff
```

### Regras explícitas (texto)

| Camada | Regra |
|--------|--------|
| **CORE** | Nada no frontend sobrepõe o Core. Escrita só via boundary. |
| **Runtime** | Nunca inventa estado. isPublished, lifecycle, setup_status vêm do Core. |
| **UI** | Nunca muda estado financeiro. Nunca escreve em gm_restaurants, orders, payments sem boundary. |
| **Gates** | Nunca fazem write. Só leem e redirecionam ou renderizam filhos. |

---

## Referências

- [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) — fonte única; secções 9, 10, 12
- [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) — lifecycle configured / published / operational
- [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) — billing trial / active / past_due / suspended

**Exportar:** Estes diagramas Mermaid podem ser renderizados em GitHub, GitLab, VS Code (extensão Mermaid) ou exportados para Excalidraw/PlantUML sem alterar o conteúdo.
