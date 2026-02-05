# 🔧 Troubleshooting - Sistema Nervoso Operacional

**Guia rápido de resolução de problemas**

---

## 🚨 Problemas Comuns

### Merchant Portal — Core indisponível (500, loop login)

**Sintoma:** Banner "Core indisponível", 500 em chamadas a `/rest/v1/...`, ou loop "No session found, redirecting to login".

**Causa:** Backend configurado como Docker e o Core não está a correr.

**Solução:** Na raiz do repo: `npm run docker:core:up`. Ver [DEV_CORE_DOWN.md](./DEV_CORE_DOWN.md) para comportamento esperado e atalhos.

---

### Fast Pay

#### "Caixa Fechado" ao Pagar em Dinheiro
**Sintoma:** Alerta aparece ao tentar pagar em cash

**Causa:** Cofre (drawer) está fechado

**Solução:**
1. Abrir o cofre manualmente
2. Ou usar método diferente (cartão/PIX)
3. Verificar estado em `AppStaffContext` → `financialState`

**Prevenção:** Sistema deve alertar antes de fechar cofre se houver pedidos pendentes

---

#### Pagamento Não Processa
**Sintoma:** Botão "Cobrar Tudo" não funciona

**Causas Possíveis:**
1. Sem conexão (offline)
2. Pedido já pago
3. Erro no banco de dados

**Solução:**
1. Verificar conexão (banner offline aparece?)
2. Verificar status do pedido (já está "paid"?)
3. Ver logs do console (erro específico?)
4. Tentar novamente (idempotency key previne duplicatas)

**Debug:**
```javascript
// Verificar no console
console.log('[FastPay] Order status:', order.status);
console.log('[FastPay] Connection:', isConnected);
```

---

### Mapa Vivo

#### Timer Não Atualiza
**Sintoma:** Timer fica parado na mesa

**Causas Possíveis:**
1. Componente não está montado
2. Mesa está livre (timer não roda)
3. Erro silencioso no useEffect

**Solução:**
1. Verificar se mesa está ocupada (tem pedidos?)
2. Fechar e reabrir tela de mesas
3. Verificar console para erros

**Debug:**
```javascript
// Verificar no TableCard
console.log('[Mapa] Table orders:', tableOrders.length);
console.log('[Mapa] Current time:', currentTime);
```

---

#### Cores Não Mudam
**Sintoma:** Mesa fica verde mesmo após 30 minutos

**Causa:** Timer não está calculando corretamente

**Solução:**
1. Verificar `elapsedMinutes` no componente
2. Verificar `lastEventTime` (último evento do pedido)
3. Forçar atualização: fechar e reabrir

**Debug:**
```javascript
// Verificar cálculo
const elapsed = Math.floor((currentTime - lastEventTime) / 60000);
console.log('[Mapa] Elapsed minutes:', elapsed);
```

---

### KDS Inteligente

#### Menu Não Esconde Pratos Lentos
**Sintoma:** Todos os pratos aparecem mesmo com cozinha saturada

**Causas Possíveis:**
1. Hook `useKitchenPressure` não detecta saturação
2. Filtro não está aplicado
3. `shouldHideSlowItems` está false

**Solução:**
1. Verificar quantos pedidos estão "preparing"
2. Verificar `pressure` no hook (deve ser "high" para esconder)
3. Verificar `filteredMenuItems` no componente

**Debug:**
```javascript
// Verificar pressão
const { pressure, preparingCount, shouldHideSlowItems } = useKitchenPressure();
console.log('[KDS] Pressure:', pressure);
console.log('[KDS] Preparing:', preparingCount);
console.log('[KDS] Should hide:', shouldHideSlowItems);
```

---

#### Banner de Pressão Não Aparece
**Sintoma:** Cozinha saturada mas sem banner

**Causa:** `KitchenPressureIndicator` só aparece se `pressure !== 'low'`

**Solução:**
1. Verificar se realmente há > 5 pedidos preparando
2. Verificar se hook está funcionando
3. Verificar se componente está renderizado

**Debug:**
```javascript
// Verificar no componente
console.log('[Pressure] Current pressure:', pressure);
console.log('[Pressure] Preparing count:', preparingCount);
```

---

### Reservas LITE

#### Lista de Espera Sumiu
**Sintoma:** Entradas desaparecem após fechar app

**Causas Possíveis:**
1. Persistência não está salvando
2. AsyncStorage limpo
3. Erro ao carregar

