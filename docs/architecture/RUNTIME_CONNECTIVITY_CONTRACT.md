# Runtime Connectivity Contract

**Status:** CANONICAL / HIGH-RANK
**Authority:** Docker Core / Sovereign Engineering
**Context:** Closed Pilot (v0)
**Supersedes:** Any and all implicit fallback behaviors for `localhost:3001`

---

## 1. Declarative Connectivity Principle

The ChefIApp Runtime (Merchant Portal, TPV, KDS, Mobile) operates on a **Strictly Declarative Model**. Connectivity to the Core is an act of explicit technical provisioning and must never be the result of a runtime "discovery" or "fallback".

### 1.1 The "Law of Invisible Discovery"

- **Runtime never discovers the Core**: All connectivity targets MUST be declared via environment variables (`VITE_SUPABASE_URL`).
- **Forbidden Discovery**: The system is prohibited from "checking" if `localhost:3001` exists if not explicitly told to do so.
- **Forbidden Fallback**: Implicit fallbacks (e.g., `url || "http://localhost:3001"`) are strictly forbidden in any infra client, reader, or writer.

---

## 2. Mandatory Configuration

### 2.1 VITE_SUPABASE_URL

- This variable is **Mandatory** for any operational terminal (TPV, KDS, AppStaff).
- It serves as the single source of truth for the Core API Gateway.

### 2.2 Production Fail-Hard Policy

- In a **Production** environment (`NODE_ENV === "production"`), if `VITE_SUPABASE_URL` is missing, the system MUST terminate immediately with a fatal error.
- **Perceptual Barrier**: The UI must never attempt a "graceful degraded mode" that masks missing configuration.

---

## 3. Semantic Role of Port 3001

Port **3001** is canonized as a **Semantic Indicator** of a Docker-based installation, but it is **NEVER** a default destination.

| Concept         | Role                                       | Restriction                                                        |
| :-------------- | :----------------------------------------- | :----------------------------------------------------------------- |
| **Indicator**   | Signals "Docker Core Mode" to the runtime. | Used only to choose internal adapters (e.g., bypass Auth headers). |
| **Destination** | A network endpoint.                        | Must be explicitly part of the defined `VITE_SUPABASE_URL`.        |

---

## 4. Operational & Perceptual Boundaries

- **UI vs Infra**: The UI may react to a "Core Offline" state (e.g., showing a connectivity banner), but the underlying infrastructure layer (Fetch Clients/Readers) MUST NOT attempt to reroute traffic to alternative local ports.
- **Installation Context**: Docker is an **installation context** (defined in `INSTALLATION_MINIMAL_CONTRACT.md`). It is not a runtime decision-maker.

---

## 5. Decision Matrix

| Concept            | Allowed                                                           | Forbidden                                       | Rationale                                         |
| :----------------- | :---------------------------------------------------------------- | :---------------------------------------------- | :------------------------------------------------ |
| **Core Target**    | `VITE_SUPABASE_URL="http://192.168.1.50:3001"`                    | `let target = env.URL \|\| "localhost:3001"`    | Sovereignty requires explicit intent.             |
| **Docker Mode**    | Checking if URL contains `:3001` to enable Docker-specific logic. | Hardcoding `:3001` as a string in a fetch call. | 3001 is a signal, not a guarantee.                |
| **Missing Config** | Fatal crash (Scream Test).                                        | Silently defaulting to localhost.               | Avoid "Magic" that breaks in production networks. |
| **UI Interaction** | Displaying "Core Offline: Verifique a ligação"                    | Retrying silently on another port.              | Transparency to the operator.                     |

---

## 6. Historical Context (Irreversibility)

### 6.1 The 3001 Anomaly

Previously, the system implicitly targeted `localhost:3001`. This created a "Magic Loop" where terminals appeared connected in dev environments but failed in field deployments without clear error messages.

### 6.2 Responsibility Mapping

| Responsibility         | Previous Model    | New Model (Canonical)        |
| :--------------------- | :---------------- | :--------------------------- |
| **Core Discovery**     | Implicit Fallback | Explicit Environment Config  |
| **Connectivity Truth** | Brute force check | Manifest-based declaration   |
| **Error Handling**     | Silent retry      | Fail-loudly / "Core Offline" |

**Why this is irreversible:**
Allowing automatic fallback breaks the **Sovereign Installation Contract**. A terminal that "decides" where the Core is without being told violates the hierarchy of authority where the **Operator** (via Provisioning) is the only one empowered to define the network topology.

---

## 7. Alignment & References

- **[INSTALLATION_MINIMAL_CONTRACT.md](./INSTALLATION_MINIMAL_CONTRACT.md)**: Defines the required port 3001 for Pilot installations.
- **[DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md](./DESIGN_SYSTEM_PERCEPTUAL_CONTRACT.md)**: Defines the "Core Offline" perceptual state.
- **[CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md)**: This contract is registered as **HIGH-RANK**.

---

**End of Contract.**
