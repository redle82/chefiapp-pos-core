# 🎫 Issues GitHub - Sistema Nervoso Operacional

**Issues estruturadas para tracking e execução**

---

## 📋 Issues de Validação

### Issue #1: Validação Fast Pay
```markdown
## 🚀 Validação: Fast Pay (Semana 1)

### Objetivo
Validar que o pagamento funciona em 2 toques e < 5 segundos.

### Checklist
- [ ] Testar pagamento no mapa de mesas
- [ ] Testar pagamento na tela de pedidos
- [ ] Medir tempo médio (meta: < 5s)
- [ ] Validar auto-seleção de método
- [ ] Confirmar fechamento automático de mesa
- [ ] Testar validação de caixa fechado

### Critérios de Aprovação
- ✅ Tempo médio < 5s em 100% dos casos
- ✅ 2 toques funcionam corretamente
- ✅ Mesa fecha automaticamente

### Documentação
- Ver: `docs/VALIDACAO_RAPIDA.md` (Testes 1-3)
- Guia: `docs/GUIA_RAPIDO_GARCOM.md` (Seção Fast Pay)

### Labels
`validation` `week1` `fast-pay` `p0`
```

### Issue #2: Validação Mapa Vivo
```markdown
## 🗺️ Validação: Mapa Vivo (Semana 2)

### Objetivo
Validar que o mapa funciona como sensor operacional em tempo real.

### Checklist
- [ ] Timer atualiza a cada segundo
- [ ] Cores mudam corretamente (verde → amarelo → vermelho)
- [ ] Ícone "quer pagar" aparece quando pedido entregue
- [ ] Ícone "esperando bebida" aparece corretamente
- [ ] Timer baseado no último evento (não apenas criação)

### Critérios de Aprovação
- ✅ Timer atualiza em tempo real
- ✅ Cores refletem urgência corretamente
- ✅ Ícones contextuais aparecem quando necessário

### Documentação
- Ver: `docs/VALIDACAO_RAPIDA.md` (Testes 4-7)
- Guia: `docs/GUIA_RAPIDO_GARCOM.md` (Seção Mapa Vivo)

### Labels
`validation` `week2` `live-map` `p0`
```

### Issue #3: Validação KDS Inteligente
```markdown
## 🍽️ Validação: KDS Como Rei (Semana 3)

### Objetivo
Validar que a cozinha influencia o menu do TPV corretamente.

### Checklist
- [ ] Detecção de pressão funciona (low/medium/high)
- [ ] Menu esconde pratos lentos quando cozinha saturada
- [ ] Banner de pressão aparece corretamente
- [ ] Priorização de bebidas funciona durante picos
- [ ] Performance não degrada com muitos pedidos

### Critérios de Aprovação
- ✅ Pressão detectada corretamente
- ✅ Menu adapta automaticamente
- ✅ Performance mantida

### Documentação
- Ver: `docs/VALIDACAO_RAPIDA.md` (Testes 8-11)
- Guia: `docs/GUIA_RAPIDO_GARCOM.md` (Seção Menu Inteligente)

### Labels
`validation` `week3` `kds-king` `p0`
```

### Issue #4: Validação Reservas LITE
```markdown
## 📋 Validação: Reservas LITE (Semana 4)

### Objetivo
Validar que a lista de espera funciona e persiste corretamente.

### Checklist
- [ ] Adicionar entrada funciona
- [ ] Lista persiste após fechar app
- [ ] Atribuir mesa converte corretamente
- [ ] Cancelar entrada funciona
- [ ] Ordenação por hora funciona

### Critérios de Aprovação
- ✅ Lista persiste localmente
- ✅ Conversão reserva → mesa funciona
- ✅ UX fluida e intuitiva

### Documentação
- Ver: `docs/VALIDACAO_RAPIDA.md` (Testes 12-15)
- Guia: `docs/GUIA_RAPIDO_GARCOM.md` (Seção Lista de Espera)

### Labels
`validation` `week4` `reservations` `p0`
```

---

## 🐛 Issues de Melhorias

### Issue #5: Auto-detecção de Método de Pagamento
```markdown
## 💳 Melhoria: Auto-detecção de Método de Pagamento

### Problema Atual
Fast Pay usa cash como padrão fixo. Deveria aprender do histórico.

### Solução Proposta
1. Buscar histórico de pagamentos do restaurante (últimos 30 dias)
2. Calcular método mais usado
3. Usar como padrão no Fast Pay
4. Fallback para cash se não houver histórico

### Implementação
- Criar hook `usePaymentHistory`
- Buscar de `gm_payments` ou analytics
- Cachear resultado (atualizar diariamente)
- Integrar em `FastPayButton`

### Prioridade
`p1` (não bloqueia lançamento)

### Labels
`enhancement` `fast-pay` `p1`
```

