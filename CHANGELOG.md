# Changelog - Sistema Nervoso Operacional

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [1.2.0] - 2026-01-24

### 🔧 Polimento Final

#### Correções
- **Banner de Pressão:** Adicionado debounce de 1s para evitar piscadas durante transições
- **Cores de Urgência:** KDSTicket agora tem timer self-updating com intervalo dinâmico
- **Animações:** Banner de pressão com fade in/out suave (300ms)

#### Melhorias
- `useKitchenPressure`: Debounce inteligente (imediato para aumento, 1s para redução)
- `KDSTicket`: AppState awareness para recálculo ao voltar do background
- Intervalos dinâmicos baseados em urgência (5s/15s/30s)

### 📁 Arquivos Modificados
- `mobile-app/hooks/useKitchenPressure.ts`
- `mobile-app/components/KitchenPressureIndicator.tsx`
- `mobile-app/components/KDSTicket.tsx`

---

## [1.1.0] - 2026-01-24

### 🔧 Stability Fixes

#### Correções
- **Timer Background:** Timer agora recalcula imediatamente ao voltar do background
- **Waitlist Persistence:** Auto-save robusto com debounce e save on background

#### Melhorias
- `OrderTimer`: AppState awareness para recálculo imediato
- `OrderTimer`: Intervalo dinâmico (5s/15s/30s) baseado em urgência
- `WaitlistBoard`: Save imediato em ações críticas (add, seat)
- `WaitlistBoard`: Save com debounce 500ms em ações menores (cancel)
- `WaitlistBoard`: Save automático ao ir para background
- `WaitlistBoard`: Save no unmount do componente

### 📁 Arquivos Modificados
- `mobile-app/components/OrderTimer.tsx`
- `mobile-app/components/WaitlistBoard.tsx`

---

## [1.0.1] - 2026-01-24

### 🚀 Observability & Growth

#### Observability (Sentry + Métricas)
- **Sentry Integration:** Error tracking em merchant-portal, customer-portal, mobile-app
- **ErrorBoundary:** Componentes de fallback com captura automática de erros
- **Logger Centralizado:** Service de logging com integração Sentry
- **Dashboard Métricas:** Widget de métricas operacionais em tempo real
- **useRealtimeMetrics:** Hook para pedidos/hora, ticket médio, receita

#### Growth & Marketing (SEO + Pixel)
- **SEO Dinâmico:** Meta tags (title, description, Open Graph, Twitter Cards)
- **Schema.org:** JSON-LD para Restaurant, Menu, BreadcrumbList
- **Pixel Tracking:** Meta Pixel + Google Analytics integrados
- **Eventos Rastreados:** pageView, viewItem, addToCart, initiateCheckout, purchase

### 📁 Arquivos Criados
- `merchant-portal/src/hooks/useRealtimeMetrics.ts`
- `merchant-portal/src/components/Dashboard/OperationalMetricsWidget.tsx`
- `customer-portal/src/lib/logger.ts`
- `customer-portal/src/lib/seo.tsx`
- `customer-portal/src/lib/schema.ts`
- `customer-portal/src/lib/pixel.ts`
- `customer-portal/src/components/ErrorBoundary.tsx`
- `customer-portal/src/components/RestaurantSEO.tsx`
- `docs/ops/OBSERVABILITY_SETUP.md`
- `docs/ops/GROWTH_MARKETING_SETUP.md`

### 📁 Arquivos Modificados
- `merchant-portal/src/core/logger/Logger.ts`
- `merchant-portal/src/ui/design-system/ErrorBoundary.tsx`
- `merchant-portal/vite.config.ts`
- `customer-portal/src/main.tsx`
- `customer-portal/src/App.tsx`
- `customer-portal/src/context/CartContext.tsx`
- `customer-portal/vite.config.ts`
- `customer-portal/index.html`

---

## [1.0.0] - 2026-01-24

### 🎉 Lançamento: Sistema Nervoso Operacional

Transformação completa do ChefIApp de registrador de vendas para Sistema Nervoso Operacional.

---

## [1.0.0] - Semana 1: Fast Pay

### ✨ Adicionado
- **FastPayButton**: Componente de pagamento rápido em 2 toques
- Auto-seleção de método de pagamento (cash como padrão)
- Confirmação única sem modais intermediários
- Fechamento automático de mesa após pagamento
- Integração no mapa de mesas e tela de pedidos

### 🎯 Objetivo
Pagamento em < 5 segundos (36x mais rápido que antes)

