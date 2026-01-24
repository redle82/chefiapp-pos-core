# ARTEFATO 5 — Performance & Boot (Merchant Portal)

Data: 2026-01-04
Escopo: **merchant-portal** (Vite/React)
Objetivo: produzir uma lista **P0/P1** de performance com ganhos **mensuráveis**, baseada em coleta reproduzível.

---

## 0) Definições (para não medir errado)

- **TTFB**: tempo até o primeiro byte do HTML.
- **FCP**: primeiro conteúdo renderizado.
- **LCP**: maior elemento visível renderizado (principal métrica de “carregou”).
- **CLS**: instabilidade visual (layout shift).
- **Hydration**: tempo/custo de “ligar” React em cima do HTML.
- **Critical CSS**: CSS necessário para o primeiro paint (antes de async/lazy).

**Regra de ouro**: medir com o mesmo perfil (máquina/rede) e registrar o contexto.

---

## 1) Métricas-alvo (risk × return)

> Estes alvos são operacionais (não “marketing”). Ajuste fino só após 1 rodada de baseline.

- **P0 (Go-live safety)**
  - LCP p75: $\le 2.5s$ (desktop); $\le 3.5s$ (laptop médio)
  - CLS p75: $\le 0.10$
  - TTFB p75: $\le 800ms$ (local/rede ok)
  - Long tasks (Main thread): reduzir picos visíveis em navegação inicial

- **P1 (Scale / polish)**
  - LCP p75: $\le 2.0s$ (desktop)
  - JS parse/execute: queda clara vs baseline
  - Split por domínio (TPV/AppStaff fora do first-load quando não usados)

**Contexto mínimo obrigatório a registrar**:
- Máquina (CPU/RAM), Browser (Chrome/Safari + versão)
- Rede (Wi‑Fi, tether, “Fast 3G” simulado, etc.)
- Modo (dev / build+preview)

---

## 2) Checklist de coleta (enxuto e reproduzível)

### 2.1 Build (sempre em modo release)

1) Build do portal:
- `npm -w merchant-portal run -s build`

2) Registrar tamanhos gerados:
- `ls -lh merchant-portal/dist/assets`
- `wc -c merchant-portal/dist/assets/*`

> Resultado esperado: tabela de assets (JS/CSS) e total.

### 2.2 Baseline de Web Vitals (sem instalar nada)

**Opção A (recomendado): Chrome DevTools Lighthouse**
1) Rodar preview:
- `npm -w merchant-portal run -s preview -- --host 127.0.0.1 --port 4173 --strictPort`
2) Abrir Lighthouse (Mobile + Desktop) e exportar report (HTML/JSON).
3) Registrar FCP/LCP/CLS/TTI/TBT.

**Opção B: DevTools Performance**
- Gravar navegação inicial e 1 navegação interna (rota crítica).
- Registrar:
  - tempo de scripting
  - long tasks
  - principais bundles carregados

### 2.3 Hydration (sinais práticos)

Capturar 2 sinais (mínimo):
- “Time to interactive real”: quando o primeiro clique/tecla responde sem lag.
- Pico de CPU após load (se existir) e duração.

---

## 3) Rotas e cenários (métrica só vale se for cenário real)

Rodar no mínimo:
- **Rota inicial**: login/entry (primeiro acesso)
- **Dashboard/home**
- **1 rota pesada** (TPV OU AppStaff) — para confirmar split

Registrar para cada cenário:
- LCP / CLS
- Total de JS carregado na rota
- Se carregou chunks pesados “sem necessidade”

---

## 4) Registro do baseline (preencher após coleta)

### 4.1 Build assets (dist)

Baseline (coletado via `npm -w merchant-portal run -s build` em 2026-01-04):

| Arquivo | Tipo | Tamanho (bytes) | Observação |
|---|---:|---:|---|
| index-PbO9xzhW.js | JS | 782099 | chunk principal (warning > 500 kB minificado) |
| StaffModule-CJ3Gpseh.js | JS | 27189 | chunk separado |
| KitchenDisplay-CZ9Hy5Nn.js | JS | 23747 | chunk separado |
| demo-reviews-Cm5rVoL2.js | JS | 6986 | chunk separado |
| index-CJYg7Wgk.css | CSS | 55005 | bundle CSS |

**Total assets listados (bytes)**: 895026

Notas:
- O build emite warning conhecido de esbuild: `Duplicate key "border"` em `src/pages/AppStaff/WorkerTaskFocus.tsx` (tratado como higiene/P2).

**Total JS (bytes)**: 840021

**Total CSS (bytes)**: 55005

### 4.2 Web Vitals (Lighthouse/DevTools)

| Cenário | Modo | TTFB | FCP | LCP | CLS | TBT | Observação |
|---|---|---:|---:|---:|---:|---:|---|
| Entry/Login | preview |  |  |  |  |  |  |
| Home/Dashboard | preview |  |  |  |  |  |  |
| Rota pesada (TPV/Staff) | preview |  |  |  |  |  |  |

---

## 5) Rotas para medir (Lighthouse)

> Preview rodando em: `http://127.0.0.1:4173`

| # | URL | Descrição | Tipo |
|---|---|---|---|
| 1 | `/login` | Primeira impressão (anon) | entry |
| 2 | `/app/dashboard` | Pós-login (authenticated home) | core |
| 3 | `/app/tpv` | TPV (rota pesada principal) | heavy |

Alternativa para Staff (se relevante):
- `/app/staff` — lazy-loaded satellite (já tem split próprio)

---

## 6) Tabela de decisão (Se X, então Y)

> Preencher após Lighthouse. Objetivo: transformar números em ação sem discussão infinita.

| Condição (X) | Decisão (Y) | Prioridade |
|---|---|---|
| LCP mobile > 3.5s **E** JS principal > 500 kB | Split imediato: isolar rotas pesadas (TPV/Staff) do entry bundle | **P0** |
| LCP mobile > 3.5s **MAS** JS < 500 kB | Investigar TTFB/rede/back-end (não é front) | investigar |
| LCP mobile ≤ 3.5s **E** desktop ≤ 2.5s | Adiar split; UX aceitável para go-live | P1 |
| CLS > 0.10 em qualquer rota | P0: reservar espaço (img/cards), placeholder de fontes | **P0** |
| TBT > 300ms | P0: adiar inicializações, cortar trabalho síncrono no boot | **P0** |
| Unused JS > 40% do total | P0: tree-shake, remover deps mortas, lazy imports | **P0** |
| Unused JS ≤ 40% **E** LCP ok | P1: limpeza, mas não urgente | P1 |

---

## 7) Lista P0/P1 (a preencher a partir dos achados)

### P0 (impacto imediato / risco alto)
- [ ] 

### P1 (alto ROI, menor urgência)
- [ ] 

---

## 8) Heurísticas extras (referência rápida)

- Se **LCP alto** + **JS alto** no first-load → P0: split/lazy em rotas pesadas.
- Se **CLS alto** → P0: reservar espaço (img/cards), evitar fontes/altura dinâmica sem placeholder.
- Se **TBT/long tasks** → P0: cortar trabalho síncrono no boot, adiar inicializações.
- Se **TTFB alto** → investigar servidor/rede/cache (fora do UI-only).
