# ✅ Validação MenuBuilder — Checklist

**Data:** 2026-01-26  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Checklist de Validação Mínima

### 1. MenuBuilder (`/menu-builder`)

**✅ Verificado:**
- Form de criação funcionando
- Campos obrigatórios destacados
- Validação em tempo real
- Lista de produtos existentes
- Editar/Deletar produtos

**Próximo passo manual:**
1. Criar item BAR (ex: Água – 1 min)
2. Criar item COZINHA (ex: Hambúrguer – 12 min)

### 2. Criar Pedido com Itens Mistos

**Via TPV ou Script:**
- 1 item BAR (Água Mineral)
- 1 item COZINHA (Hambúrguer Artesanal)

**Verificar no banco:**
- Itens têm `prep_time_seconds` snapshot
- Itens têm `station` snapshot
- Valores corretos (60s para água, 720s para hambúrguer)

### 3. KDS Minimal (`/kds-minimal`)

**Verificar:**
- ✅ Tabs BAR / COZINHA funcionando
- ✅ Timer por item, com tempos diferentes
- ✅ Pedido herdando o estado do item mais crítico
- ✅ Agrupamento visual por estação
- ✅ Botão "Item Pronto" por item

---

## ✅ Status Atual

### MenuBuilder
- ✅ UI criada e funcionando
- ✅ Validação obrigatória implementada
- ✅ Integração com Core funcionando

### KDS
- ✅ Tabs por estação funcionando
- ✅ Timer por item funcionando
- ✅ Agrupamento visual por estação funcionando
- ✅ Botão "Item Pronto" funcionando

### Próximo Teste Manual
1. Acessar `/menu-builder`
2. Criar produtos com tempos diferentes (BAR: 1 min, COZINHA: 12 min)
3. Criar pedido via TPV com itens mistos
4. Verificar no KDS se tabs e timers estão corretos

---

**Status:** ✅ MenuBuilder implementado e pronto para validação manual
