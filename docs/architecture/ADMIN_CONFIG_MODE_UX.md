# Modo de configuração — entrada e saída

**Objetivo:** Padrão claro para o utilizador não ficar “preso” em modo configuração. Cada fluxo tem entrada óbvia e saída para operação.

---

## 1. Princípio

- O Admin não é “sempre configuração”. O utilizador usa o **menu principal** para operação diária (Finanças, Reservas, Clientes, Catálogo, Relatórios) e entra em **Configuração** para tarefas esporádicas.
- Ao entrar em Config, a sidebar mostra secções de configuração e o link **“← Voltar ao menu”** para regressar ao menu principal (Início + grupos).
- Após concluir uma tarefa de configuração, o utilizador deve conseguir voltar à operação em um clique (Voltar ao menu ou navegar para Início).

---

## 2. Entradas para modo configuração

| Entrada | Destino | Quando usar |
|---------|---------|-------------|
| Menu principal → Sistema → Configuração | /admin/config (default: general) | Ajustes gerais, identidade, plano, equipa, etc. |
| Banner contextual (SidebarContextBanner) | CTA “Continuar configuração” ou “Escolher um plano” | Setup em curso ou trial; leva a passo concreto (ex.: /admin/config/subscription) |
| Onboarding / ManagementAdvisor | Passos guiados que podem abrir /admin/config/* | Primeira vez ou checklist incompleto |
| Deep link ou notificação | Ex.: /admin/config/printers | Corrigir falha ou aviso (ex.: “Configurar impressora”) |

Não há “modo configuração” global ligado/desligado: a vista Config é apenas uma árvore de páginas acessível pelo menu. O utilizador está “em configuração” quando a rota é `/admin/config/*` e a sidebar mostra CONFIG_SECTIONS.

---

## 3. Saída (regresso à operação)

| Saída | Implementação |
|-------|----------------|
| **Voltar ao menu** | Link “← Voltar ao menu” no topo da sidebar (em AdminSidebar quando `isConfig`). Aponta para `/admin/home`. |
| **Início** | No menu principal, primeiro item “Início” → `/admin/home`. |
| **Navegação direta** | Qualquer item do menu principal (Finanças, Reservas, …) leva a uma rota fora de /admin/config e a sidebar volta a mostrar NAV_GROUPS. |

Não é obrigatório “Guardar e sair” em cada página: o utilizador pode simplesmente clicar “Voltar ao menu” ou noutro item do menu. As páginas de config devem persistir alterações ao guardar (submit), sem forçar um fluxo de “wizard” de saída.

---

## 4. Fluxos típicos

| Fluxo | Entrada | Saída sugerida |
|-------|---------|----------------|
| Onboarding inicial | ManagementAdvisor / checklist | “Publicar Agora” ou “Continuar” → dashboard; ou “Voltar ao menu” após completar passo. |
| Ajuste de plano | Banner trial ou Menu → Config → Plano → Assinatura | Após checkout Stripe, redireção para /billing/success; de lá “Ir ao Comando Central” → operação. |
| Ativação de módulo | Menu → Sistema → Módulos | Após ativar, “Abrir” o módulo (ex.: TPV) ou “Voltar ao menu”. |
| Configuração de integração | Menu → Config → Canais e integrações → Integrações (ou Delivery) | “Voltar às integrações” (no hub) ou “Voltar ao menu”. |

Em todos os casos, o link **“← Voltar ao menu”** (para `/admin/home`) está visível enquanto o utilizador está em `/admin/config/*`, garantindo uma saída única e previsível.

---

## 5. Verificação

- [ ] Em `/admin/config/*` o link “Voltar ao menu” está sempre visível e leva a `/admin/home`.
- [ ] Em `/admin/home` (e restantes rotas fora de config) a sidebar mostra o menu principal, não a árvore de config.
- [ ] Nenhuma página de config exige “Concluir wizard” para sair; o utilizador pode sair a qualquer momento.
- [ ] Banners contextuais (setup, trial) têm CTA que levam a um destino concreto (ex.: subscription), não a um estado “modo config” indefinido.

Ref. implementação: [AdminSidebar.tsx](../../merchant-portal/src/features/admin/dashboard/components/AdminSidebar.tsx) (link “Voltar ao menu”, `isConfig`).
