# 📅 Sistema de Reservas — Inspirado no CoverManager

**Versão**: 1.0 MVP  
**Status**: Em Implementação

---

## 🎯 Visão Geral

Sistema completo de gestão de reservas integrado ao ChefIApp, inspirado nas funcionalidades do [CoverManager](https://www.covermanager.com/en/).

### Funcionalidades Principais

1. **Gestão de Reservas Digital**
   - Livro de reservas online
   - Gestão de mesas e disponibilidade
   - Prevenção de no-shows

2. **Fila Virtual (OnTheGo)**
   - Lista de espera para walk-ins
   - Notificações quando mesa disponível
   - Integração com mapa de mesas

3. **CRM de Clientes**
   - Base de dados unificada
   - Histórico de visitas e preferências
   - Perfis de clientes

---

## 🏗️ Arquitetura

### Database Schema

- `reservation_sources`: Fontes de reservas (online, telefone, walk-in, etc.)
- `customer_profiles`: CRM de clientes
- `reservations`: Reservas com status tracking
- `waitlist_entries`: Fila virtual (OnTheGo)
- `reservation_payments`: Pré-pagamentos
- `reservation_channels`: Integrações com canais externos

### Service Layer

- `reservation-service.ts`: Gestão de reservas
- `waitlist-service.ts`: Gestão de fila virtual
- `customer-crm.ts`: CRM de clientes

### Frontend

- `/app/reservations`: Dashboard principal

---

## 🔄 Integração com TPV

1. **Reserva criada** → Aparece no mapa de mesas (status: RESERVED)
2. **Cliente chega** → Garçom confirma no TPV
3. **Mesa atribuída** → Reserva vinculada à mesa
4. **Pedido criado** → Histórico salvo no perfil do cliente
5. **Pagamento** → Atualiza perfil (gastos, preferências)

---

## 📊 Status de Reservas

- `pending`: Pendente de confirmação
- `confirmed`: Confirmada
- `seated`: Cliente sentado
- `completed`: Concluída
- `cancelled`: Cancelada
- `no_show`: Cliente não compareceu

---

## 🚀 Próximos Passos

1. ✅ Schema SQL criado
2. ✅ Service layer básico
3. ✅ UI Dashboard
4. ⏳ Integração completa com TPV
5. ⏳ Prevenção de no-shows (confirmação, pré-pagamento)
6. ⏳ Notificações SMS/Email
7. ⏳ Integração com canais externos

---

## 💡 Diferenciais vs CoverManager

- **Tudo integrado**: Reservas + TPV + AppStaff + GovernManage
- **Sem comissões**: Canais próprios
- **Sistema nervoso**: AppStaff reage automaticamente
- **Inteligência**: GovernManage analisa feedback

---

**Mensagem**: "Reservas sem comissão. Fila virtual inteligente. CRM integrado. Tudo conectado ao seu TPV."

