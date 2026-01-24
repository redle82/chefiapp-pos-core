# Comandeiro do Garçom — Roadmap de Implementação

**Status**: ✅ Fluxo "dedo único" implementado  
**Próximo**: Mini-mapa fixo + Chat interno + Alertas

---

## ✅ FASE 1: COMPLETA

### Implementado
- [x] Fluxo Mesa → Grupo → Produto → Quantidade → Comentário
- [x] Zero teclado (presets apenas)
- [x] Feedback imediato (flash + vibração)
- [x] Continuidade (mesma tela)
- [x] Componentes base:
  - [x] CategoryStrip
  - [x] ProductCard
  - [x] QuantityPicker
  - [x] CommentChips
  - [x] BottomNavBar
  - [x] FloorMap (home)
  - [x] TablePanel (comandeiro)

---

## ⏳ FASE 2: EM PROGRESSO

### Mini-Mapa Fixo
- [x] Componente MiniMap criado
- [x] Integrado no TablePanel (topo fixo)
- [ ] Testar navegação entre mesas
- [ ] Ajustar responsividade

### Próximos Componentes
- [ ] Chat interno (contextual)
- [ ] Sistema de alertas por prioridade
- [ ] Perfil mínimo
- [ ] Integração com dados reais (Supabase)

---

## 🚀 FASE 3: UPGRADES NATURAIS

### Sem Quebrar o Fluxo
1. **Favoritos do Garçom**
   - 8-12 produtos mais usados no topo
   - Persistência local/cloud

2. **Presets que Aprendem**
   - Comentários mais usados sobem
   - Analytics de uso

3. **Ações Rápidas por Swipe**
   - Swipe → repetir pedido
   - Swipe → cancelar item

4. **Modo Pico**
   - UI ainda mais agressiva (menos texto)
   - Botões maiores
   - Cores mais contrastantes

5. **Modo Iniciante**
   - Mais hints, depois desaparecem
   - Tutorial interativo

---

## 📋 CHECKLIST TÉCNICO

### Integrações Pendentes
- [ ] OrderContext (pedidos reais)
- [ ] TableContext (mesas reais)
- [ ] StaffContext (perfil do garçom)
- [ ] Supabase Realtime (alertas em tempo real)

### Testes
- [ ] E2E: Fluxo completo de pedido
- [ ] Performance: Tempo de resposta < 100ms
- [ ] Acessibilidade: Touch targets 44px+
- [ ] Mobile: Teste em dispositivos reais

### Documentação
- [x] Wireflow completo
- [x] Especificação UI "one-finger"
- [x] Camadas fixas documentadas
- [ ] Guia de uso para garçons
- [ ] Demo comercial

---

## 🎯 MÉTRICAS DE SUCESSO

### Objetivos
- ⏱️ Tempo por item: < 7 segundos
- ❌ Taxa de erro: < 2%
- 😊 Satisfação do garçom: > 8/10
- ⚡ Velocidade de pedido: 30% mais rápido que método anterior

### Monitoramento
- Tempo médio por pedido
- Itens mais adicionados
- Comentários mais usados
- Erros mais comuns

---

**ChefIApp — O dedo trabalha. A cabeça respira.**

