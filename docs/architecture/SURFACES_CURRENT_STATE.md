# Estado Atual das Superfícies - ChefIApp

> **Mapeamento: O que existe hoje vs o que deveria existir**

**Versão:** 1.0 | **Data:** 2026-01-30 | **Status:** Análise de Estado

---

## Visão Geral

Este documento mapeia o estado atual de implementação de cada superfície, identificando:
- ✅ O que já está implementado e separado corretamente
- ⚠️ O que existe mas precisa de melhorias
- ❌ O que está faltando
- 🔄 O que precisa ser refatorado

---

## 1. Painel de Comando (Backoffice)

### Estado Atual: ✅ Parcialmente Implementado

**Localização:** `merchant-portal/src/pages/`

**Rotas Implementadas:**
- ✅ `/app/dashboard` - `DashboardZero.tsx`
- ✅ `/app/menu` - `MenuManager.tsx`
- ✅ `/app/settings/*` - Várias páginas de configuração
- ✅ `/app/team` - `StaffPage.tsx`
- ✅ `/app/web` - `RestaurantWebPreviewPage.tsx` (web presence)
- ✅ `/app/reports` - `FinanceDashboard.tsx`, `DailyClosing.tsx`
- ✅ `/app/analytics` - `Analytics.tsx`
- ✅ `/app/select-tenant` - `SelectTenantPage.tsx`

**Componentes Principais:**
- `merchant-portal/src/pages/Dashboard/` - Dashboard principal
- `merchant-portal/src/pages/Menu/` - Gerenciamento de cardápio
- `merchant-portal/src/pages/Settings/` - Configurações diversas
- `merchant-portal/src/pages/Reports/` - Relatórios
- `merchant-portal/src/pages/Analytics/` - Analytics

**✅ O que está correto:**
- Separação clara de rotas
- Uso de `AdminLayout` e `AdminSidebar`
- Integração com `TenantContext`
- Sistema de permissões funcionando

**⚠️ O que precisa melhorar:**
- Algumas páginas ainda misturam operação com gestão
- Falta padronização em alguns fluxos
- Algumas configurações poderiam estar mais organizadas

**📋 Próximos Passos:**
- Consolidar todas as configurações em `/app/settings/*`
- Separar completamente operação de gestão
- Melhorar navegação e organização

---

## 2. TPV (Caixa / Point of Sale)

### Estado Atual: ⚠️ Implementado como Web App

**Localização:** `merchant-portal/src/pages/TPV/`

**Rotas Implementadas:**
- ✅ `/app/tpv` - `TPV.tsx` (interface principal)

**Componentes Principais:**
- `merchant-portal/src/pages/TPV/TPV.tsx` - Interface principal
- `merchant-portal/src/pages/TPV/components/` - Componentes do TPV
- `merchant-portal/src/pages/TPV/context/` - Contextos (Order, Table, Offline)
- `merchant-portal/src/pages/TPV/hooks/` - Hooks específicos

**✅ O que está correto:**
- Interface focada em vendas
- Sistema de pedidos funcionando
- Integração com impressão fiscal
- Suporte offline (parcial)
- Performance otimizada

**⚠️ O que precisa melhorar:**
- **CRÍTICO:** Ainda roda como web app, não como app instalado
- Falta acesso direto a hardware (impressoras, gaveta)
- Offline-first precisa ser mais robusto
- Algumas configurações ainda estão no TPV (deveriam estar no backoffice)

**📋 Próximos Passos:**
- Migrar para Electron ou Tauri (app instalado)
- Implementar drivers nativos para hardware
- Melhorar sistema offline
- Remover configurações do TPV

**🔮 Estado Ideal:**
- App instalado (Windows/macOS)
- Acesso direto a impressoras térmicas
- Controle de gaveta de dinheiro
- Offline-first completo
- Zero dependência de browser

---

## 3. KDS (Kitchen Display System)

### Estado Atual: ✅ Bem Implementado

**Localização:** `merchant-portal/src/pages/TPV/KDS/`

**Rotas Implementadas:**
- ✅ `/app/kds` - `KitchenDisplay.tsx` (visão gerencial)
- ✅ `/kds/:restaurantId` - `KDSStandalone.tsx` (standalone para TV)

**Componentes Principais:**
- `KDSStandalone.tsx` - Versão standalone (sem navegação)
- `KitchenDisplay.tsx` - Versão dentro do backoffice
- `KDSLayout.tsx` - Layout otimizado para TV
- `OrderTimer.tsx` - Timer de pedidos
- `KDSAlerts.ts` - Sistema de alertas

**✅ O que está correto:**
- Standalone funciona sem login complexo
- Interface otimizada para telas grandes
- Auto-refresh implementado
- Alertas visuais e sonoros
- Separação clara de responsabilidades

**⚠️ O que precisa melhorar:**
- Pode ter mais otimizações de performance
- Alguns recursos visuais podem ser melhorados

**📋 Próximos Passos:**
- Otimizar ainda mais para telas muito grandes
- Melhorar sistema de alertas
- Adicionar mais personalização visual