### 📁 Arquivos
- `mobile-app/components/FastPayButton.tsx` (novo)
- `mobile-app/app/(tabs)/tables.tsx` (modificado)
- `mobile-app/app/(tabs)/orders.tsx` (modificado)

---

## [1.0.0] - Semana 2: Mapa Vivo

### ✨ Adicionado
- **Timer por mesa**: Atualizado a cada segundo
- **Cores de urgência**:
  - 🟢 Verde: < 15 minutos
  - 🟡 Amarelo: 15-30 minutos
  - 🔴 Vermelho: > 30 minutos
- **Ícone "quer pagar"** (💰): Aparece quando pedido entregue
- **Ícone "esperando bebida"** (🍷): Aparece para pedidos de bebida
- Timer baseado no último evento (não apenas criação)

### 🎯 Objetivo
Mapa deixa de ser visual e vira sensor operacional

### 📁 Arquivos
- `mobile-app/app/(tabs)/tables.tsx` (modificado)

---

## [1.0.0] - Semana 3: KDS Como Rei

### ✨ Adicionado
- **useKitchenPressure**: Hook para detectar saturação da cozinha
- **KitchenPressureIndicator**: Componente visual de pressão
- **Menu inteligente**: Esconde pratos lentos quando cozinha saturada
- **Priorização automática**: Bebidas e itens rápidos durante picos
- Banner de pressão no menu (amarelo/vermelho)

### 🎯 Objetivo
Cozinha influencia decisões do salão em tempo real

### 📁 Arquivos
- `mobile-app/hooks/useKitchenPressure.ts` (novo)
- `mobile-app/components/KitchenPressureIndicator.tsx` (novo)
- `mobile-app/app/(tabs)/index.tsx` (modificado)

---

## [1.0.0] - Semana 4: Reservas LITE

### ✨ Adicionado
- **WaitlistBoard**: Componente de lista de espera digital
- Adicionar entrada por nome + hora
- Conversão automática: reserva → mesa
- Persistência local (AsyncStorage)
- Ordenação por hora

### 🎯 Objetivo
Lista de espera simples sem overengineering

### 📁 Arquivos
- `mobile-app/components/WaitlistBoard.tsx` (novo)
- `mobile-app/services/persistence.ts` (modificado)
- `mobile-app/app/(tabs)/tables.tsx` (modificado)

---

## [1.0.0] - Otimizações

### ⚡ Performance
- Timer otimizado: só atualiza quando mesa ocupada
- `useMemo` no filtro do menu (evita re-renders)
- Componente `KitchenPressureIndicator` isolado

### 💾 Persistência
- Lista de espera salva automaticamente
- Carrega ao abrir componente
- Sobrevive a reinicializações

---

## [1.0.0] - Documentação

### 📚 Criado
- `docs/EXECUCAO_30_DIAS.md` - Documentação técnica completa
- `docs/VALIDACAO_RAPIDA.md` - Checklist de validação (17 testes)
- `docs/GUIA_RAPIDO_GARCOM.md` - Guia do garçom (10 minutos)
- `docs/MANIFESTO_COMERCIAL.md` - Proposta de valor
- `docs/PLANO_ROLLOUT.md` - Estratégia de lançamento
- `docs/RESUMO_EXECUTIVO.md` - Visão geral executiva
- `docs/GITHUB_ISSUES.md` - Issues estruturadas
- `docs/README.md` - Índice geral
- `CHANGELOG.md` - Este arquivo

---

## [1.0.0] - Métricas Esperadas

### Operacionais
- ⏱️ Tempo de pagamento: 2-3min → < 5s (**36x mais rápido**)
- 🗺️ Visibilidade: 0% → 100% (estado em tempo real)
- 🍽️ Eficiência cozinha: +25% durante picos
- 📋 Conversão reservas: +15%

### Financeiros
- 💰 Mais mesas/noite: +2-3 mesas
- 🍷 Mais vendas bebidas: +25% durante picos
- ⚡ Menos erros: -30%
- 📈 Receita adicional: €500-1000/mês por restaurante

---

## 🔮 Próximas Versões

### [1.1.0] - Planejado
- Auto-detecção de método de pagamento (histórico)
- Persistência waitlist em Supabase
- Dashboard de métricas operacionais

### [1.2.0] - Planejado
- Machine Learning para prever saturação
- Sugestões automáticas de pratos
- Otimização de turnos

### [2.0.0] - Futuro
- Integração com delivery (sem complexidade)
- Analytics preditivo
- Automação completa

---

## 📝 Formato

Este changelog segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

**Versão Atual:** 1.0.0  
**Data de Lançamento:** 2026-01-24  
**Status:** ✅ Pronto para Validação