### Issue #6: Persistência Waitlist em Supabase
```markdown
## 💾 Melhoria: Persistência Waitlist em Supabase

### Problema Atual
Lista de espera só persiste localmente (AsyncStorage). Não sincroniza entre dispositivos.

### Solução Proposta
1. Criar tabela `gm_waitlist` no Supabase
2. Sincronizar com realtime
3. Manter fallback local (offline-first)

### Schema Proposto
```sql
CREATE TABLE gm_waitlist (
  id UUID PRIMARY KEY,
  restaurant_id UUID,
  name TEXT,
  time TEXT, -- HH:mm
  status TEXT, -- waiting, seated, cancelled
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Prioridade
`p1` (melhora experiência multi-dispositivo)

### Labels
`enhancement` `reservations` `database` `p1`
```

### Issue #7: Otimização de Performance dos Timers
```markdown
## ⚡ Otimização: Performance dos Timers

### Problema Atual
Timers atualizam a cada segundo. Pode impactar bateria em muitos dispositivos.

### Solução Proposta
1. Usar `requestAnimationFrame` ao invés de `setInterval`
2. Pausar timers quando tela não está visível
3. Agrupar atualizações (atualizar todos os timers juntos)
4. Usar `useMemo` para cálculos pesados

### Prioridade
`p2` (otimização, não crítico)

### Labels
`optimization` `performance` `p2`
```

---

## 📊 Issues de Métricas

### Issue #8: Dashboard de Métricas Operacionais
```markdown
## 📊 Feature: Dashboard de Métricas Operacionais

### Objetivo
Criar dashboard para donos verem métricas em tempo real.

### Métricas a Mostrar
- Tempo médio de pagamento (últimas 24h)
- Mesas por estado (verde/amarelo/vermelho)
- Pressão da cozinha (gráfico ao longo do dia)
- Conversão de reservas (reserva → mesa)
- Vendas de bebidas vs. pratos (durante picos)

### Implementação
- Nova tela `Dashboard.tsx`
- Usar dados de `useKitchenPressure` e `useOrder`
- Gráficos simples (Chart.js ou similar)
- Atualização em tempo real

### Prioridade
`p1` (diferenciação competitiva)

### Labels
`feature` `dashboard` `analytics` `p1`
```

---

## 🚀 Issues de Lançamento

### Issue #9: Preparação para Beta Fechado
```markdown
## 🎯 Preparação: Beta Fechado

### Checklist Pré-Beta
- [ ] Todas as validações passando (Issues #1-4)
- [ ] Documentação completa
- [ ] Guias de usuário prontos
- [ ] Suporte treinado
- [ ] Monitoramento configurado
- [ ] Rollback plan definido

### Critérios de Aprovação
- ✅ 100% dos testes de validação passando
- ✅ Documentação aprovada
- ✅ Suporte pronto

### Timeline
- Semana 1: Preparação
- Semana 2: Beta Fechado (3-5 restaurantes)

### Labels
`launch` `beta` `p0`
```

### Issue #10: Coleta de Casos de Sucesso
```markdown
## 📝 Tarefa: Coleta de Casos de Sucesso

### Objetivo
Documentar casos de sucesso do beta para usar em marketing.

### O Que Coletar
- Depoimentos de garçons
- Depoimentos de donos
- Métricas antes/depois
- Screenshots/vídeos (com permissão)
- Histórias de uso

### Template
- Nome do restaurante
- Problema anterior
- Solução ChefIApp
- Resultado (métricas)
- Depoimento

### Prioridade
`p0` (crítico para marketing)

### Labels
`marketing` `case-study` `p0`
```

---

## 🔧 Issues Técnicas

### Issue #11: Testes Automatizados
```markdown
## 🧪 Tarefa: Testes Automatizados

### Objetivo
Criar testes automatizados para garantir qualidade.

### Testes a Criar
- [ ] Testes unitários: `useKitchenPressure`
- [ ] Testes unitários: `FastPayButton`
- [ ] Testes de integração: Fluxo completo
- [ ] Testes E2E: Validação rápida (cypress ou similar)

### Prioridade
`p1` (garantia de qualidade)

### Labels
`testing` `quality` `p1`
```

### Issue #12: Documentação de API
```markdown
## 📚 Tarefa: Documentação de API

### Objetivo
Documentar APIs e hooks criados.

### O Que Documentar
- `useKitchenPressure` - Hook de pressão
- `FastPayButton` - Componente de pagamento
- `WaitlistBoard` - Componente de lista
- `PersistenceService` - Serviço de persistência

### Formato
- JSDoc nos arquivos
- README.md em cada módulo
- Exemplos de uso

### Prioridade
`p2` (documentação técnica)

### Labels
`documentation` `api` `p2`
```

---

## 📋 Template de Issue

```markdown
## [Título]

### Objetivo
[O que queremos alcançar]

### Contexto
[Por que isso é importante]

### Checklist
- [ ] Item 1
- [ ] Item 2

### Critérios de Aprovação
- ✅ Critério 1
- ✅ Critério 2

### Documentação Relacionada
- Link para docs relevantes

### Labels
`[categoria]` `[prioridade]`
```

---

## 🏷️ Labels Sugeridas

### Por Prioridade
- `p0` - Crítico (bloqueia lançamento)
- `p1` - Importante (melhora experiência)
- `p2` - Nice to have (otimização)

### Por Tipo
- `validation` - Validação de funcionalidade
- `enhancement` - Melhoria
- `bug` - Correção
- `feature` - Nova funcionalidade
- `optimization` - Otimização
- `documentation` - Documentação
- `testing` - Testes

### Por Semana
- `week1` - Fast Pay
- `week2` - Mapa Vivo
- `week3` - KDS Inteligente
- `week4` - Reservas LITE

### Por Componente
- `fast-pay`
- `live-map`
- `kds-king`
- `reservations`

---

**Última atualização:** 2026-01-24  
**Status:** Pronto para criar no GitHub
