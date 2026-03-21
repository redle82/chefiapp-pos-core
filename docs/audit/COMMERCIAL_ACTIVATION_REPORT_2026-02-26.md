# Relatório de Ativação Comercial — ChefiApp (2026-02-26)

**Objetivo:** Tornar o produto publicamente acessível, funcional e vendável em 7 dias.  
**Escopo:** Deploy público, onboarding mínimo, fluxo de tarefas, marca/specimen, check de venda.

---

## 1. DEPLOY PÚBLICO — Diagnóstico Técnico

### 1.1 Estado atual

| Item | Estado |
|------|--------|
| **chefiapp.com** | ❌ 404 — `DEPLOYMENT_NOT_FOUND` |
| **www.chefiapp.com** | ❌ 404 — `DEPLOYMENT_NOT_FOUND` |
| **Projeto Vercel chefiapp-pos-core** | Ativo (prj_hQ4hyfAM1KRC3u4FM9ZAZZ4QQWYM) |
| **Último deployment** | ERROR — build falhou |
| **Domínios do projeto** | chefiapp-pos-core-goldmonkeys-projects.vercel.app, chefiapp-pos-core-git-main-goldmonkeys-projects.vercel.app |

### 1.2 Causa raiz do 404

O domínio chefiapp.com (e www) está configurado para apontar a uma **implementação que não existe** (deployment removido ou projeto antigo). O erro `DEPLOYMENT_NOT_FOUND` indica que o ID de deployment referenciado pelo domínio foi eliminado ou o domínio aponta para um projeto/deploy inexistente.

### 1.3 Causa raiz do build falhado (chefiapp-pos-core)

O último deploy (branch `refactor/stack-2026-phases-1-4`, commit 8aed92b) falhou com:

```
VoiceCommandService.ts:188:7: ERROR: Expected ";" but found "const"
  export const voiceCommandService = new VoiceCommandService();
```

O build local na branch atual **passa** — indicando que a branch `refactor/stack-2026-phases-1-4` tem código diferente (possível erro de sintaxe ou merge incompleto).

### 1.4 Proteção SSO

As URLs de preview (ex.: chefiapp-pos-core-fa1ck5udl-goldmonkeys-projects.vercel.app) exigem **"Log in to Vercel"** e **"Single Sign-On is required"**. Isto é **Vercel Deployment Protection**, não proteção da app. Para produção, é preciso garantir que o domínio principal (chefiapp.com) esteja associado a um deployment de **production** e que a proteção de preview não se aplique ao domínio de produção.

### 1.5 Verificações necessárias

| Verificação | Ação |
|-------------|------|
| **Domínio no Vercel** | Vercel Dashboard → chefiapp-pos-core → Settings → Domains: confirmar se chefiapp.com e www.chefiapp.com estão associados e a que deployment apontam |
| **Branch de produção** | Verificar qual branch está configurado para Production (main vs refactor/stack-2026-phases-1-4) |
| **Build verde** | Garantir que a branch de produção tem build OK (corrigir VoiceCommandService se a branch refactor for production) |
| **Promover deployment** | Se existir um deployment READY (ex.: dpl_EMKd1thn1ppGickMwg6nSUbWFUUc), promover a Production e reassociar o domínio |

### 1.6 Ações imediatas recomendadas

1. **Vercel Dashboard:** Settings → Domains — verificar configuração de chefiapp.com e www.chefiapp.com.
2. **Production branch:** Garantir que `main` (ou a branch desejada) está configurada para Production e que o build passa.
3. **Redeploy:** Fazer push em `main` com código estável OU corrigir a branch refactor e fazer merge, de seguida redeploy.
4. **Desativar Vercel Protection em produção:** Se o domínio de produção estiver sob protection, desativar para permitir acesso público.

---

## 2. ONBOARDING MÍNIMO VIÁVEL

### 2.1 Fluxo existente

