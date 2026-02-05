# Desenvolvimento local — Core em baixo

**Data:** 2026-02-01  
**Objetivo:** Comportamento do merchant-portal quando o Docker Core não está a correr e como evitar loops/ruído na consola.

---

## Comportamento esperado

Quando o **backend é Docker** e o **Core não está disponível** (ex.: não executaste `npm run docker:core:up`):

1. **Banner:** O app mostra **"Core indisponível — na raiz do repo: `npm run docker:core:up`"** e o botão "Tentar novamente".
2. **Bootstrap:** Em `/bootstrap` (ex.: "Simular Registo (Piloto)" na Auth), **não há loop** para login — o fluxo vai para **`/preview`** (modo demo) em vez de redirecionar para `/login`.
3. **KDS:** O módulo KDS **não faz polling** a `gm_orders` quando o Core está em baixo (`coreReachable === false`), evitando 500 em loop na consola.
4. **FlowGate:** Após timeout (15 s), o app renderiza na mesma; podes explorar a UI em modo demo.

---

## Como ter dados reais em local

Na **raiz do repositório**:

```bash
npm run docker:core:up
```

Depois de o Core estar a correr, recarrega a página; o banner desaparece quando as chamadas ao Core passarem a responder.

**Nota:** Os pedidos `GET .../rest/v1/gm_restaurants`, `.../restaurant_setup_status`, `.../installed_modules` com **500 (Internal Server Error)** na consola/Network indicam que o proxy do Vite (localhost:5175 → 3001) não está a alcançar o PostgREST. Ou o Core não está a correr, ou a porta 3001 não é a do contentor. Confirmar que `npm run docker:core:up` está ativo e que o contentor expõe a porta 3001.

---

## Referências

- [TPV_MINIMAL_DOCKER_CORE.md](./TPV_MINIMAL_DOCKER_CORE.md) — Conexão TPV ao Docker Core
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) — Problemas comuns
