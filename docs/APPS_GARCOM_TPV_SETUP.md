# 📱 Apps Garçom e TPV — Configuração

**Data:** 2026-01-25  
**Status:** ✅ Rotas Configuradas

---

## ✅ Apps Configurados

### 1. App de Testes/Gerenciamento do TPV
- **Rota:** `/tpv-test`
- **Componente:** `DebugTPV.tsx`
- **URL:** `http://localhost:5175/tpv-test`
- **Funcionalidades:**
  - Seed de produtos para testes
  - Simulação de offline/online
  - Diagnósticos de voz
  - Preview de componentes do TPV

### 2. App do Garçom (Pedidos)
- **Rota:** `/garcom`
- **Componente:** `AppStaff.tsx`
- **URL:** `http://localhost:5175/garcom`
- **Funcionalidades:**
  - MiniPOS para garçons
  - Gerenciamento de tarefas
  - Visualização de pedidos
  - Mapa de mesas

### 3. Painel de Mesa do Garçom
- **Rota:** `/garcom/mesa/:tableId`
- **Componente:** `TablePanel.tsx`
- **URL:** `http://localhost:5175/garcom/mesa/{tableId}`
- **Funcionalidades:**
  - Adicionar pedidos à mesa
  - Visualizar pedido ativo
  - Seleção de produtos
  - Comentários e observações

---

## 🔧 Alterações Realizadas

### 1. Rotas Adicionadas no App.tsx
```typescript
<Route path="/tpv-test" element={<DebugTPV />} />
<Route path="/garcom" element={<AppStaff />} />
<Route path="/garcom/mesa/:tableId" element={<TablePanel />} />
```

### 2. DebugTPV Atualizado para Docker Core
- **Arquivo:** `merchant-portal/src/pages/DebugTPV.tsx`
- **Mudança:** Substituído `supabase` por `dockerCoreClient`
- **Mudança:** Removida dependência de autenticação (usa restaurant ID fixo)
- **Restaurant ID:** `00000000-0000-0000-0000-000000000100` (desenvolvimento)

---

## 🧪 Como Testar

### 1. App de Testes do TPV

```bash
# Abrir no navegador
http://localhost:5175/tpv-test
```

**Funcionalidades para testar:**
1. **Seed de Produtos:**
   - Clicar em "🚀 Seed 50 Config Items"
   - Verificar que produtos foram criados no banco

2. **Simulação Offline:**
   - Clicar em "✂️ Toggle Connection (Simulate)"
   - Verificar que o status muda

3. **Diagnósticos:**
   - Verificar suporte a Speech Recognition
   - Verificar suporte a Speech Synthesis

### 2. App do Garçom

```bash
# Abrir no navegador
http://localhost:5175/garcom
```

**Funcionalidades para testar:**
1. **Visualização de Tarefas:**
   - Ver lista de tarefas do staff
   - Ver pedidos ativos

2. **MiniPOS:**
   - Selecionar mesa
   - Adicionar produtos
   - Criar pedido

3. **Painel de Mesa:**
   - Acessar `/garcom/mesa/{tableId}`
   - Ver produtos disponíveis
   - Adicionar itens ao pedido

---

## 📊 Verificações no Banco

### Ver produtos criados pelo seed
```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT name, price_cents, available FROM gm_products 
   WHERE restaurant_id = '00000000-0000-0000-0000-000000000100' 
   ORDER BY created_at DESC 
   LIMIT 10;"
```

### Ver categorias criadas
```bash
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c \
  "SELECT name, position FROM gm_menu_categories 
   WHERE restaurant_id = '00000000-0000-0000-0000-000000000100' 
   ORDER BY position;"
```

---

## ⚠️ Pontos de Atenção

### 1. AppStaff
- **Status:** Pode depender de contextos que não estão configurados
- **Impacto:** Pode não funcionar completamente sem autenticação/configuração
- **Solução:** Verificar se precisa de ajustes para usar Docker Core

### 2. TablePanel
- **Status:** Usa `useOrders` que já está configurado para Docker Core
- **Impacto:** Deve funcionar corretamente
- **Nota:** Verificar se `useTables` também usa Docker Core

### 3. Restaurant ID Hardcoded
- **Status:** DebugTPV usa restaurant ID fixo
- **Impacto:** Funciona apenas para desenvolvimento
- **Solução:** Em produção, usar seleção de restaurante ou autenticação

---

## ✅ Checklist de Validação

- [ ] `/tpv-test` abre sem erros
- [ ] Seed de produtos funciona
- [ ] `/garcom` abre sem erros
- [ ] `/garcom/mesa/:tableId` abre sem erros
- [ ] Produtos aparecem no painel de mesa
- [ ] Pedidos podem ser criados pelo garçom
- [ ] Pedidos aparecem no KDS

---

## 🔄 Próximos Passos

1. **Verificar AppStaff:**
   - Verificar se todos os contextos estão configurados
   - Ajustar para usar Docker Core se necessário

2. **Verificar TablePanel:**
   - Confirmar que `useTables` usa Docker Core
   - Testar criação de pedidos

3. **Melhorar DebugTPV:**
   - Adicionar mais funcionalidades de teste
   - Adicionar visualização de pedidos criados

---

**Última atualização:** 2026-01-25