| Etapa | Implementação |
|-------|---------------|
| **Criar conta** | OnboardingStartPage → `initializeOnboarding(name)` → RPC `create_onboarding_context` |
| **Criar restaurante** | create_onboarding_context cria org + restaurant no Core |
| **Criar staff** | Passo "staff" no OnboardingAssistantPage (9 passos) |
| **Backend** | OnboardingClient usa `getCoreClient().rpc()` — Core Docker (create_onboarding_context, get_onboarding_state, update_onboarding_step) |

### 2.2 Validações

- OnboardingStartPage valida `name.trim()` antes de chamar `initializeOnboarding`.
- OnboardingAssistantPage tem `setupData` com ownerName, ownerEmail, etc.
- **Gap:** Validação de email/telefone não está explícita no fluxo principal; os campos existem no setupData mas depende da UI de cada step.

### 2.3 Dependências de mock

| Componente | Mock? | Impacto |
|------------|-------|---------|
| OnboardingClient | ❌ Não | Usa Core RPC real |
| BootstrapPage | Pilot: `chefiapp_pilot_mock_restaurant` quando em modo pilot | Só em pilot/debug |
| RuntimeReader | Pilot: localStorage `chefiapp_pilot_mock_restaurant` | Só em pilot |
| paymentsService (admin) | MOCK_TRANSACTIONS para lista de pagamentos | Não afeta onboarding |
| moduleCatalog | Vários módulos com dataSource: "mock" | Define capacidades por módulo; não bloqueia onboarding |

**Conclusão:** O fluxo principal de onboarding (create_onboarding_context, steps, staff) **não usa mocks**. Os mocks estão em pilot/debug ou em módulos administrativos separados.

### 2.4 RPCs necessárias no Docker Core

- `create_onboarding_context` — migração `20260322_day3_onboarding_flow.sql`
- `get_onboarding_state`, `update_onboarding_step` — mesma migração

**⚠️ Bloqueador potencial:** A migração `20260322_day3_onboarding_flow.sql` **NÃO está** na lista de volumes do `docker-compose.core.yml`. Apenas `20260127_onboarding_persistence.sql` está incluída. O RPC `create_onboarding_context` pode não existir no Core actual. **Acção:** Adicionar `20260322_day3_onboarding_flow.sql` ao docker-compose ou incluí-la no schema consolidado.

---

## 3. FLUXO DE TAREFAS

### 3.1 Componentes

| Componente | Função |
|------------|--------|
| **WorkerTaskStream** | UI de tarefas do staff; usa useStaff (startTask, completeTask) |
| **CreateTaskModal** | Manager cria tarefa |
| **TaskWriter** | RPCs start_task, complete_task (Core) |
| **StaffContext** | completeTask com KDS bridge, action_logs, gamificação (XP) |
| **GamificationPanel** | Pontos/gamificação |

### 3.2 Integração

- WorkerTaskStream está conectado a useStaff; startTask e completeTask existem.
- StaffContext.completeTask: actualização optimista, KDS bridge para tarefas order, action_logs no Core, cálculo de XP.
- TaskWriter chama `start_task` e `complete_task` no Docker Core.
- **Gap potencial:** StaffContext usa `setTasks` local; TaskWriter é chamado? Verificar se completeTask invoca `resolveTask` do TaskWriter para persistir no Core. O StaffContext faz auditoria em action_logs; a transição de estado da tarefa no Core (gm_tasks) pode depender de outro fluxo (ex.: RPC complete_task).

### 3.3 WorkerTaskStream — sintaxe

Há um possível erro de sintaxe em WorkerTaskStream.tsx (linha 273–274): fechamento `);` e `};` — verificar se não há `;;` ou brace extra que cause falha de parse.

---

## 4. MARCA E SPECIMEN

### 4.1 Visibilidade CHEFIAPP

