# 🧬 BOOTSTRAP KERNEL — System Self-Awareness

> **O sistema precisa saber dizer a verdade sobre si mesmo.**

---

## 📋 Propósito

O Bootstrap Kernel é a camada que dá ao ChefIApp **auto-consciência estrutural**.

Quando o sistema inicializa, o Kernel:

1. Detecta o ambiente (dev/staging/prod)
2. Valida guards de produção
3. Regista superfícies activas
4. Emite um `SYSTEM_STATE` global

---

## 🏗️ Arquitectura

```
BOOTSTRAP_KERNEL
├── Identity Layer
│   ├── Auth (Supabase)
│   ├── TenantResolver
│   └── Roles
│
├── Core Runtime
│   ├── Environment (dev/prod/staging)
│   ├── Guards (assertNoMock, DbWriteGate)
│   └── RuntimeContext
│
├── Surfaces Registry
│   ├── Panel (Dashboard)
│   ├── TPV
│   ├── KDS
│   ├── Staff
│   └── Web
│
├── Operational Systems
│   ├── Orders
│   ├── Tables
│   ├── CashRegister
│   └── Fiscal
│
├── Configuration Systems
│   ├── Menu
│   ├── Integrations
│   └── Feature Flags
│
└── Observability
    ├── Logs
    ├── Monitoring
    └── Alerts
```

---

## 📊 SYSTEM_STATE

O output principal do Bootstrap Kernel:

```typescript
interface SystemState {
  environment: 'dev' | 'staging' | 'prod';
  kernel: 'OK' | 'DEGRADED' | 'FAILED';
  
  surfaces: {
    panel: SurfaceStatus;
    tpv: SurfaceStatus;
    kds: SurfaceStatus;
    staff: SurfaceStatus;
    web: SurfaceStatus;
  };
  
  systems: {
    orders: SystemStatus;
    tables: SystemStatus;
    cashRegister: SystemStatus;
    fiscal: SystemStatus;
    menu: SystemStatus;
  };
  
  guards: {
    assertNoMock: boolean;
    dbWriteGate: boolean;
    runtimeContext: boolean;
  };
  
  observability: {
    logs: boolean;
    monitoring: boolean;
    alerts: boolean;
  };
  
  timestamp: string;
}

type SurfaceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR';
type SystemStatus = 'OK' | 'CONFIGURED' | 'PARTIAL' | 'MISSING';
```

---

## 🔄 Ciclo de Vida

```
1. main.tsx imports BootstrapKernel
          ↓
2. BootstrapKernel.init() executes
          ↓
3. SurfaceRegistry.scan()
          ↓
4. SystemsRegistry.healthCheck()
          ↓
5. SYSTEM_STATE emitted
          ↓
6. React App mounts with state
          ↓
7. Dashboard displays health
```

---

## 🔒 Guards de Produção

Em ambiente `prod`, o Kernel valida:

| Guard | Propósito | Falha = |
|-------|-----------|---------|
| `assertNoMock` | Mocks desactivados | KERNEL FAILED |
| `DbWriteGate` | Escrita protegida | Warning |
| `RuntimeContext` | Modo correcto | Warning |

---

## 🔧 Ficheiros

| Ficheiro | Propósito |
|----------|-----------|
| `core/kernel/BootstrapKernel.ts` | Orquestrador principal |
| `core/kernel/SurfaceRegistry.ts` | Registo de superfícies |
| `core/kernel/SystemsRegistry.ts` | Registo de sistemas |
| `core/kernel/types.ts` | Interfaces TypeScript |

---

## 📡 Integração

### Aceder ao Estado

```typescript
import { useSystemState } from '@/core/kernel/BootstrapKernel';

function DashboardHealth() {
  const state = useSystemState();
  
  return (
    <div>
      <span>Kernel: {state.kernel}</span>
      <span>TPV: {state.surfaces.tpv}</span>
    </div>
  );
}
```

### Verificar Sistema Específico

```typescript
import { SystemsRegistry } from '@/core/kernel/SystemsRegistry';

const fiscalStatus = SystemsRegistry.check('fiscal');
// → 'OK' | 'CONFIGURED' | 'PARTIAL' | 'MISSING'
```

---

## ⏭️ Próximos Passos

1. **ROADMAP_AS_CODE** — YAML com âncoras de evidência
2. **TRUTH_SCAN** — Validação automática código ↔ docs ↔ runtime

---

## 📌 Regras de Ouro

1. O Kernel **nunca falha silenciosamente** — sempre emite estado
2. Em prod, mock = crash (assertNoMock)
3. SYSTEM_STATE é **read-only** após init
4. Dashboard **sempre mostra** estado do Kernel
