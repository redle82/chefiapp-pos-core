# Architecture Canon
>
> **The Sovereign Constitution of ChefIApp**

This document describes the *philosophical* and *ontological* structure of the system.
It is the answer to "How does this system exist?".

## 1. The Core Philosophy

**"The Tenant is the Universe."**

This system is not a platform that *has* users.
It is a **Kernel** that *instantiates* a Universe for each Tenant (Restaurant).

- **Sovereignty:** Inside a Tenant's Universe, nothing else exists.
- **Isolation:** A Tenant's data, memory, and events are physically or logically impossible to mix with another's.
- **Lifecycle:** A Universe is Born (Boot), Lives (Runtime), and Dies (Dispose).

## 2. The Ontological Map (The 3 Layers)

### Layer 1: The Simulator (The Browser / Frontend)

The Frontend is merely a *viewer* into the Universe.

- It asks: "Which Universe am I looking at?" (`TenantContext`)
- It renders: The state of that Universe.
- **Law:** The UI is disposable. The Universe is persistent.

### Layer 2: The Kernel (The Living System)

The "Brain" that runs the Universe.

- **Object:** `TenantKernel` (Singleton per Tenant).
- **Responsibility:**
  - Holds the Memory (`InMemoryRepo`).
  - Executes the Logic (`EventExecutor`).
  - Enforces the Rules (`Guards`).
- **Law:** No operation happens outside a Kernel.

### Layer 3: The Record (The Database)

The "History" of the Universe.

- **Component:** `EventStore` (Append-Only Log).
- **Responsibility:** Perfect recall of every state change (`Event Sourcing`).
- **Law:** If it's not in the Event Store, it never happened.

## 3. The Execution Model

How a user action becomes history:

1. **Intent:** User clicks "Pay Order" (UI).
2. **Context:** UI finds the active `TenantKernel`.
3. **Execution:** UI calls `Kernel.execute('PAYMENT:CONFIRM')`.
4. **Validation:** Kernel checks `TenantId` and `State Guards`.
5. **History:** Kernel appends `PAYMENT_CONFIRMED` to Event Store.
6. **Memory:** Kernel updates `InMemoryRepo` immediately.
7. **Projection:** UI reflects the new state instantly.

## 4. The Loop of Life (Lifecycle)

### Genesis (Boot)

- User Logs in.
- System resolves `TenantId`.
- **System boots `new TenantKernel(tenantId)`.**
  - Kernel connects to DB.
  - Kernel hydrates Memory.
  - Kernel signals `READY`.

### Runtime (Life)

- Kernel accepts Commands.
- Kernel emits Events.
- Kernel mutates Memory.

### Apocalypse (Dispose)

- User switches Tenant or Logs out.
- **System calls `Kernel.dispose()`.**
  - Memory is wiped.
  - Connections cut.
- The Universe ceases to exist in RAM.

## 5. The Golden Rule of Code
>
> "If you are writing code that assumes a global state, you are breaking the Canon.
> Always ask: **Which Kernel is running this?**"