| Local | Estado |
|-------|--------|
| Login / AuthPage | Marca presente (AuthPage) |
| Dashboard | Marca presente (SubscriptionPage link para chefiapp.com) |
| AppStaff | Marca presente (WorkerTaskStream, StaffLayout) |
| URL em ambiente logado | Depende de config e header; não há componente dedicado "URL visível" |
| CTA público | LandingV2, PricingV2, FAQV2 — links e CTAs para chefiapp.com e contacto@chefiapp.com |

### 4.2 Config

- `config.ts`: BILLING_ALLOWED_ORIGINS inclui https://www.chefiapp.com e https://chefiapp.com.
- SubscriptionPage: link "chefiapp.com" em https://www.chefiapp.com.

---

## 5. CHECK DE VENDA

### 5.1 Hoje eu venderia isto a 1 restaurante?

**Não, enquanto chefiapp.com retornar 404.** Sem site público funcional, não há produto visível para vender.

### 5.2 O que impede?

| Bloqueador | Prioridade |
|------------|------------|
| chefiapp.com em 404 | 🔴 Crítico |
| Build Vercel a falhar (branch refactor) | 🔴 Crítico |
| Domínio/Production deployment por validar | 🔴 Crítico |
| Preview protegido por SSO (não afeta produção se domínio estiver correto) | 🟡 Verificar |

### 5.3 Lista de bloqueadores de venda

1. **chefiapp.com 404** — Nenhum visitante consegue aceder ao produto.
2. **Build em erro** — Sem deployment READY em production, o domínio pode estar a apontar para um deploy antigo removido.
3. **DNS/Vercel Domains** — Configuração de chefiapp.com no Vercel pode estar incorrecta ou desatualizada.
4. **Onboarding RPC em falta (possível)** — Migração `20260322_day3_onboarding_flow.sql` não está no docker-compose; criar restaurante pode falhar se o RPC não existir no Core.

### 5.4 O que já está pronto (após deploy funcionar)

- Onboarding (criar conta, restaurante, staff) sem mocks no fluxo principal.
- Fluxo de tarefas (criar, atribuir, concluir, gamificação) implementado.
- Marca CHEFIAPP visível em login, dashboard, AppStaff.
- CTAs e links para chefiapp.com nas páginas públicas.

### 5.5 Estimativa para ficar 100% vendável

| Fase | Esforço | Descrição |
|------|---------|-----------|
| **Corrigir deploy** | 0.5–1 dia | Ajustar domínio no Vercel, garantir branch main com build verde, promover deployment a Production |
| **Validar rotas públicas** | 0.5 dia | Confirmar /, /pricing, /login, /onboarding/start acessíveis sem auth |
| **Validações onboarding** | 0.5 dia | Reforçar validação de email/telefone se necessário |
| **Teste E2E 1 restaurante** | 0.5 dia | Criar conta → restaurante → staff → tarefa → concluir |
| **Total** | **2–3 dias** | Para estado vendável com 1 cliente piloto |

---

## 6. Próximos passos (prioridade)

1. **Hoje:** Vercel Dashboard — Domains, Production branch, promover um deployment READY.
2. **Hoje:** Garantir que `main` tem build verde e é a branch de Production; redeploy se necessário.
3. **Amanhã:** Confirmar chefiapp.com, www.chefiapp.com, /, /pricing, /login, /onboarding/start acessíveis.
4. **Em paralelo:** Testar onboarding completo (conta → restaurante → staff) com Core em execução.
5. **Dia 3:** Teste de venda simulado (visita → CTA → onboarding → primeira tarefa concluída).

---

## 7. Referências

- Vercel project: prj_hQ4hyfAM1KRC3u4FM9ZAZZ4QQWYM (chefiapp-pos-core)
- Team: team_W9lnALlgkzOd3WOMVQHvUCFV
- docs/ops/VERCEL_ENV.md — variáveis de ambiente
- docs/audit/SAAS_COMMERCIAL_READINESS_DIAGNOSTIC_2026-02-26.md — diagnóstico backend
