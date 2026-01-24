# 👨‍💻 DEVELOPER ONBOARDING — CHEFIAPP POS CORE
**Versão:** 1.0.0  
**Data:** 2026-01-17  
**Status:** ✅ Production-Ready

---

## 🚀 INÍCIO RÁPIDO

### Pré-requisitos
- Node.js 18+
- PostgreSQL (via Supabase)
- Git
- Conta Supabase configurada

### Setup Inicial
```bash
# 1. Clone o repositório
git clone <repo-url>
cd chefiapp-pos-core

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 4. Execute migrations
supabase db push

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

---

## 📁 ESTRUTURA DO PROJETO

### Core Modules
```
merchant-portal/src/core/
├── tpv/              # Terminal Ponto de Venda
│   ├── OrderEngine.ts
│   ├── PaymentEngine.ts
│   └── CashRegister.ts
├── fiscal/           # Impressão Fiscal
│   ├── FiscalService.ts
│   └── FiscalPrinter.ts
├── flow/             # Navegação Soberana
│   └── FlowGate.tsx
├── tenant/           # Multi-tenant Isolation
│   └── TenantContext.tsx
└── storage/          # Tab-Isolated Storage
    └── TabIsolatedStorage.ts
```

### Pages
```
merchant-portal/src/pages/
├── TPV/              # Terminal Ponto de Venda
│   ├── TPV.tsx
│   └── KDS/          # Kitchen Display System
├── Onboarding/       # Fluxo de Onboarding
└── Dashboard/        # Dashboard Principal
```

### Tests
```
tests/
├── unit/             # Testes unitários
├── integration/      # Testes de integração
└── e2e/              # Testes end-to-end
```

---

## 🏗️ ARQUITETURA

### Princípios Fundamentais

1. **Sovereign Navigation**
   - `FlowGate` é a única autoridade de navegação
   - Todas as rotas passam por `FlowGate`
   - Não há acesso direto a rotas internas

2. **Multi-Tenant Isolation**
   - RLS (Row Level Security) em todas as tabelas críticas
   - `TenantContext` gerencia o tenant ativo
   - Isolamento garantido por `restaurant_id`

3. **Tab Isolation**
   - Dados críticos em `sessionStorage` (isolado por tab)
   - Migração automática de `localStorage` → `sessionStorage`
   - Previne conflitos entre abas

4. **Fiscal Observer Pattern**
   - Impressão fiscal não bloqueia Core
   - `FiscalService` observa eventos de pagamento
   - Falhas fiscais não afetam operações

### Fluxo de Dados

```
User Action
    ↓
OrderEngine / PaymentEngine
    ↓
Supabase RPC (Atomic Operations)
    ↓
Database (RLS Protected)
    ↓
Realtime Subscription
    ↓
UI Update
```

---

## 🔒 SEGURANÇA

### Row Level Security (RLS)

Todas as tabelas críticas têm RLS habilitado:

- `gm_orders` - Isolamento por `restaurant_id`
- `gm_order_items` - Isolamento por pedido
- `gm_payments` - Isolamento por pedido
- `gm_tables` - Isolamento por restaurante
- `gm_cash_registers` - Isolamento por restaurante

### Tab Isolation

**NUNCA use `localStorage` diretamente para dados críticos!**

```typescript
// ❌ ERRADO
localStorage.setItem('chefiapp_restaurant_id', id);

// ✅ CORRETO
import { setTabIsolated } from '../core/storage/TabIsolatedStorage';
setTabIsolated('chefiapp_restaurant_id', id);
```

---

## 🧪 TESTES

### Executar Testes
```bash
# Todos os testes
npm test

# Modo watch
npm test -- --watch

# Com coverage
npm test -- --coverage

# Apenas E2E
npm test -- tests/e2e
```

### Estrutura de Testes

- **Unit Tests**: Testam funções isoladas
- **Integration Tests**: Testam integração entre módulos
- **E2E Tests**: Testam fluxos completos do usuário

### Criar Novo Teste

```typescript
// tests/unit/MyComponent.test.ts
import { describe, it, expect } from '@jest/globals';
import { MyComponent } from '../../merchant-portal/src/...';

describe('MyComponent', () => {
    it('deve fazer algo', () => {
        expect(true).toBe(true);
    });
});
```

---

## 📝 CONVENÇÕES DE CÓDIGO

### Nomenclatura

- **Componentes**: PascalCase (`OrderEngine`, `PaymentModal`)
- **Funções**: camelCase (`createOrder`, `processPayment`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`, `BASE_DELAY_MS`)
- **Tipos/Interfaces**: PascalCase (`OrderInput`, `PaymentStatus`)

### Error Handling

**SEMPRE use `OrderEngineError` ou classes específicas:**

```typescript
// ❌ ERRADO
throw new Error('Failed to create order');

// ✅ CORRETO
throw new OrderEngineError(
    'Mesa já possui pedido ativo. Use o pedido existente.',
    'TABLE_HAS_ACTIVE_ORDER'
);
```

### Logging

**Use `Logger` para logs estruturados:**

```typescript
import { Logger } from '../core/logger/Logger';

Logger.info('ORDER_CREATED', { orderId, restaurantId });
Logger.error('ORDER_CREATION_FAILED', error, { input });
```

---

## 🔧 COMANDOS ÚTEIS

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run type-check   # Verifica tipos TypeScript
npm run lint         # Executa linter
```

### Database
```bash
supabase db push     # Aplica migrations
supabase db reset    # Reset do banco (CUIDADO!)
supabase db diff     # Gera diff de migrations
```

### Testes
```bash
npm test             # Executa todos os testes
npm test -- --watch  # Modo watch
npm test -- --coverage # Com coverage
```

---

## 🐛 TROUBLESHOOTING

### Problema: Pedido não aparece no KDS
**Solução:**
1. Verificar conexão Realtime (`ConnectionStatusIndicator`)
2. Verificar RLS policies
3. Verificar `restaurant_id` no pedido
4. Verificar logs (`app_logs`)

### Problema: Pagamento falha
**Solução:**
1. Verificar caixa aberto (`gm_cash_registers`)
2. Verificar RLS policies
3. Verificar logs de auditoria (`gm_audit_logs`)
4. Verificar gateway configurado

### Problema: Offline mode não funciona
**Solução:**
1. Verificar IndexedDB (DevTools → Application)
2. Verificar `OfflineDB` wrapper
3. Verificar sincronização automática
4. Verificar `navigator.onLine`

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `README_OPERACIONAL.md` - Guia operacional
- `ARCHITECTURE_FLOW_LOCKED.md` - Navegação Soberana
- `CORE_ARCHITECTURE.md` - Arquitetura do Core
- `SPRINT1_PROGRESSO_CONSOLIDADO.md` - Progresso Sprint 1

---

## 🆘 SUPORTE

Para problemas ou dúvidas:
1. Verificar logs (`app_logs` ou console)
2. Verificar `gm_audit_logs` para ações críticas
3. Verificar health check (`/health`)
4. Consultar documentação adicional

---

## ✅ CHECKLIST DE ONBOARDING

- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas
- [ ] Migrations aplicadas (`supabase db push`)
- [ ] Servidor de desenvolvimento rodando (`npm run dev`)
- [ ] Testes passando (`npm test`)
- [ ] Documentação lida
- [ ] Primeira feature implementada

---

**Construído com 💛 pelo Goldmonkey Empire**

> "Código limpo é código que funciona e que outros podem entender."
