# 📸 SNAPSHOT DE CONFIGURAÇÃO - Central de Comando ChefIApp
**Data:** 2026-01-27  
**Versão:** 1.0  
**Status:** ✅ Estável e Validado

---

## 🎯 PROPÓSITO

Este documento preserva a configuração completa do Central de Comando para garantir:
- Zero quebras em atualizações futuras
- Restauração rápida em caso de problemas
- Onboarding de novos desenvolvedores
- Manutenção consistente

---

## 📁 ESTRUTURA DE ARQUIVOS

```
central-comando/
├── index.ts                    # Servidor HTTP principal (porta 4321)
├── test-progress.ts            # Detecção de runs e status de fases
├── ui/html.ts                  # Geração de HTML e JavaScript
├── views/index.ts              # Configuração de modos de visualização
├── collectors/                  # Coletores de métricas
│   ├── infrastructure.ts       # Docker, CPU, RAM, containers
│   ├── database.ts             # Postgres, TPS, locks, queries
│   ├── events.ts               # Event System, taxa, tipos
│   ├── tasks.ts                # Task Engine, SLA, criação
│   ├── operation.ts            # Restaurantes, pedidos, KDS, estoque
│   └── users.ts                # Usuários e dispositivos
├── streams/                    # Streams em tempo real (SSE)
│   └── test-progress.ts        # (implementado inline em index.ts)
├── RULES.md                    # Regras críticas de operação
├── CONFIG_SNAPSHOT.md          # Este arquivo
├── README.md                   # Documentação geral
└── start.sh                    # Script de inicialização
```

---

## ⚙️ CONFIGURAÇÕES CRÍTICAS

### Porta do Servidor
```typescript
const PORT = 4321;
```
**⚠️ NÃO ALTERAR** sem atualizar documentação e scripts.

### Diretório de Resultados
```typescript
const RESULTS_DIR = path.join(process.cwd(), "test-results", "NIVEL_5");
```
**⚠️ NÃO ALTERAR** - usado por múltiplos componentes.

### Timeouts
```typescript
const TIMEOUT = 5000; // 5 segundos por coletor
const REQUEST_TIMEOUT = 10000; // 10 segundos total por requisição
```
**⚠️ NÃO REDUZIR** abaixo de 5s - pode causar timeouts falsos.

### Intervalos de Atualização
- **SSE Test Progress:** 1000ms (1 segundo)
- **SSE Docker Events:** tempo real (sem intervalo)
- **HTML Refresh (Laboratory):** 1 segundo
- **HTML Refresh (Operational):** 5 segundos
- **HTML Refresh (Executive):** 15 segundos
- **HTML Refresh (Audit):** sob demanda

---

## 🔐 RBAC (Role-Based Access Control)

### Variáveis de Ambiente (Opcionais)
```bash
CENTRAL_TOKEN_ENGINEERING=<token>  # Acesso a laboratory/operational
CENTRAL_TOKEN_OWNER=<token>       # Acesso a owner/executive
CENTRAL_TOKEN_AUDIT=<token>       # Acesso a audit
```

**Comportamento:**
- Se **nenhum token** estiver configurado → RBAC **desabilitado** (acesso livre)
- Se **qualquer token** estiver configurado → RBAC **habilitado** (acesso restrito)

### Regras de Acesso
- **laboratory/operational:** Apenas `engineering`
- **executive:** `owner` ou `engineering`
- **owner:** Apenas `owner`
- **audit:** `audit` ou `engineering`

---

## 📊 MODOS DE VISUALIZAÇÃO

### 🧪 Laboratory
- **URL:** `http://localhost:4321?mode=laboratory`
- **Atualização:** 1 segundo
- **Métricas:** Todas (infrastructure, database, events, tasks, operation, users)
- **SSE:** Habilitado (test-progress + docker-events)
- **Uso:** Engenheiros, QA, DevOps

### 🧠 Operational
- **URL:** `http://localhost:4321?mode=operational`
- **Atualização:** 5 segundos
- **Métricas:** Todas (foco em alertas)
- **SSE:** Habilitado
- **Uso:** SRE, DevOps, Suporte

### 👔 Executive
- **URL:** `http://localhost:4321?mode=executive`
- **Atualização:** 15 segundos
- **Métricas:** Apenas business (operation, tasks SLA)
- **SSE:** Desabilitado
- **Uso:** C-Level, Account Managers

### ⚖️ Audit
- **URL:** `http://localhost:4321?mode=audit`
- **Atualização:** Sob demanda
- **Métricas:** Todas (foco em cadeia de eventos)
- **SSE:** Desabilitado
- **Uso:** Auditores, Compliance

### 🏠 Owner
- **URL:** `http://localhost:4321?mode=owner`
- **Atualização:** 5 segundos
- **Métricas:** Apenas business (zero técnico)
- **SSE:** Desabilitado
- **Uso:** Donos de restaurante

---

## 🔄 STREAMS SSE (Server-Sent Events)