**🔮 Estado Ideal:**
- ✅ Já está muito próximo do ideal
- Pode melhorar performance e UX

---

## 4. AppStaff (Funcionários Mobile)

### Estado Atual: ✅ Implementado

**Localização:** 
- `merchant-portal/src/pages/AppStaff/`
- `appstaff-core/`

**Rotas Implementadas:**
- ✅ `/app/staff` - Interface gerencial
- ✅ `/join` - `ScreenInviteCode.tsx` (entrada via código)

**Componentes Principais:**
- `AppStaff.tsx` - Interface principal
- `AppStaffLanding.tsx` - Tela de login
- `context/StaffContext.tsx` - Contexto de staff
- `appstaff-core/` - Lógica compartilhada

**✅ O que está correto:**
- Sistema de código de acesso (CHEF-XXXX-XX)
- Check-in/check-out funcionando
- Interface mobile-friendly
- Integração com `active_invites`

**⚠️ O que precisa melhorar:**
- Pode ser mais otimizado para mobile
- Algumas funcionalidades ainda podem ser expandidas
- PWA poderia ser mais robusto

**📋 Próximos Passos:**
- Melhorar PWA (Progressive Web App)
- Otimizar para diferentes tamanhos de tela
- Adicionar mais funcionalidades operacionais

**🔮 Estado Ideal:**
- App nativo (Android/iOS) ou PWA robusto
- Funciona completamente offline
- Sincronização automática
- Notificações push

---

## 5. Cliente Web Pública

### Estado Atual: ⚠️ Implementado, mas precisa formalização

**Localização:** 
- `merchant-portal/src/pages/Public/`
- `merchant-portal/src/pages/Web/`

**Rotas Implementadas:**
- ✅ `/public/*` - `PublicPages.tsx`
- ✅ `/public/{slug}` - Página principal do restaurante
- ✅ `/public/{slug}/menu` - Cardápio público

**Componentes Principais:**
- `PublicPages.tsx` - Router principal
- `PublicOrderingPage.tsx` - Página de pedidos
- `views/PublicHome.tsx` - Home pública
- `WebPresenceWizard.tsx` - Wizard de criação (3 opções)
- `RestaurantWebPreviewPage.tsx` - Preview e gestão

**✅ O que está correto:**
- Páginas públicas funcionando
- Menu público acessível
- Isolamento de dados (não mostra dados internos)
- Sistema de web presence iniciado

**⚠️ O que precisa melhorar:**
- **CRÍTICO:** As 3 opções (Simples, Menu/QR, Site Completo) precisam ser formalizadas
- Falta implementação completa das 3 opções
- QR de mesa precisa ser mais explícito
- Falta templates personalizáveis

**📋 Próximos Passos:**
- Implementar completamente as 3 opções de web presence
- Criar templates para cada tipo
- Melhorar sistema de QR de mesa
- Adicionar mais personalização

**🔮 Estado Ideal:**
- 3 opções completamente funcionais
- Templates ricos e personalizáveis
- Editor visual (futuro)
- SEO otimizado
- Performance máxima

---

## 6. QR de Mesa

### Estado Atual: ⚠️ Parcialmente Implementado

**Localização:** Parte de `merchant-portal/src/pages/Public/`

**Rotas Implementadas:**
- ⚠️ `/public/{slug}/mesa/{n}` - (parcial, precisa ser mais explícito)

**✅ O que está correto:**
- Conceito existe
- Integração com sistema de mesas

**⚠️ O que precisa melhorar:**
- **CRÍTICO:** Precisa ser mais explícito e documentado
- Falta interface dedicada
- Falta geração automática de QR codes
- Falta integração clara com sistema de mesas

**📋 Próximos Passos:**
- Criar rota dedicada `/mesa/{n}` ou `/public/{slug}/mesa/{n}`
- Interface ultra-simples para mesa
- Sistema de geração de QR codes
- Integração clara com `TableContext`

**🔮 Estado Ideal:**
- Rota dedicada e clara
- Interface minimalista
- QR code único por mesa
- Contexto automático (sabe qual mesa)
- Funcionalidades futuras: pedir, chamar garçom, pedir conta

---

## 7. Delivery (Integrações)

### Estado Atual: ✅ Implementado

**Localização:**
- `server/integrations/`
- `merchant-portal/src/integrations/`

**Componentes Principais:**
- `server/integrations/glovo-adapter.ts` - Adaptador Glovo
- `server/integrations/ubereats-auth.ts` - Integração UberEats
- `merchant-portal/src/integrations/adapters/glovo/GlovoAdapter.ts`
- `merchant-portal/src/integrations/core/OrderIngestionPipeline.ts`

**✅ O que está correto:**
- Arquitetura de adaptadores
- Normalização de dados
- Injeção no sistema
- Não controla o sistema (só injeta)

**⚠️ O que precisa melhorar:**
- Pode ter mais integrações (iFood, etc)
- Documentação pode ser melhorada
- Testes podem ser expandidos

**📋 Próximos Passos:**
- Adicionar mais integrações
- Melhorar documentação
- Expandir testes
- Melhorar tratamento de erros

