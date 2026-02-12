## InsForge Conformity Checklist — merchant-portal

### 1. SDK & Client Setup

- [ ] **SDK instalado**: `@insforge/sdk` presente em `package.json` (versão recomendada pela doc MCP).
- [ ] **Cliente único**: existe `insforge` singleton em `src/core/infra/insforgeClient.ts` criado com `createClient({ baseUrl, anonKey })`.
- [ ] **Fonte das configs**: `baseUrl` e `anonKey` vêm de `CONFIG.INSFORGE_URL` e `CONFIG.INSFORGE_ANON_KEY` (sem hard‑code).
- [ ] **Health check**: função `checkInsforgeHealth()` implementada e usada em validações.

### 2. Uso de SDK vs MCP

- [ ] **Lógica de app** usa apenas SDK/REST:
  - Auth (login/logout, sessão)
  - Database CRUD (`insforge.database.from(...)`)
  - Storage (`insforge.storage`)
  - Realtime (`insforge.realtime`)
  - Functions/AI (quando existirem)
- [ ] **MCP restrito a infraestrutura**:
  - `download-template`, `get-backend-metadata`, `get-table-schema`, `create-bucket`, `create-function`, `create-deployment`, etc.
- [ ] **Nenhum código de runtime** depende de MCP (apenas docs/scripts externos).

### 3. Backend Switching & Hybrid Backend

- [ ] **Seleção automática**: `backendClient` escolhe InsForge ou Docker Core apenas com base em `CONFIG.INSFORGE_URL`.
- [ ] **Analytics separado**: `analyticsClient` usa InsForge quando ativo, com fallback limpo para Docker Core.
- [ ] **Operações críticas** (orders, pagamentos) continuam a usar `coreClient` (não InsForge).
- [ ] **Tests verdes**: suites `backendClient.test.ts`, `hybridBackend*.test.ts` e `validateInsforgeSetup.test.ts` passam.

### 4. Auth, DB, Storage, Realtime, AI

- [ ] **Auth**:
  - Fluxo alinhado com `auth-sdk-typescript` ou componentes de auth (quando usados).
  - Tokens nunca armazenados em localStorage sem necessidade; preferir storage seguro/estratégia recomendada.
- [ ] **Database**:
  - Inserts usam sempre array (`[{ ... }]`) conforme doc InsForge.
  - Queries seguem padrão `{ data, error }` com tratamento de erro explícito.
- [ ] **Storage**:
  - Uploads vão para buckets InsForge; URLs persistidas em tabelas adequadas.
  - Nenhuma chave secreta de storage exposta no frontend.
- [ ] **Realtime** (se usado):
  - Canais e eventos seguem contrato documentado.
  - Reconexão e erros são tratados de forma resiliente.
- [ ] **AI / Functions**:
  - Chamadas OpenAI‑compatíveis via InsForge respeitam limites e tratamento de erro.
  - Edge Functions InsForge (por ex. Cognitive Subscriber) estão descritas em ficheiros de spec, não misturadas com runtime Core.

### 5. Configuração, Ambiente e Segurança

- [ ] **Separação de ambientes**:
  - `.env.example` documenta InsForge para produção.
  - `.env.local.example` mantém InsForge opcional e Docker Core como default local.
  - `.env.example.production` define apenas anon key e URL seguras.
- [ ] **Chaves sensíveis**:
  - Apenas `VITE_INSFORGE_ANON_KEY` é exposta ao frontend.
  - Nenhuma `service_role` ou `admin` key de InsForge aparece no código ou ficheiros de env do frontend.
- [ ] **Rotação de chaves**:
  - Existe procedimento de rotação documentado em `INSFORGE_DEPLOYMENT_CHECKLIST.md`.
  - Chaves antigas são invalidadas sempre que expostas.

### 6. Validação & Deploy

- [ ] **Script de validação**:
  - `validateInsforgeSetup()` existe e pode ser executada via consola (`validateInsforge()`).
  - Saída mostra passos de env, backend selection, client init e query de teste.
- [ ] **Relatório de validação**:
  - `INSFORGE_VALIDATION_REPORT.md` atualizado após alterações relevantes.
- [ ] **Checklist de deployment**:
  - `INSFORGE_DEPLOYMENT_CHECKLIST.md` seguido antes de ativar InsForge em produção.

### 7. Observabilidade & Rollback

- [ ] **Logs**:
  - Erros de InsForge (health, queries, analytics) são logados com contexto mínimo necessário, sem dados sensíveis.
- [ ] **Monitorização**:
  - Há instruções para consultar logs InsForge e Vercel.
- [ ] **Rollback**:
  - Plano claro para desligar InsForge (remover `VITE_INSFORGE_URL`/`VITE_INSFORGE_ANON_KEY`) e voltar a Docker Core sem alterações de código.

---

**Uso recomendado:**  
Rever este checklist sempre que:
- Ativa/desativa InsForge como backend.
- Atualiza `@insforge/sdk` ou contratos de Edge Functions.
- Faz alterações relevantes em `insforgeClient`, `backendClient` ou `analyticsClient`.

