# ✅ Issue #6: Banner persistente de modo offline - COMPLETO

**Status:** ✅ Implementado  
**Data:** 2026-01-30  
**Tempo:** ~3h

---

## 🎯 O que foi implementado

### 1. Banner fixo no topo
- Banner sempre visível quando offline
- Posicionado no topo da tela (z-index: 1000)
- Não interfere com conteúdo (absolute positioning)

### 2. Estados visuais distintos
- **Offline:** Laranja (#ff9500), "Offline (X itens)"
- **Sincronizando:** Azul (#0a84ff), "Sincronizando..."
- **Online com pendências:** Amarelo (#ffd60a), "Sincronizando pendências (X itens)"

### 3. Contador de itens pendentes
- Mostra número de itens na fila
- Texto singular/plural: "1 item" vs "X itens"
- Atualiza em tempo real

### 4. Interatividade
- Toque no banner tenta sincronizar
- Dica "Toque para tentar sincronizar" quando offline

---

## 📁 Arquivos Modificados

1. `mobile-app/components/OfflineBanner.tsx` (NOVO)
   - Componente de banner persistente
   - Integração com `useOfflineSync`
   - Estados visuais distintos

2. `mobile-app/app/_layout.tsx`
   - Adicionado `<OfflineBanner />` no root layout
   - Banner aparece globalmente em todas as telas

---

## ✅ Critério de Pronto (Atendido)

- ✅ Banner fixo no topo quando offline
- ✅ Banner mostra "Sincronizando..." quando sync ativo
- ✅ Contador de itens pendentes: "X itens pendentes"
- ✅ Banner desaparece quando online e sincronizado
- ✅ Banner sempre visível quando offline

---

## 🧪 Testes Manuais

### Teste 1: Modo offline
1. Desligar WiFi
2. Criar pedido
3. **Esperado:** Banner laranja "Offline (1 item)" aparece no topo
4. Ligar WiFi
5. **Esperado:** Banner muda para azul "Sincronizando..."
6. Após sync: **Esperado:** Banner desaparece

### Teste 2: Online com pendências
1. Ter itens pendentes na fila
2. Estar online
3. **Esperado:** Banner amarelo "Sincronizando pendências (X itens)"

### Teste 3: Toque para sincronizar
1. Estar offline
2. Toque no banner
3. **Esperado:** Tenta sincronizar (chama `syncNow`)

---

## 📊 KPI Sofia (Para validar)

- **Meta:** 0 casos de perda de dados por desconhecimento de modo offline
- **Meta:** Usuários sempre sabem quando estão offline

---

## 🔄 Rollback

Se necessário reverter:
1. Remover `<OfflineBanner />` do `_layout.tsx`
2. Deletar `OfflineBanner.tsx`
3. Manter apenas `SyncStatusIndicator` (menos visível)

---

**Próxima Issue:** #7 - Mapa Visual MVP (mais complexa, ~16h)
