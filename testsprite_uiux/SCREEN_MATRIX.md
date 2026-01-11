# Matriz de Telas - ChefIApp POS Core

**Data:** 2025-12-27  
**Versão:** 1.0.0  
**Status:** Auditoria Pré-Lançamento

---

## 📋 Legenda

- **Estados:** `default` | `loading` | `empty` | `error` | `success` | `offline`
- **Severidade:** `S0` Bloqueador | `S1` Crítico | `S2` Médio | `S3` Baixo
- **Viewports:** `mobile-small` (320px) | `mobile` (375px) | `tablet` (768px) | `desktop` (1024px)

---

## 🎬 ONBOARDING / CINEMATIC FLOW

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Scene 1: Hook** | `/start/cinematic/1` | default, loading | Iniciar onboarding, Pular | S1 |
| **Scene 2: Identity** | `/start/cinematic/2` | default, loading, error | Preencher nome, Continuar | S1 |
| **Scene 2: Logo** | `/start/cinematic/logo` | default, loading, error | Upload logo, Continuar | S2 |
| **Scene 3: Type** | `/start/cinematic/type` | default, loading | Selecionar tipo restaurante, Continuar | S1 |
| **Scene 3: Team** | `/start/cinematic/team` | default, loading | Definir equipe, Continuar | S2 |
| **Scene 3: Tasks Intro** | `/start/cinematic/tasks-intro` | default | Entender sistema de tarefas, Continuar | S2 |
| **Scene 3: Staff Dist** | `/start/cinematic/staff-dist` | default, loading | Distribuir funções, Continuar | S2 |
| **Scene 3: Skeleton** | `/start/cinematic/3` | default, loading | Preview estrutura, Continuar | S2 |
| **Scene 4: Menu Builder** | `/start/cinematic/4` | default, loading, empty, error | Adicionar itens, Salvar, Continuar | S1 |
| **Scene 6: Payments** | `/start/cinematic/6` | default, loading, error | Configurar Stripe, Continuar | S1 |
| **Scene 6: Summary** | `/start/cinematic/summary` | default, loading | Revisar, Publicar | S1 |

---

## 🔐 AUTENTICAÇÃO / SESSÃO

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Creating** | `/app/creating` | default, loading, error, offline | Criar restaurante, Demo fallback | S1 |
| **Auth** | `/app/auth` | default, loading, error, offline | Login Google/QR, Magic link | S1 |
| **Bootstrap** | `/app/bootstrap` | default, loading, error | Restaurar sessão, Redirecionar | S1 |
| **Preview** | `/app/preview` | default, loading | Visualizar loja pública | S2 |

---

## ⚙️ SETUP WIZARD (Edição Avançada)

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Setup Layout** | `/app/setup` | default | Navegação entre steps | S1 |
| **Identity Step** | `/app/setup/identity` | default, loading, error | Editar identidade, Salvar | S1 |
| **Menu Step** | `/app/setup/menu` | default, loading, empty, error | CRUD menu, Salvar | S1 |
| **Payments Step** | `/app/setup/payments` | default, loading, error | Configurar Stripe, Salvar | S1 |
| **Design Step** | `/app/setup/design` | default, loading | Ajustar tema, Salvar | S2 |
| **Staff Step** | `/app/setup/staff` | default, loading, empty | Gerenciar equipe, Salvar | S2 |
| **Publish Step** | `/app/setup/publish` | default, loading, error | Publicar, Atualizar status | S1 |

---

## 🏪 OPERACIONAL (TPV / POS)

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **TPV Ready** | `/app/tpv-ready` | default, loading, error | Verificar pré-requisitos, Entrar TPV | S1 |
| **TPV (POS)** | `/app/tpv` | default, loading, empty, offline | Criar pedido, Adicionar itens, Fechar mesa | S0 |
| **KDS (Kitchen)** | `/app/kds` | default, loading, empty | Ver pedidos, Marcar pronto, Alertas | S0 |

---

