# Vertical Slice Brutal — DEBUG_DIRECT_FLOW

**Objetivo:** Provar que o sistema ainda respira quando se tira o “cérebro” e se deixa só o nervo.

Sem apagar nada. Sem refatorar tudo. Só ligar direto.

---

## O que é

Um **modo debug temporário** controlado por `VITE_DEBUG_DIRECT_FLOW=true` (em `.env` ou `.env.local`).

Quando ativo:

- **TPV** → escreve pedido (`create_order_atomic`) sem exigir turno aberto, ORE ou Wizard.
- **KDS** → lê `gm_orders` direto; não mostra BlockingScreen, não exige “operacao-real” nem Core “online”.
- **Dashboard** → ORE não bloqueia; conteúdo operacional visível sem turno.

**Sem:** Turno, ORE, ActivityContract, EventMonitor, Wizard, sensores, tarefas. Só o fluxo mínimo: TPV → Core → gm_orders → KDS/Dashboard leem direto.

---

## Como usar

1. Core Docker a correr (ex.: `make up` em `docker-core`).
2. No `merchant-portal`, criar ou editar `.env.local`:

   ```env
   VITE_DEBUG_DIRECT_FLOW=true
   ```

3. Reiniciar o dev server (`npm run dev`).
4. Abrir TPV (`/op/tpv`), criar um pedido (produto + confirmar).
5. Abrir KDS (`/op/kds`) e/ou Dashboard — o pedido deve aparecer sem “verificando…”, sem “abrir turno”, sem bloqueios.

---

## O que está bypassado

| Camada                  | Comportamento normal                                               | Com DEBUG_DIRECT_FLOW                             |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| useOperationalReadiness | Turno, MenuState, módulos                                          | Retorna `ready: true` sempre                      |
| ShiftGate               | Bloqueia TPV se turno fechado (“Abrir turno”)                      | Renderiza TPV sem verificar turno                 |
| KDS                     | BlockingScreen se turno fechado / não operacao-real / Core offline | Mostra lista de pedidos direto; polling a cada 5s |
| TPV                     | DemoExplicativoCard / “Core offline” se não operacao-real          | Mostra TPV; carrega produtos sem operacao-real    |
| Dashboard               | Info/banner “turno fechado”                                        | Sem bloqueio ORE por turno                        |

---

## Código tocado

- `merchant-portal/src/config.ts` — `CONFIG.DEBUG_DIRECT_FLOW` (lê `VITE_DEBUG_DIRECT_FLOW`).
- `merchant-portal/src/core/readiness/useOperationalReadiness.ts` — se `DEBUG_DIRECT_FLOW`, retorna `ready: true` logo.
- `merchant-portal/src/components/operational/ShiftGate.tsx` — se `DEBUG_DIRECT_FLOW`, renderiza filhos sem verificar turno.
- `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx` — se `DEBUG_DIRECT_FLOW`, não mostra DemoExplicativoCard nem bloqueio “Core offline”; carrega produtos mesmo sem coreStatus online.
- `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` — se `DEBUG_DIRECT_FLOW`, não retorna DemoExplicativoCard nem “Core offline”; polling ignora coreStatus/operationMode; intervalo 5s.

---

## Regra

- **Desligar em produção.** O flag existe para diagnóstico e para voltar a “ver o sistema vivo”.
- Depois de confirmar que o pedido atravessa TPV → Core → KDS/Dashboard, reintroduzir camadas uma a uma (Turno, ORE, tarefas), mantendo o nervo visível.

---

**Frase:** Arquitetura não cria vida. Fluxo cria vida. Arquitetura só organiza depois.
