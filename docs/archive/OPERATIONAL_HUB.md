# ⚡ OperationalHub — Gestão Completa de Operações

**Versão**: 1.0 MVP  
**Status**: Em Implementação  
**Inspiração**: [Last.app](https://www.last.app/producto/software-tpv)

---

## 🎯 Visão Geral

O OperationalHub é um módulo completo de gestão operacional de restaurantes, inspirado nas funcionalidades do Last.app, mas com identidade própria e integrado ao ecossistema ChefIApp.

### Funcionalidades Principais

1. **Fast Mode (Venda Ultrarrápida)**
   - Modo de venda rápida para Fast Service
   - Produtos rápidos (top sellers)
   - Checkout acelerado
   - Auto-confirmação opcional

2. **Gestão de Stock**
   - Controle de estoque por produto
   - Alertas de estoque baixo
   - Dedução automática ao vender
   - Movimentações de estoque

3. **Fichaje (Controle de Funcionários)**
   - Clock in/out
   - Gestão de turnos
   - Controle de pausas
   - Cálculo automático de horas

4. **Integrador Delivery**
   - Centralização de pedidos (Glovo, Uber Eats, Just Eat)
   - Webhooks e APIs
   - Auto-aceitação opcional

5. **Personalização de Tickets**
   - Templates customizados
   - Logo e dados de contato
   - QR codes opcionais
   - HTML personalizado

6. **Analytics Avançados**
   - Snapshots diários
   - Top produtos
   - Horários de pico
   - Métodos de pagamento
   - Ticket médio

---

## 🏗️ Arquitetura

### Database Schema

- `operational_hub_fast_mode`: Configuração Fast Mode
- `operational_hub_stock_items`: Itens de estoque
- `operational_hub_stock_movements`: Movimentações
- `operational_hub_time_tracking`: Controle de turnos
- `operational_hub_delivery_channels`: Canais de delivery
- `operational_hub_ticket_templates`: Templates de tickets
- `operational_hub_analytics_snapshots`: Snapshots de analytics

### Service Layer

- `fast-mode-service.ts`: Gestão Fast Mode
- `stock-service.ts`: Gestão de estoque
- `time-tracking-service.ts`: Fichaje
- `delivery-integration-service.ts`: Integração delivery
- `ticket-customization-service.ts`: Personalização de tickets
- `analytics-service.ts`: Analytics avançados

### Frontend

- `/app/operational-hub`: Dashboard principal

---

## 🔄 Integração com Módulos Existentes

### TPV
- Fast Mode integrado ao TPV
- Stock deduzido automaticamente
- Tickets personalizados

### AppStaff
- Alertas de estoque baixo geram tarefas
- Turnos aparecem no AppStaff

### Reservas
- Delivery pode criar reservas
- Analytics inclui reservas

---

## 📊 Funcionalidades Detalhadas

### 1. Fast Mode

- Interface simplificada
- Top 20 produtos mais vendidos
- Checkout em 1-2 toques
- Pagamento padrão configurável

### 2. Stock Management

- Controle por produto
- Alertas automáticos
- Dedução ao vender
- Histórico de movimentações

### 3. Time Tracking

- Clock in/out
- Pausas (break)
- Cálculo automático de horas
- Aprovação de turnos

### 4. Delivery Integration

- Múltiplos canais
- Webhooks
- Auto-aceitação
- Sincronização

### 5. Ticket Customization

- Templates HTML
- Logo e branding
- QR codes
- Campos customizados

### 6. Advanced Analytics

- Snapshots diários
- Top produtos
- Horários de pico
- Métodos de pagamento
- Tendências

---

## 🚀 API Endpoints

### GET /api/operational-hub/fast-mode
Retorna configuração Fast Mode.

### GET /api/operational-hub/stock/low
Lista itens com estoque baixo.

### GET /api/operational-hub/time-tracking/active
Lista turnos ativos.

### GET /api/operational-hub/delivery/channels
Lista canais de delivery configurados.

### GET /api/operational-hub/analytics
Gera snapshot de analytics para uma data.

---

## 💡 Diferenciais vs Last.app

- **Integração Total**: OperationalHub + TPV + AppStaff + Reservas + ReputationHub
- **Sistema Nervoso**: AppStaff reage automaticamente
- **Sem Comissões**: Canais próprios
- **Inteligência**: GovernManage + ReputationHub + Analytics

---

## 🎯 Próximos Passos

1. ✅ Schema SQL criado
2. ✅ Service layer básico
3. ✅ UI Dashboard
4. ⏳ Integração Fast Mode no TPV
5. ⏳ Integração real com delivery platforms
6. ⏳ Geração de tickets personalizados
7. ⏳ Dashboard de analytics com gráficos

---

**Mensagem**: "Operações sob controle. Fast Mode. Stock inteligente. Fichaje automático. Delivery centralizado."