## 👥 APP STAFF (Core 4: Human OS)

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Staff Landing** | `/app/staff` | default, loading | Selecionar perfil (Worker/Manager/Owner) | S1 |
| **Worker: Task Stream** | `/app/staff` (Worker) | default, loading, empty | Ver tarefas, Aceitar, Concluir | S0 |
| **Worker: Task Focus** | `/app/staff` (Focus) | default, loading | Executar tarefa, Timer, Concluir | S0 |
| **Worker: Check-in** | `/app/staff` (Check-in) | default, loading, error | Check-in geo/QR, Confirmar | S1 |
| **Manager: Dashboard** | `/app/staff` (Manager) | default, loading, empty | Ver equipe, Tarefas, Métricas | S1 |
| **Manager: Calendar** | `/app/staff` (Calendar) | default, loading, empty | Ver obrigações, Agendar | S2 |
| **Owner: Dashboard** | `/app/staff` (Owner) | default, loading | Dashboard executivo, Métricas | S1 |
| **Mini POS** | `/app/staff` (Mini POS) | default, loading | Criar pedido rápido | S2 |

---

## 📦 INVENTORY (Core 5: Metabolism)

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Inventory Main** | `/app/inventory` | default, loading, empty | Ver estoque, Hunger signals | S1 |
| **Receiving** | `/app/inventory` (Receiving) | default, loading, error | Receber mercadoria, Reconciliar | S1 |
| **Purchasing** | `/app/purchasing` | default, loading, empty | Criar PO, Aprovar, Receber | S1 |

---

## 🗑️ LEAK DASHBOARD

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Leak Map** | `/app/leaks` | default, loading, empty | Ver desperdícios, Categorizar | S2 |

---

## 📊 AUDIT / METABOLIC

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Metabolic Audit** | `/app/audit` | default, loading, empty | Ver auditoria metabólica, Exportar | S2 |

---

## 🌐 PÚBLICO (Customer Loop)

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Public Store** | `/menu/:slug` | default, loading, error, offline | Ver menu, Adicionar ao carrinho, Checkout | S1 |

---

## 📄 LEGACY / START FLOW

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Slug Page** | `/start/slug` | default, loading, error | Definir slug, Validar | S3 |
| **Publish Page** | `/start/publish` | default, loading, error | Publicar restaurante | S2 |
| **Success Page** | `/start/success` | default | Ver sucesso, Continuar | S3 |

---

## 📜 ESTÁTICAS

| Tela | Rota | Estados | Ações Principais | Prioridade |
|------|------|---------|------------------|------------|
| **Terms** | `/terms` | default | Ler termos | S3 |
| **Privacy** | `/privacy` | default | Ler política | S3 |

---

## 🔄 REDIRECTS / CATCH-ALL

| Rota | Target | Tipo |
|------|--------|------|
| `/` | `/start/cinematic` | Redirect |
| `/start` | `/app/start` | Redirect |
| `/app/start` | `/app` | Redirect |
| `/app` | `/start/cinematic` | Redirect |
| `*` | `/app/start` | Catch-all |

---

## 📊 ESTATÍSTICAS

- **Total de Telas:** 40+
- **Telas S0 (Bloqueadoras):** 3 (TPV, KDS, Worker Task Stream)
- **Telas S1 (Críticas):** 15
- **Telas S2 (Médias):** 12
- **Telas S3 (Baixas):** 10

---

## 🎯 FOCO DA AUDITORIA

### Prioridade Alta (Testar Primeiro)
1. TPV (`/app/tpv`) - Core operacional
2. KDS (`/app/kds`) - Core operacional
3. AppStaff Worker (`/app/staff` Worker) - Core 4
4. Onboarding Cinematic (todos os steps) - Primeira impressão
5. Setup Wizard (todos os steps) - Configuração

### Estados Críticos a Testar
- **Empty states:** TPV sem pedidos, Staff sem tarefas, Inventory vazio
- **Error states:** Falha de API, Offline, Permissões negadas
- **Loading states:** Skeleton vs Spinner, Tempo de resposta
- **Success states:** Feedback visual, Próximos passos

### Fluxos Ponta-a-Ponta
1. **Onboarding completo:** Cinematic 1 → Summary → Publicar
2. **Operação diária:** Check-in → Task Stream → Concluir → XP
3. **Gestão:** Owner Dashboard → Ver métricas → Ajustar
4. **TPV completo:** Criar pedido → Adicionar itens → Lock → Close

---

**Próximo passo:** Executar suíte de testes automatizados com Playwright.

