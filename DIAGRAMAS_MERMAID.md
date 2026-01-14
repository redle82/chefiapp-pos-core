# 📊 DIAGRAMAS MERMAID — Visualização da Arquitetura

**Data:** 2026-01-24  
**Status:** ✅ **CANONICAL - Diagramas de Referência**

---

## 🎯 OBJETIVO

Este documento contém os diagramas Mermaid que visualizam a arquitetura canônica atual do sistema.

---

## 📐 1️⃣ DIAGRAMA ESTRUTURAL — Camadas

```mermaid
graph TB
    subgraph L0["L0: Runtime"]
        R1[Browser]
        R2[React]
        R3[JS Engine]
    end
    
    subgraph L1["L1: Kernel"]
        K1[SYSTEM_TRUTH_CODEX.md]
        K2[SYSTEM_OF_RECORD_SPEC.md]
        K3[PARTE_3_REGRAS_DO_CORE.md]
    end
    
    subgraph L2["L2: Bootstrap Orchestrator"]
        B1[FlowGate.tsx]
        B2[AppDomainProvider.tsx]
    end
    
    subgraph L3["L3: Gates"]
        G1[FlowGate.tsx<br/>Auth + Tenant]
        G2[TenantResolver.ts<br/>Single/Multiple/Zero]
        G3[OperationGate<br/>Sessão + Permissões]
    end
    
    subgraph L4["L4: Domain"]
        D1[OrderEngine]
        D2[ProductEngine]
        D3[Staff/Tasks]
    end
    
    subgraph L5["L5: Views"]
        V1[TPV]
        V2[KDS]
        V3[App Staff]
        V4[Web Orders]
        V5[Owner Dashboard]
    end
    
    L0 --> L1
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    
    style L0 fill:#e1f5ff
    style L1 fill:#fff4e1
    style L2 fill:#e8f5e9
    style L3 fill:#fce4ec
    style L4 fill:#f3e5f5
    style L5 fill:#e0f2f1
```

---

## 🥾 2️⃣ DIAGRAMA DE BOOT — Sequência de Inicialização

```mermaid
graph TD
    A[Browser Load] --> B[FlowGate.tsx]
    B --> C{Kernel READY?}
    C -->|NÃO| D[HALT SYSTEM]
    C -->|SIM| E[Auth Check]
    E -->|NÃO| F[/login]
    E -->|SIM| G{Tenant ACTIVE?}
    G -->|SIM| H[Passa para Domain]
    G -->|NÃO| I[TenantResolver.resolve]
    I --> J{Single Tenant?}
    J -->|SIM| K[Auto-select + Seal ACTIVE]
    J -->|NÃO| L{Multiple Tenants?}
    L -->|SIM| M[/app/select-tenant]
    L -->|NÃO| N[/onboarding/identity]
    K --> H
    H --> O[OperationGate Check]
    O -->|NÃO| P[Block Access]
    O -->|SIM| Q[Domain Providers]
    Q --> R[OrderContext]
    Q --> S[ProductContext]
    Q --> T[TaskContext]
    R --> U[Views Render]
    S --> U
    T --> U
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style G fill:#fce4ec
    style H fill:#e8f5e9
    style Q fill:#f3e5f5
    style U fill:#e0f2f1
```

---

## 🔄 3️⃣ DIAGRAMA E2E — Fluxo de um Pedido

```mermaid
sequenceDiagram
    participant G as Garçom<br/>(TPV/Staff)
    participant V as View<br/>(TPV Component)
    participant D as Domain<br/>(OrderEngine)
    participant OG as OperationGate
    participant API as Backend API
    participant DB as Database<br/>(Supabase)
    participant RT as Realtime
    participant K as KDS<br/>(Cozinha)
    participant S as App Staff
    participant O as Owner Dashboard
    participant T as TaskOps

    G->>V: Cria pedido<br/>(mesa 5, 2 itens)
    V->>D: OrderEngine.createOrder()
    D->>OG: Valida sessão/permissões
    OG->>OG: Sessão ativa? ✅
    OG->>OG: Permissões válidas? ✅
    OG->>API: POST /api/orders
    API->>DB: INSERT gm_orders
    DB->>DB: Trigger: sessão ativa?
    DB->>DB: Trigger: estado válido?
    DB->>DB: Trigger: regras financeiras
    DB-->>API: Pedido Aceito
    API-->>D: Order Created
    D->>RT: Realtime Fan-out
    RT->>K: Pedido novo (mesa 5)
    RT->>S: Pedido novo (mesa 5)
    RT->>O: Pedido novo (mesa 5)
    K->>K: Exibe na cozinha
    S->>S: Notifica garçom
    O->>O: Atualiza dashboard
    D->>T: Dispara eventos
    T->>T: Cria task "preparo"
    T->>T: Cria task "limpeza"<br/>(quando fechar)
```

---

## 🔐 4️⃣ DIAGRAMA DE GATES — Fluxo de Decisão