### `/stream/test-progress`
- **Tipo:** SSE (text/event-stream)
- **Intervalo:** 1000ms
- **Payload:**
  ```json
  {
    "runId": "uuid",
    "phases": [{"name": "...", "status": "...", "current": 1, "total": 100}],
    "activeFiles": [...],
    "timestamp": "ISO8601"
  }
  ```
- **Autorização:** Requer `laboratory` mode (se RBAC habilitado)

### `/stream/docker-events`
- **Tipo:** SSE (text/event-stream)
- **Fonte:** `docker events --format "{{json .}}"`
- **Payload:** Eventos Docker em tempo real
- **Autorização:** Requer `laboratory` mode (se RBAC habilitado)

---

## 📈 DETECÇÃO DE RUNS

### Função: `getLatestRunId()`
**Localização:** `test-progress.ts`

**Lógica:**
1. Lista diretórios em `test-results/NIVEL_5/`
2. Filtra apenas diretórios com `progress.ndjson`
3. Ordena por `mtime` (modification time)
4. Prioriza runs recentes (últimos 30 minutos)
5. Retorna o mais recente

**⚠️ CRÍTICO:** Esta função é chamada a cada segundo pelo SSE. Qualquer mudança deve manter performance.

### Função: `getPhaseStatus(runId)`
**Localização:** `test-progress.ts`

**Lógica:**
1. Lê `progress.ndjson` do run
2. Parseia eventos `__PROGRESS__`
3. Mapeia eventos para fases conhecidas
4. Determina status: `pending` → `running` → `complete`/`failed`
5. Extrai `current`/`total` para progresso numérico

**Fases Conhecidas:**
- FASE 0: Preflight
- FASE 1: Setup Massivo
- FASE 2: Pedidos Caos
- FASE 3: KDS Stress
- FASE 4: Task Extreme
- FASE 5: Estoque Cascata
- FASE 6: Multi-Dispositivo
- FASE 7: Time Warp
- FASE 8: Relatório Final

---

## 🎨 GERAÇÃO DE HTML

### Função: `createHTML(metrics, viewMode, startTime)`
**Localização:** `ui/html.ts`

**Estrutura:**
1. Header (título, estatísticas, alertas)
2. Mode Selector (botões de navegação)
3. Alerts Section (críticos e avisos)
4. Test Progress Section (fases, barras de progresso)
5. Infrastructure Section (Docker, CPU, RAM)
6. Database Section (Postgres, TPS, locks)
7. Events Section (Event System)
8. Tasks Section (Task Engine, SLA)
9. Operation Section (Restaurantes, pedidos, KDS, estoque)
10. Users Section (Usuários e dispositivos)
11. Footer (timestamp, modo)

### JavaScript Inline
**Localização:** `getScript(config)` em `ui/html.ts`

**Funcionalidades:**
1. Auto-refresh do HTML (conforme `config.updateInterval`)
2. SSE Test Progress (`initTestProgressStream()`)
3. SSE Docker Events (`initDockerStream()`)
4. Atualização de timestamp
5. Preservação de scroll position

**⚠️ CRÍTICO:** Template strings devem usar `${config.mode}` corretamente (não string literal).

---

## 🔧 COLETORES DE MÉTRICAS

### Infrastructure (`collectors/infrastructure.ts`)
- **Docker:** `docker ps`, `docker stats`, `docker inspect`
- **Sistema:** CPU, RAM (mockado para performance)
- **Timeout:** 5s
- **Fallback:** Retorna `null` em caso de erro

### Database (`collectors/database.ts`)
- **Queries:** `pg_stat_statements`, `pg_locks`, `pg_stat_activity`
- **Métricas:** TPS, latência P95, locks ativos, eventos/seg
- **Timeout:** 5s
- **Fallback:** Retorna métricas vazias

### Events (`collectors/events.ts`)
- **Queries:** `gm_events` table
- **Métricas:** Taxa de eventos, tipos, backlog, latência
- **Timeout:** 5s

### Tasks (`collectors/tasks.ts`)
- **Queries:** `gm_tasks` table (filtrado por `run_id` se disponível)
- **Métricas:** Criação, resolução, SLA (violado, em risco, expirado)
- **Filtro:** Prioriza tasks do run atual, fallback para restaurantes de teste
- **Timeout:** 5s

### Operation (`collectors/operation.ts`)
- **Queries:** `gm_restaurants`, `gm_orders`, `gm_order_items`, `gm_stock`
- **Métricas:** Restaurantes ativos/offline, pedidos, KDS, estoque crítico
- **Timeout:** 5s

### Users (`collectors/users.ts`)
- **Queries:** `gm_users`, `gm_devices`
- **Métricas:** Usuários ativos por cargo (garçom, cozinheiro, bar, gerente)
- **Timeout:** 5s

---

## 🚨 REGRAS CRÍTICAS (NUNCA VIOLAR)

### 1. NUNCA usar `pkill` genérico
```bash
# ❌ ERRADO
pkill -f "tsx.*teste-massivo"

# ✅ CORRETO
pkill -f "tsx.*central-comando/index.ts"  # Específico
# OU usar Ctrl+C no processo específico
```