**🔮 Estado Ideal:**
- ✅ Já está muito próximo do ideal
- Pode adicionar mais integrações

---

## 8. Módulos Futuros

### Estado Atual: ❌ Não Implementados

**Módulos Previstos:**
- ❌ Loyalty / Pontos
- ❌ CRM
- ❌ Marketing
- ❌ Reservas
- ❌ Analytics Avançado
- ❌ Multi-local
- ❌ Franquias

**📋 Próximos Passos:**
- Priorizar quais módulos implementar primeiro
- Definir arquitetura para cada módulo
- Criar planos de implementação

---

## Estrutura de Diretórios

### Estado Atual

```
chefiapp-pos-core/
├── core-engine/              # Core compartilhado
├── event-log/                # Event sourcing
├── merchant-portal/          # Backoffice + TPV + Public (misturado)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard/    # Backoffice
│       │   ├── TPV/          # TPV
│       │   ├── Public/       # Cliente Web
│       │   ├── AppStaff/     # AppStaff
│       │   └── Web/          # Web Presence
│       └── core/             # Core compartilhado
├── appstaff-core/            # Lógica AppStaff
├── server/
│   └── integrations/         # Delivery
└── (customer-portal removido do workspace em F5.1 — ver C42)
```

### Estado Ideal

```
chefiapp-pos-core/
├── core/                     # Core compartilhado
│   ├── kernel/
│   ├── tenant/
│   ├── auth/
│   └── rules/
├── apps/
│   ├── backoffice-web/       # Painel de Comando
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Dashboard/
│   │       │   ├── Menu/
│   │       │   ├── Settings/
│   │       │   └── Reports/
│   │       └── core/         # (usa core compartilhado)
│   ├── pos-desktop/          # TPV (Electron/Tauri)
│   │   └── src/
│   │       ├── pages/
│   │       │   └── TPV/
│   │       └── native/       # Drivers nativos
│   ├── kds/                  # Kitchen Display
│   │   └── src/
│   │       └── pages/
│   │           └── KDS/
│   ├── staff-mobile/         # AppStaff
│   │   └── src/
│   │       └── pages/
│   │           └── AppStaff/
│   └── public-web/           # Cliente Web
│       └── src/
│           └── pages/
│               └── Public/
└── integrations/
    └── delivery/             # Adapters
        ├── glovo/
        ├── ubereats/
        └── ifood/
```

**Nota:** A estrutura ideal requer refatoração significativa. Por enquanto, a estrutura atual funciona, mas seria melhor separar completamente.

---

## Gaps Identificados

### Críticos (P0)

1. **TPV ainda é web app** - Deveria ser app instalado
2. **Cliente Web precisa das 3 opções formalizadas** - Sistema iniciado mas não completo
3. **QR de mesa precisa ser mais explícito** - Existe mas não está claro

### Importantes (P1)

1. **Backoffice misturado com operação** - Algumas páginas ainda misturam
2. **Estrutura de diretórios** - Tudo em `merchant-portal/`, ideal seria separar
3. **Documentação** - Pode ser melhorada

### Desejáveis (P2)

1. **AppStaff como app nativo** - Atualmente PWA
2. **Mais integrações de delivery** - Só Glovo e UberEats
3. **Módulos futuros** - Loyalty, CRM, etc

---

## Plano de Migração (Futuro)

### Fase 1: Formalização
- ✅ Documentar arquitetura (este documento)
- ⏳ Completar 3 opções de web presence
- ⏳ Tornar QR de mesa mais explícito

### Fase 2: Separação
- ⏳ Separar completamente backoffice de operação
- ⏳ Melhorar estrutura de diretórios
- ⏳ Documentar melhor cada superfície

### Fase 3: Otimização
- ⏳ Migrar TPV para app instalado
- ⏳ Otimizar AppStaff para mobile
- ⏳ Melhorar performance geral

### Fase 4: Expansão
- ⏳ Adicionar módulos futuros
- ⏳ Mais integrações
- ⏳ Novas funcionalidades

---

## Métricas de Sucesso

### Separação de Responsabilidades
- [ ] Zero configurações no TPV
- [ ] Zero dados internos no Cliente Web
- [ ] Zero operação no Backoffice
- [ ] Cada superfície com propósito único

### Performance
- [ ] TPV: < 100ms resposta
- [ ] KDS: Auto-refresh < 1s
- [ ] Cliente Web: First Contentful Paint < 1s
- [ ] AppStaff: Funciona offline completo

### Segurança
- [ ] RLS em todas as queries
- [ ] Cliente Web: Zero acesso a dados internos
- [ ] Delivery: Zero controle do sistema
- [ ] Cada superfície: Permissões mínimas

---

## Referências

- [SURFACES_ARCHITECTURE.md](./SURFACES_ARCHITECTURE.md) - Arquitetura completa
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Visão geral
- [ROUTE_MANIFEST.md](../canon/ROUTE_MANIFEST.md) - Rotas do sistema

---

**Última atualização:** 2026-01-30  
**Mantido por:** Equipe de Arquitetura ChefIApp
