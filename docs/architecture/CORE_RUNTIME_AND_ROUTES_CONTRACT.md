# CORE_RUNTIME_AND_ROUTES_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato de runtime e rotas (Pilot Law)
**Local:** docs/architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md
**Hierarquia:** Subordinado ao [CLOSED_PILOT_CONTRACT.md](./CLOSED_PILOT_CONTRACT.md) e ao [CORE_SYSTEM_OVERVIEW.md](./CORE_SYSTEM_OVERVIEW.md)

**Visão produto (fluxo do cliente):** [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — Landing vende, Portal configura, Operação executa, Billing controla.

**Índice rota → contrato MD:** [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — toda a rota oficial mapeada para o contrato que a governa.

---

## Lei do sistema

Sem servidor ativo, o sistema não existe.
Sem rota definida aqui, a rota não existe.

---

## Runtime Authority (Closed Pilot)

Durante o piloto fechado:

- O merchant-portal é a autoridade única de runtime Web.
- O servidor é iniciado via Vite.
- O servidor DEVE estar ativo para qualquer teste ou operação.

**Runtime oficial:**

- Host: localhost
- Porta: 5157 (porta oficial do portal; não mudar)
- Protocolo: http

Nenhuma outra porta é permitida no piloto.

---

## Rotas oficiais

### 1. Marketing público (sem Runtime/Core)

- `/` — Landing (CTAs: /signup, /auth, /demo)
- `/demo` — Demonstração
- `/pricing`, `/features` — Páginas públicas

### 2. Auth e entrada

- `/signup` — Criação de conta → após signup redireciona para `/app/dashboard`
- `/auth` — Login; destino pós-login: `/app/dashboard` (portal central)
- `/login`, `/forgot-password` — redirecionam para `/auth` (ou fluxo equivalente)

### 3. Portal de gestão (/app)

- `/app/dashboard` — Comando central
- `/app/restaurant`, `/app/menu`, `/app/people`, `/app/payments`, `/app/billing`, `/app/settings`, `/app/publish` — Configuração e publicação

### 4. Operação (/op)

- `/op/tpv` — TPV (gate: published + billing ativo + caixa)
- `/op/kds` — KDS (mesmo gate)
- `/op/cash` — Caixa (redireciona ou exige turno aberto)
- `/op/staff` — AppStaff Web (se existir)

Legado: `/tpv` → `/op/tpv`, `/kds-minimal` → `/op/kds`.

### 5. Web pública do restaurante

- `/public/:slug` — Site do restaurante (menu, horários, etc.; ativo se `isPublished === true`)

### 6. Outros

- `/billing/success` — Callback pós-pagamento (sem Runtime)
- `/onboarding`, `/onboarding/:section` — Opcionais (checklist/ajuda); sem redirect obrigatório. Bloqueios apenas em TPV/KDS (RequireOperational).

---

## Rotas proibidas (não inferir)

- `/admin` (como rota de gestão genérica)
- Qualquer rota em outra porta
- Qualquer rota fora desta lista

_(Nota: `/login` existe como redirect para `/auth`; não inferir outras variantes.)_

---

## Boot por camada (APPLICATION_BOOT_CONTRACT)

A landing (`/`, `/demo`, `/auth`, `/billing/success`) **não** inicializa Runtime nem Core — ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md). Rotas de gestão e operação montam RestaurantRuntimeProvider e ShiftProvider; a landing é 100% desacoplada e deve funcionar com backend desligado.

---

## Regra para humanos, scripts e IA

- Não inferir host, porta ou rota.
- Não criar fallback automático.
- Não "ajudar" apontando para outro localhost.
- Se não estiver aqui, NÃO existe.

**Violação = regressão arquitetural.**
