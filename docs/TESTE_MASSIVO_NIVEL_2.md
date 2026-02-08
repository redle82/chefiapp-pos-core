# 📊 Relatório Final - Teste Massivo Nível 2

**Data:** 2026-01-26 14:07:56  
**Ambiente:** Docker Core  
**Log:** `/Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/test-results/teste-massivo-nivel2-20260126_140725.log`

---

## 📈 Estatísticas

- **Restaurantes Criados:** 3
- **Mesas Criadas:** 15
- **Pedidos Criados:** 27
- **Testes Passados:** 5
- **Testes Falhados:** 1

---

## ✅ Validações Realizadas

### 1. Isolamento entre Restaurantes
- Status: ✅ PASSOU
- Detalhes: Nenhum vazamento de dados entre restaurantes

### 2. Constraint (1 pedido por mesa)
- Status: ✅ PASSOU
- Detalhes: Constraint respeitada em todos os restaurantes

### 3. Autoria nos Itens
- Status: ✅ PASSOU
- Detalhes: 78 de 78 itens têm autoria

### 4. Divisão de Conta
- Status: ✅ PASSOU
- Detalhes: 6 pedidos com múltiplos autores

---

## 🔍 Comandos Úteis

```bash
# Ver pedidos por restaurante
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    r.name as restaurante,
    COUNT(DISTINCT o.id) as pedidos,
    COUNT(oi.id) as itens
FROM gm_orders o
JOIN gm_restaurants r ON o.restaurant_id = r.id
LEFT JOIN gm_order_items oi ON oi.order_id = o.id
WHERE o.sync_metadata->>'test' = 'nivel2'
GROUP BY r.name
ORDER BY r.name;
"

# Ver divisão de conta por pedido
docker exec chefiapp-core-postgres psql -U postgres -d chefiapp_core -c "
SELECT 
    o.id as pedido_id,
    r.name as restaurante,
    oi.created_by_role,
    COUNT(*) as itens,
    SUM(oi.subtotal_cents) / 100.0 as total_reais
FROM gm_order_items oi
JOIN gm_orders o ON oi.order_id = o.id
JOIN gm_restaurants r ON o.restaurant_id = r.id
WHERE o.sync_metadata->>'test' = 'nivel2'
  AND oi.created_by_role IS NOT NULL
GROUP BY o.id, r.name, oi.created_by_role
ORDER BY o.id, oi.created_by_role;
"
```

---

## 🎯 Critérios de Aprovação

- [ ] Nenhum pedido aparece em restaurante errado
- [ ] Nenhuma mesa tem mais de 1 pedido aberto
- [ ] Autoria correta em todos os itens testados
- [ ] Divisão de conta correta em todos os pedidos multi-autor
- [ ] Sistema permanece estável ao longo do tempo

---

**Status Final:** ⬜ APROVADO / ⬜ APROVADO COM LIMITAÇÕES / ⬜ REPROVADO