```mermaid
graph LR
    A[Request] --> B[AuthGate]
    B -->|❌ Não| C[/login]
    B -->|✅ Sim| D[IdentityGate]
    D -->|❌ Não| E[/onboarding/identity]
    D -->|✅ Sim| F[TenantGate]
    F -->|❌ No tenants| E
    F -->|⚠️ Multiple| G[/app/select-tenant]
    F -->|✅ ACTIVE| H[DomainGate]
    H -->|❌ Não| I[Block Access]
    H -->|✅ Sim| J[Domain]
    J --> K[Views]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style D fill:#fff4e1
    style F fill:#fce4ec
    style H fill:#fff4e1
    style J fill:#e8f5e9
    style K fill:#e0f2f1
```

---

## 🏗️ 5️⃣ DIAGRAMA DE AUTORIDADE — Hierarquia de Decisão

```mermaid
graph TD
    A[Kernel<br/>Leis] --> B[Gates<br/>Verificadores]
    B --> C[Domain<br/>Executores]
    C --> D[Database<br/>Juiz Final]
    D --> E[Views<br/>Consequência]
    
    A1[SYSTEM_TRUTH_CODEX.md] -.-> A
    B1[FlowGate.tsx] -.-> B
    C1[OrderEngine] -.-> C
    D1[Triggers SQL] -.-> D
    E1[TPV/KDS/Staff] -.-> E
    
    style A fill:#fff4e1
    style B fill:#fce4ec
    style C fill:#e8f5e9
    style D fill:#f3e5f5
    style E fill:#e0f2f1
```

---

## 🔄 6️⃣ DIAGRAMA DE TENANT RESOLUTION — Fluxo de Resolução

```mermaid
graph TD
    A[TenantGate Triggered] --> B{activeTenantId<br/>&&<br/>tenantStatus === 'ACTIVE'?}
    B -->|✅ SIM| C[Tenant já selado<br/>Retorna null<br/>Permite rota]
    B -->|❌ NÃO| D[TenantResolver.resolve]
    D --> E{memberships.length}
    E -->|0| F[NO_TENANTS<br/>→ /onboarding/identity]
    E -->|1| G[Auto-select<br/>Seal ACTIVE]
    E -->|>1| H{urlTenantId?}
    H -->|SIM| I[Validate Access]
    I -->|✅| J[Seal ACTIVE]
    I -->|❌| K[UNAUTHORIZED<br/>→ /onboarding/identity]
    H -->|NÃO| L{cachedTenantId?}
    L -->|SIM| M[Validate Access]
    M -->|✅| J
    M -->|❌| N[NEEDS_SELECTION<br/>→ /app/select-tenant]
    L -->|NÃO| N
    G --> O[Tenant ACTIVE<br/>Sistema operacional]
    J --> O
    C --> O
    
    style A fill:#e1f5ff
    style B fill:#fce4ec
    style C fill:#e8f5e9
    style O fill:#e8f5e9
```

---

## 📊 7️⃣ DIAGRAMA DE DOMAIN — Separação de Responsabilidades

```mermaid
graph LR
    subgraph Gates["🔐 GATES"]
        G1[AuthGate]
        G2[IdentityGate]
        G3[TenantGate]
        G4[OperationGate]
    end
    
    subgraph Domain["🎯 DOMAIN"]
        D1[OrderEngine]
        D2[ProductEngine]
        D3[TaskOps]
    end
    
    subgraph Views["🛰️ VIEWS"]
        V1[TPV]
        V2[KDS]
        V3[App Staff]
    end
    
    Gates -->|Contexto Resolvido| Domain
    Domain -->|Estado| Views
    Views -->|Intenções| Domain
    
    style Gates fill:#fce4ec
    style Domain fill:#e8f5e9
    style Views fill:#e0f2f1
```

---

## 🧪 8️⃣ DIAGRAMA DE VALIDAÇÃO — Teste E2E

```mermaid
graph TD
    A[Teste E2E Iniciado] --> B[Login]
    B --> C[FlowGate: Auth OK?]
    C -->|❌| D[FAIL: Auth]
    C -->|✅| E[FlowGate: Tenant ACTIVE?]
    E -->|❌| F[FAIL: Tenant]
    E -->|✅| G[Criar Pedido]
    G --> H[Domain: OrderEngine]
    H --> I[Backend: API]
    I --> J[Database: Insert]
    J --> K{Triggers OK?}
    K -->|❌| L[FAIL: Database]
    K -->|✅| M[Realtime: Fan-out]
    M --> N[KDS: Recebe?]
    N -->|❌| O[FAIL: Realtime]
    N -->|✅| P[TaskOps: Dispara?]
    P -->|❌| Q[FAIL: Tasks]
    P -->|✅| R[✅ PASS: E2E Completo]
    
    style A fill:#e1f5ff
    style R fill:#e8f5e9
    style D fill:#ffebee
    style F fill:#ffebee
    style L fill:#ffebee
    style O fill:#ffebee
    style Q fill:#ffebee
```

---

## 📚 COMO USAR ESTES DIAGRAMAS

### 1. Visualização Online
- Copie o código Mermaid
- Cole em [Mermaid Live Editor](https://mermaid.live/)
- Visualize e exporte como SVG/PNG

### 2. Integração em Documentos
- Use em Markdown (GitHub, GitLab, etc.)
- Renderiza automaticamente

### 3. Documentação Institucional
- Exporte como SVG
- Inclua em apresentações
- Use em documentação oficial

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CANONICAL - Diagramas de Referência**
