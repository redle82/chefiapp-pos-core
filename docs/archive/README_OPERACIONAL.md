# 📘 README OPERACIONAL — CHEFIAPP POS CORE
**Versão:** 1.0.0  
**Data:** 2026-01-17  
**Status:** ✅ Production-Ready

---

## 🚀 INÍCIO RÁPIDO

### Pré-requisitos
- Node.js 18+
- PostgreSQL (via Supabase)
- Conta Supabase configurada

### Instalação
```bash
npm install
npm run dev
```

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE=http://localhost:4320
```

---

## 📋 ESTRUTURA DO PROJETO

### Core Modules
- `merchant-portal/src/core/tpv/` - TPV Engine (pedidos, pagamentos)
- `merchant-portal/src/core/fiscal/` - Impressão Fiscal
- `merchant-portal/src/core/flow/` - Navegação Soberana
- `merchant-portal/src/core/tenant/` - Multi-tenant Isolation
- `merchant-portal/src/core/storage/` - Tab-Isolated Storage

### Pages
- `merchant-portal/src/pages/TPV/` - Terminal Ponto de Venda
- `merchant-portal/src/pages/TPV/KDS/` - Kitchen Display System
- `merchant-portal/src/pages/Onboarding/` - Fluxo de Onboarding

### Tests
- `tests/unit/` - Testes unitários
- `tests/integration/` - Testes de integração
- `tests/e2e/` - Testes end-to-end

---

## 🔧 COMANDOS PRINCIPAIS

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
```

### Testes
```bash
npm test             # Executa todos os testes
npm test -- --watch  # Modo watch
npm test -- --coverage # Com coverage
```

### Database
```bash
supabase db push     # Aplica migrations
supabase db reset    # Reset do banco (cuidado!)
```

---

## 🏗️ ARQUITETURA

### Princípios
1. **Sovereign Navigation** - FlowGate é a única autoridade de navegação
2. **Multi-Tenant Isolation** - RLS em todas as tabelas críticas
3. **Tab Isolation** - sessionStorage para dados críticos
4. **Fiscal Observer** - Impressão fiscal não bloqueia Core

### Fluxo de Dados
```
User Action → OrderEngine → Supabase RPC → Database
                ↓
         PaymentEngine → FiscalService (async)
                ↓
         Audit Logs
```

---

## 🔒 SEGURANÇA

### Row Level Security (RLS)
- ✅ `gm_orders` - Isolamento por restaurante
- ✅ `gm_order_items` - Isolamento por pedido
- ✅ `gm_payments` - Isolamento por pedido
- ✅ `gm_tables` - Isolamento por restaurante
- ✅ `gm_cash_registers` - Isolamento por restaurante

### Tab Isolation
- Dados críticos em `sessionStorage` (isolado por tab)
- Migração automática de `localStorage` → `sessionStorage`

---

## 📊 MONITORAMENTO

### Health Check
- Endpoint: `/health` ou `/api/health`
- Verifica: Database, Supabase, Storage

### Audit Logs
- Tabela: `gm_audit_logs`
- Ações logadas: orders, payments, cash registers

### Logs Estruturados
- Frontend: `app_logs` (Supabase)
- Backend: Console + Audit Logs

---

## 🐛 TROUBLESHOOTING

### Problema: Pedido não aparece no KDS
**Solução:**
1. Verificar conexão Realtime (ConnectionStatusIndicator)
2. Verificar RLS policies
3. Verificar `restaurant_id` no pedido

### Problema: Pagamento falha
**Solução:**
1. Verificar caixa aberto (`gm_cash_registers`)
2. Verificar RLS policies
3. Verificar logs de auditoria

### Problema: Offline mode não funciona
**Solução:**
1. Verificar IndexedDB (DevTools → Application)
2. Verificar `OfflineDB` wrapper
3. Verificar sincronização automática

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `ARCHITECTURE_FLOW_LOCKED.md` - Navegação Soberana
- `CORE_ARCHITECTURE.md` - Arquitetura do Core
- `SPRINT1_PROGRESSO_CONSOLIDADO.md` - Progresso Sprint 1
- `AUDITORIA_3_2026_01_17.md` - Última Auditoria

---

## 🆘 SUPORTE

Para problemas ou dúvidas:
1. Verificar logs (`app_logs` ou console)
2. Verificar `gm_audit_logs` para ações críticas
3. Verificar health check (`/health`)

---

**Construído com 💛 pelo Goldmonkey Empire**