**Solução:**
1. Verificar se `PersistenceService.saveWaitlist` está sendo chamado
2. Verificar AsyncStorage manualmente:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
const saved = await AsyncStorage.getItem('@chefiapp_waitlist_v1');
console.log('[Waitlist] Saved:', saved);
```
3. Verificar logs de erro

**Prevenção:** Adicionar validação ao carregar (se null, inicializar array vazio)

---

#### Atribuir Mesa Não Funciona
**Sintoma:** Clicar em "Atribuir" não faz nada

**Causa:** `onAssignTable` não está sendo chamado ou falha

**Solução:**
1. Verificar se callback está sendo passado
2. Verificar se mesa selecionada é válida
3. Verificar se `setActiveTable` funciona

**Debug:**
```javascript
// Verificar no WaitlistBoard
console.log('[Waitlist] Assigning table:', tableId);
console.log('[Waitlist] Entry ID:', entryId);
```

---

## 🔍 Debug Geral

### Verificar Estado da Aplicação

#### Pedidos
```javascript
const { orders } = useOrder();
console.log('[Debug] Total orders:', orders.length);
console.log('[Debug] Active orders:', orders.filter(o => o.status !== 'paid'));
```

#### Mesas
```javascript
const { orders } = useOrder();
const tables = Array.from({ length: 12 }, (_, i) => i + 1);
tables.forEach(tableNum => {
  const tableOrders = orders.filter(o => o.table === String(tableNum));
  console.log(`[Debug] Mesa ${tableNum}:`, tableOrders.length, 'pedidos');
});
```

#### Pressão da Cozinha
```javascript
const { pressure, preparingCount } = useKitchenPressure();
console.log('[Debug] Kitchen pressure:', pressure);
console.log('[Debug] Preparing:', preparingCount);
```

---

### Verificar Conexão

#### Offline
```javascript
// Verificar se está offline
import NetInfo from '@react-native-community/netinfo';
NetInfo.fetch().then(state => {
  console.log('[Debug] Connection:', state.isConnected);
});
```

#### Supabase
```javascript
// Verificar conexão Supabase
import { supabase } from '@/services/supabase';
const { data, error } = await supabase.from('gm_orders').select('count');
console.log('[Debug] Supabase:', error ? 'Error' : 'Connected');
```

---

### Limpar Cache Local

#### AsyncStorage
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Limpar tudo
await AsyncStorage.clear();

// Limpar específico
await AsyncStorage.removeItem('@chefiapp_waitlist_v1');
```

#### PersistenceService
```javascript
import { PersistenceService } from '@/services/persistence';
await PersistenceService.clearAll();
```

---

## 🐛 Erros Conhecidos

### Erro: "Cannot read property 'status' of undefined"
**Causa:** Pedido não encontrado no array

**Solução:** Adicionar validação antes de acessar propriedades:
```javascript
const order = orders.find(o => o.id === orderId);
if (!order) {
  console.error('[Error] Order not found:', orderId);
  return;
}
```

---

### Erro: "setState on unmounted component"
**Causa:** Componente desmonta antes de callback executar

**Solução:** Usar flag ou cleanup:
```javascript
useEffect(() => {
  let isMounted = true;
  
  async function fetchData() {
    const data = await fetch();
    if (isMounted) {
      setData(data);
    }
  }
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, []);
```

---

### Erro: Timer atualiza muito rápido
**Causa:** Múltiplos `setInterval` rodando

**Solução:** Garantir cleanup:
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);
  
  return () => clearInterval(interval); // IMPORTANTE
}, []);
```

---

## 📞 Escalação

### Nível 1: Auto-resolução
- Usar este guia
- Verificar logs do console
- Limpar cache local

### Nível 2: Suporte Técnico
- Coletar logs completos
- Screenshot do erro
- Passos para reproduzir

### Nível 3: Desenvolvedor
- Stack trace completo
- Estado da aplicação (dados)
- Ambiente (dispositivo, OS, versão)

---

## ✅ Checklist de Diagnóstico

Antes de reportar bug, verificar:

- [ ] App está atualizado?
- [ ] Conexão com internet OK?
- [ ] Cache limpo?
- [ ] Logs do console verificados?
- [ ] Erro é reproduzível?
- [ ] Passos para reproduzir documentados?

---

## 🔗 Links Úteis

- **Documentação Técnica:** `docs/EXECUCAO_30_DIAS.md`
- **Guia do Usuário:** `docs/GUIA_RAPIDO_GARCOM.md`
- **Validação:** `docs/VALIDACAO_RAPIDA.md`
- **Issues:** `docs/GITHUB_ISSUES.md`

---

**Última atualização:** 2026-01-24  
**Versão:** 1.0.0
