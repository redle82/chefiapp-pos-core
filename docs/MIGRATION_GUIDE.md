# 🔄 Migration Guide - ChefIApp

**Guia de migração entre versões**

---

## 📋 Índice

1. [Migração para v1.0.0 (Sistema Nervoso Operacional)](#v100)
2. [Migração de Versões Antigas](#versões-antigas)
3. [Migração de Dados](#migração-de-dados)
4. [Rollback](#rollback)

---

## 🚀 v1.0.0 - Sistema Nervoso Operacional

### O Que Mudou

#### 1. Fast Pay
**Antes:**
- Múltiplos passos para pagamento
- Modal intermediário
- Seleção manual de método

**Depois:**
- 2 toques para pagar
- Auto-seleção de método
- Confirmação única

**Migração:**
```typescript
// ❌ Código antigo
<QuickPayModal 
  order={order}
  onPaymentMethodSelect={handleSelect}
  onConfirm={handleConfirm}
/>

// ✅ Novo código
<FastPayButton 
  orderId={order.id}
  total={order.total}
  tableId={order.tableId}
  onSuccess={handleSuccess}
/>
```

#### 2. Mapa Vivo
**Antes:**
- Mapa estático
- Sem contexto temporal
- Sem indicadores visuais

**Depois:**
- Timer por mesa
- Cores de urgência
- Ícones contextuais

**Migração:**
```typescript
// ❌ Código antigo
<TableCard table={table} />

// ✅ Novo código
<TableCard 
  table={table}
  order={order}
  // Timer e urgência automáticos
/>
```

#### 3. KDS Inteligente
**Antes:**
- Menu sempre completo
- Sem filtragem
- Sem feedback de cozinha

**Depois:**
- Menu adapta à pressão
- Filtragem automática
- Indicador de pressão

**Migração:**
```typescript
// ❌ Código antigo
const menuItems = await fetchMenu();

// ✅ Novo código
const { shouldHideSlowItems } = useKitchenPressure();
const filteredMenuItems = useMemo(() => {
  if (shouldHideSlowItems) {
    return menuItems.filter(/* ... */);
  }
  return menuItems;
}, [menuItems, shouldHideSlowItems]);
```

#### 4. Reservas LITE
**Antes:**
- Sem sistema de reservas
- Lista manual

**Depois:**
- Waitlist digital
- Persistência local
- Conversão automática

**Migração:**
```typescript
// ✅ Novo código (não havia antes)
<WaitlistBoard 
  visible={showWaitlist}
  onClose={() => setShowWaitlist(false)}
  onAssignTable={handleAssignTable}
/>
```

---

## 📦 Migração de Versões Antigas

### Checklist de Migração

#### 1. Backup
```bash
# Backup do banco de dados
pg_dump -h localhost -U postgres chefiapp > backup_$(date +%Y%m%d).sql

# Backup do código
git tag backup-pre-v1.0.0
git push origin backup-pre-v1.0.0
```

#### 2. Dependências
```bash
# Atualizar dependências
npm install

# Verificar vulnerabilidades
npm audit
npm audit fix
```

#### 3. Schema do Banco
```sql
-- Executar migrations
\i migration_phase35.sql

-- Verificar
SELECT * FROM schema_migrations;
```

#### 4. Variáveis de Ambiente
```bash
# Verificar .env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

#### 5. Testes
```bash
# Executar testes
npm test

# Validar sistema
./scripts/validate-system.sh
```

---

## 💾 Migração de Dados

### Waitlist
```typescript
// Se houver dados antigos de waitlist
const migrateWaitlist = async () => {
  const oldWaitlist = await AsyncStorage.getItem('old_waitlist');
  if (oldWaitlist) {
    const entries = JSON.parse(oldWaitlist);
    // Converter formato antigo para novo
    const newEntries = entries.map(entry => ({
      id: entry.id || Date.now().toString(),
      name: entry.name,
      time: entry.time || new Date().toISOString(),
      status: 'waiting'
    }));
    await PersistenceService.saveWaitlist(newEntries);
    await AsyncStorage.removeItem('old_waitlist');
  }
};
```

### Configurações
```typescript
// Migrar configurações antigas
const migrateConfig = async () => {
  const oldConfig = await AsyncStorage.getItem('app_config');
  if (oldConfig) {
    const config = JSON.parse(oldConfig);
    // Converter para novo formato
    const newConfig = {
      ...config,
      features: {
        fastPay: true,
        mapaVivo: true,
        kds: true,
        reservations: true
      }
    };
    await PersistenceService.saveConfig(newConfig);
  }
};
```

---

## 🔙 Rollback

### Em Caso de Problemas

#### 1. Rollback de Código
```bash
# Voltar para versão anterior
git checkout backup-pre-v1.0.0

# Ou tag específica
git checkout v0.9.0
```

#### 2. Rollback de Banco
```bash
# Restaurar backup
psql -h localhost -U postgres chefiapp < backup_20260124.sql
```

#### 3. Rollback de Features
```typescript
// Desabilitar features via feature flags
const FEATURES = {
  FAST_PAY: { enabled: false },
  MAPA_VIVO: { enabled: false },
  KDS_INTELIGENTE: { enabled: false },
  RESERVAS_LITE: { enabled: false }
};
```

---

## 🔍 Verificação Pós-Migração

### Checklist
- [ ] Backup criado
- [ ] Dependências atualizadas
- [ ] Schema migrado
- [ ] Variáveis de ambiente configuradas
- [ ] Testes passando
- [ ] Fast Pay funcionando
- [ ] Mapa Vivo funcionando
- [ ] KDS funcionando
- [ ] Reservas funcionando
- [ ] Dados migrados
- [ ] Performance OK
- [ ] Sem erros no console

### Testes Manuais
1. **Fast Pay:**
   - Criar pedido
   - Clicar "Cobrar Tudo"
   - Verificar pagamento < 5s

2. **Mapa Vivo:**
   - Abrir mesas
   - Verificar timer
   - Verificar cores

3. **KDS:**
   - Criar múltiplos pedidos
   - Verificar banner de pressão
   - Verificar filtragem de menu

4. **Reservas:**
   - Adicionar entrada
   - Fechar e reabrir app
   - Verificar persistência

---

## 📚 Recursos

- **Changelog:** `CHANGELOG.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **Setup:** `docs/SETUP_DEPLOY.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
