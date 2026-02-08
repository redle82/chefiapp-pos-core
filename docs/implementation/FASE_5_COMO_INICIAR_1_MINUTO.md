# Como iniciar em 1 minuto (local)

Para dev/piloto com acesso ao repo: um único comando para ter o "chão" — Docker Core + Merchant-portal + browser.

---

## Pré-requisitos

- **Node.js** 18+ e **npm** (na raiz: `npm install` se ainda não instalaste).
- **Docker** instalado e **Docker daemon em execução** (ex.: Docker Desktop aberto).

---

## Um comando

Na **raiz do repositório**:

```bash
./start-local.sh
```

ou

```bash
npm run start:local
```

O script:

1. Verifica se o Docker está em execução (se não estiver, indica que inicies o Docker Desktop).
2. Sobe o Docker Core (`npm run docker:core:up`).
3. Sobe o Merchant-portal (Vite em http://localhost:5175).
4. Abre o browser nessa URL quando o servidor estiver pronto.

---

## Alternativa manual (dois terminais)

Se preferires controlar cada parte:

**Terminal 1 — Docker Core**

```bash
npm run docker:core:up
```

**Terminal 2 — Merchant-portal**

```bash
cd merchant-portal && npm run dev
```

Depois abre http://localhost:5175 no browser.

---

## Se vires "Core indisponível"

O banner vermelho "Core indisponível" aparece quando o backend (Docker Core) não está acessível. Garante que:

1. O Docker está em execução.
2. Correste `npm run docker:core:up` (ou `./start-local.sh`) e os containers subiram sem erro.

Se o Docker daemon não estiver disponível (ex.: em alguns ambientes CI), o único caminho é usar a app em **produção** (deploy com Supabase) — ver [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md).

---

## 404 no console (get_operational_metrics / get_shift_history)

Se o Docker Core estiver a correr mas **não expuser** as RPCs `get_operational_metrics` e `get_shift_history` no PostgREST (porta 3001), é **esperado** ver no console:

- **404 (Not Found)** para `/rest/v1/rpc/get_operational_metrics` e `/rest/v1/rpc/get_shift_history`.

A aplicação **não quebra**: as secções de métricas operacionais e histórico de turnos no dashboard mostram estado vazio. Para eliminar os 404, é preciso implementar/expor essas funções no schema do Docker Core que alimenta o PostgREST. Ver [API_ERROR_CONTRACT.md](API_ERROR_CONTRACT.md) (secção "Comportamento esperado em dev").

**Tabela gm_shift_checklist_templates:** Se o Core não tiver esta tabela (existe no Supabase, não nas migrations do Docker Core), é **esperado** 404 em HEAD/POST/GET a `/rest/v1/gm_shift_checklist_templates`. O frontend trata como "sem templates" e não mostra erro na UI (ShiftChecklistWriter / ShiftChecklistReader tolerantes a 404).

---

## FlowGate: timeout de carregamento (5s em Docker)

Em modo Docker, o **FlowGate** usa um timeout de **5 segundos** para o fluxo de decisão (estado do sistema, tenant, etc.). Se o `checkFlow()` não terminar antes disso, o componente força o render (`forcing render`) para evitar ecrã em branco indefinido.

- O aviso no console `[FlowGate] Loading timeout (5000ms) - forcing render` é **intencional**: actua como rede de segurança quando o backend está lento ou indisponível.
- O dashboard acaba por aparecer; a aplicação não fica bloqueada. Se quiseres menos ruído no console, podes rever o fluxo de `checkFlow()` em modo Docker (garantir que `setIsChecking(false)` é chamado em todos os ramos assim que a decisão estiver tomada).

---

## Referências

- [FASE_5_FASE_B_RESULTADO.md](FASE_5_FASE_B_RESULTADO.md) — Resultado do Teste Humano; ligação a este doc quando Falhou por impossibilidade operacional.
- [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md) — Para dono real (abrir URL, sem Docker).