### 2. Detecção de Run Ativo
- `getLatestRunId()` DEVE priorizar runs recentes (últimos 30min)
- Se `runId` for `null`, Central mostra "Nenhum teste ativo"
- Run é detectado pelo `mtime` de `progress.ndjson`

### 3. Atualização em Tempo Real
- SSE atualiza a cada 1 segundo
- HTML refresh conforme modo (1s, 5s, 15s, sob demanda)
- SSE e HTML refresh NÃO devem conflitar

### 4. Flush de Progresso
- Teste DEVE usar `fs.writeSync(1, ...)` para forçar flush
- Arquivo `progress.ndjson` DEVE ser escrito em tempo real
- Sem flush, Central não vê atualizações

### 5. Template Strings no JavaScript
```typescript
// ❌ ERRADO (string literal)
if (['laboratory', 'operational'].includes('${config.mode}'))

// ✅ CORRETO (interpolação)
const currentMode = '${config.mode}';
if (['laboratory', 'operational'].includes(currentMode))
```

---

## 🔄 FLUXO DE DADOS

```
Teste Massivo
  ↓ (emitProgress)
progress.ndjson (escrito em tempo real com flush)
  ↓ (getLatestRunId + getPhaseStatus)
Central de Comando (index.ts)
  ↓ (SSE /stream/test-progress)
Frontend (EventSource)
  ↓ (DOM updates)
UI (atualização em tempo real)
```

---

## 🛠️ INICIALIZAÇÃO

### Script: `start.sh`
```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../../.."  # Ir para raiz do projeto
npx tsx scripts/teste-massivo-nivel-5/central-comando/index.ts
```

### Manual
```bash
cd /path/to/chefiapp-pos-core
npx tsx scripts/teste-massivo-nivel-5/central-comando/index.ts
```

### Variáveis de Ambiente (Opcionais)
```bash
CENTRAL_TOKEN_ENGINEERING=xxx npx tsx scripts/teste-massivo-nivel-5/central-comando/index.ts
```

---

## 🐛 TROUBLESHOOTING

### Central não mostra progresso
1. Verificar se `progress.ndjson` existe: `ls -la test-results/NIVEL_5/*/progress.ndjson`
2. Verificar se run está ativo: `ps aux | grep teste-massivo`
3. Verificar SSE: `curl http://localhost:4321/stream/test-progress`
4. Verificar console do browser (F12) para erros JavaScript

### SSE não conecta
1. Verificar se Central está rodando: `curl http://localhost:4321/`
2. Verificar logs do Central (console onde iniciou)
3. Verificar se modo é `laboratory` ou `operational` (SSE só nesses modos)
4. Verificar RBAC (se tokens configurados, precisa de token válido)

### Progresso não atualiza
1. Verificar se `emitProgress` está sendo chamado no teste
2. Verificar se arquivo está sendo escrito: `tail -f test-results/NIVEL_5/*/progress.ndjson`
3. Verificar se `getLatestRunId()` retorna o run correto
4. Verificar se `getPhaseStatus()` está parseando eventos corretamente

### `runId` retornando `null`
1. Verificar se diretório `test-results/NIVEL_5/` existe
2. Verificar se há runs com `progress.ndjson`
3. Verificar permissões de leitura
4. Verificar logs do Central para erros em `getLatestRunId()`

---

## 📝 CHECKLIST DE MANUTENÇÃO

Antes de fazer mudanças:
- [ ] Ler este documento completamente
- [ ] Verificar impacto em outros componentes
- [ ] Testar em ambiente isolado
- [ ] Atualizar este documento se necessário
- [ ] Verificar que não quebra regras críticas

Após mudanças:
- [ ] Testar todos os modos de visualização
- [ ] Testar SSE (test-progress + docker-events)
- [ ] Testar detecção de runs
- [ ] Testar RBAC (se aplicável)
- [ ] Verificar performance (timeouts)

---

## 🔗 DEPENDÊNCIAS

### Node.js
- `tsx` (TypeScript executor)
- `pg` (PostgreSQL client)

### Sistema
- `docker` (CLI) - para `docker events`, `docker ps`, `docker stats`
- `psql` (opcional) - para diagnóstico direto

### Banco de Dados
- PostgreSQL rodando (Docker Core)
- Extensões: `pg_stat_statements` (opcional, para métricas avançadas)

---

## 📚 REFERÊNCIAS

- `RULES.md` - Regras operacionais detalhadas
- `README.md` - Documentação geral do Central
- `../progress.ts` - Sistema de progresso do teste
- `../index.ts` - Orquestrador do teste massivo

---

## ✅ VALIDAÇÃO

Este snapshot foi validado em:
- **Data:** 2026-01-27
- **Run ID:** `cb6479e0-75fe-4c5a-812f-af1510c23849`
- **Status:** ✅ Todas as fases completas
- **Performance:** ✅ Sem timeouts, SSE funcionando
- **UI:** ✅ Todos os modos funcionando

---

**⚠️ IMPORTANTE:** Este documento deve ser atualizado sempre que houver mudanças estruturais no Central de Comando.
