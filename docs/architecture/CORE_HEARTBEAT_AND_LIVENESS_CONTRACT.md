# Contrato de Heartbeat e Liveness — Terminais

**Propósito:** Define formalmente o que é heartbeat, quem o envia, quem o consome e o que acontece quando um terminal deixa de enviar heartbeat (liveness). O Core é a autoridade para o estado "online" ou "offline" de um terminal registado. Subordinado a [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) e [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md).

**Uso:** Qualquer alteração a health check, heartbeat, timeout ou exibição de "terminal online/offline" deve respeitar este contrato.

---

## 1. Âmbito

Este contrato governa:

- O que constitui heartbeat (sinal periódico de um terminal para o Core indicando que está activo).
- Quem envia heartbeat (terminais registados).
- Quem regista e avalia heartbeat (Core).
- O que acontece quando heartbeat cessa (timeout, estado "offline", exibição na árvore do Command Center).
- O que a UI pode mostrar como "online" ou "offline" (apenas o que o Core expõe).

Este contrato **não** governa:

- Provisionamento ou registro (ver [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md)).
- Conteúdo de pedidos ou tarefas.
- Reconciliação ou recuperação após falha (ver [CORE_RECONCILIATION_CONTRACT.md](./CORE_RECONCILIATION_CONTRACT.md) e [CORE_FAILURE_MODEL.md](./CORE_FAILURE_MODEL.md)).

---

## 2. O que governa

| Dimensão | Regra |
|----------|--------|
| **Autoridade** | O Core é a autoridade para o estado de liveness de um terminal. A UI (Command Center, árvore Terminals) reflecte apenas o estado exposto pelo Core. |
| **Heartbeat** | Um terminal registado envia heartbeat com periodicidade e formato definidos pelo Core. O Core regista o último heartbeat e deriva "online" ou "offline" conforme intervalo e timeout. |
| **Timeout** | O Core define o intervalo após o qual a ausência de heartbeat resulta em estado "offline". Nenhum terminal ou UI pode alterar essa regra. |
| **Exibição** | A árvore do Command Center (Terminals) mostra terminais como online/offline conforme o estado de liveness exposto pelo Core. A UI não inventa "online" nem "offline" localmente. |
| **Health check** | Health check de um terminal (além de heartbeat) pode ser definido pelo Core; resultado é consumido pelo Core para estado agregado. |

---

## 3. O que não governa

- Se um terminal pode ou não operar quando "offline" (modo offline é outro contrato: [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md)).
- Conteúdo ou formato de pedidos de negócio.
- Rede ou transporte (infraestrutura).

---

## 4. Quem obedece

- **Terminais:** enviam heartbeat conforme definido pelo Core; não inventam estado "online" para si próprios na UI do Command Center (a UI do Command Center consome o Core).
- **Core:** regista heartbeats; calcula liveness; expõe estado online/offline por terminal.
- **Command Center (Web):** mostra na árvore Terminals apenas o estado de liveness exposto pelo Core.

---

## 5. Proibição de bypass

É proibido:

- Permitir que a UI mostre "terminal online" quando o Core expõe "offline" (ou inverso), excepto por atraso de sincronização aceitável e documentada.
- Permitir que um terminal altere o próprio estado de liveness no Core sem enviar heartbeat conforme definido.
- Tratar "conexão aberta" ou "sessão activa" como substituto de heartbeat quando o Core exige heartbeat explícito para liveness.

---

## 6. Referências

- [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md) — Heartbeat e health check como parte da instalação.
- [CORE_CONTROL_PLANE_CONTRACT.md](./CORE_CONTROL_PLANE_CONTRACT.md) — Terminals na árvore; estado instalado/online.
- [CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md](./CORE_INSTALLATION_AND_PROVISIONING_CONTRACT.md) — Registro e autorização; heartbeat é parte da relação terminal–Core após instalação.

---

*Contrato de heartbeat e liveness. Alterações que permitam estado de liveness definido fora do Core ou exibição incorrecta online/offline violam este contrato.*
