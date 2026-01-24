# ⏳ Issue #7: Mapa Visual MVP (ERRO-007) - EM PROGRESSO

**Status:** 🟡 Parcialmente implementado  
**Data:** 2026-01-30  
**Tempo:** ~4h (de ~16h estimadas)

---

## ✅ O que foi implementado

### 1. Hook `useTables.ts`
- Busca mesas reais do banco (`gm_tables`)
- Realtime subscription para atualizações
- Determina zona automaticamente por número (1-4: Salão 1, 5-8: Bar, 9-12: Terraço)

### 2. Refatoração parcial de `tables.tsx`
- Removido mock `TABLES`
- Integração com `useTables`
- Função `getTableUrgency()` para cores de urgência
- Estrutura de grid por zonas iniciada

---

## ⏳ Pendente

1. **Grid visual completo por zonas**
   - ScrollView com seções por zona
   - Layout responsivo
   - Indicadores visuais de urgência

2. **Cores de urgência aplicadas**
   - Normal: cinza
   - Warning (>10min): amarelo
   - Critical (>20min): vermelho

3. **Indicadores visuais**
   - Badge de urgência
   - Contador de pedidos
   - Timer visível

---

## 📁 Arquivos Modificados

1. `mobile-app/hooks/useTables.ts` (NOVO)
2. `mobile-app/app/(tabs)/tables.tsx` (parcial)

---

**Próximo passo:** Completar grid visual e aplicar cores de urgência
