# Escopo do Produto Vendável — ChefIApp POS Core

**Data:** 2026-01-26  
**Status:** 🎯 DEFININDO  
**Prazo:** Produto pronto até 20 de março (Sofia Gastrobar)

---

## 🎯 Princípio-Base

> **"Produto vendável = alguém pode pagar, usar, confiar."**

Não é MVP (fraco demais). É **PMV** (Produto Mínimo Vendável).

---

## ✅ O QUE ENTRA (Core Vendável)

### 1. Menu Builder
**Status:** ✅ Implementado

**O que inclui:**
- Criar/editar/deletar produtos
- Tempo de preparo obrigatório
- Estação obrigatória (KITCHEN/BAR)
- Categorias
- Preços
- Disponibilidade

**Limite:**
- Menu por restaurante (não multi-restaurante na mesma UI ainda)
- Sem importação/exportação (v1)
- Sem imagens (v1)

**Por que entra:**
- Base de tudo (contrato operacional)
- Sem menu, não há pedidos
- Validação já implementada

---

### 2. Pedidos Multi-origem
**Status:** ✅ Implementado

**Origens suportadas:**
- ✅ QR_MESA (cliente via QR code)
- ✅ WEB_PUBLIC (pedido web público)
- ✅ TPV (caixa/balcão)
- ✅ APPSTAFF (garçom via app)
- ✅ APPSTAFF_MANAGER (gerente)
- ✅ APPSTAFF_OWNER (dono)

**O que inclui:**
- Criar pedido atomicamente
- Adicionar itens com autoria
- Status transitions (OPEN → IN_PREP → READY → CLOSED)
- 1 pedido aberto por mesa (constraint)

**Limite:**
- Sem divisão de conta automática (v1)
- Sem histórico de pedidos (v1)
- Sem relatórios financeiros (v1)

**Por que entra:**
- Core do sistema
- Multi-origem é diferencial
- Autoria preservada é crítico

---

### 3. KDS (Kitchen Display System)
**Status:** ✅ Implementado

**O que inclui:**
- Visualização por estação (KITCHEN/BAR)
- Agrupamento por pedido
- Timers por item (baseado em `prep_time_seconds`)
- Alertas de atraso
- Marcar itens como READY
- Marcar pedidos como READY

**Limite:**
- Sem impressão de comanda (v1)
- Sem integração com impressoras (v1)
- Sem histórico de produção (v1)

**Por que entra:**
- Coração da produção
- Diferencial técnico
- Validação já implementada

---

### 4. Estoque + Lista de Compras
**Status:** ✅ Implementado

**O que inclui:**
- Ingredientes por restaurante
- Estoque por local (KITCHEN/BAR/STORAGE)
- Mínimos operacionais
- Consumo automático (via BOM)
- Lista de compras automática
- Priorização (CRITICAL/HIGH/MEDIUM)
- Confirmação de compra → atualiza estoque → fecha tarefas

**Limite:**
- Sem histórico de compras (v1)
- Sem fornecedores (v1)
- Sem preços de compra (v1)
- Sem integração com fornecedores (v1)

**Por que entra:**
- Loop fechado (estoque → compra → reposição)
- Diferencial técnico
- Validação já implementada

---

### 5. Task Engine
**Status:** ✅ Implementado

**O que inclui:**
- Geração automática de tarefas:
  - Item atrasado
  - Estoque crítico
  - Tarefas agendadas (rotina)
- Filtragem por estação, prioridade, status
- Fechamento automático (quando condição some)
- UI de visualização

**Limite:**
- Sem atribuição de tarefas (v1)
- Sem histórico de tarefas (v1)
- Sem métricas de produtividade (v1)

**Por que entra:**
- Sistema nervoso do restaurante
- Diferencial técnico único
- Validação já implementada

---

### 6. Multi-restaurante (Isolamento)
**Status:** ✅ Implementado

**O que inclui:**
- Isolamento total por restaurante
- Dados não cruzam entre restaurantes
- Cada restaurante tem seu menu, estoque, pedidos, tarefas

**Limite:**
- Sem dashboard multi-restaurante (v1)
- Sem relatórios consolidados (v1)
- Sem gestão centralizada (v1)

**Por que entra:**
- Arquitetura já suporta
- Permite vender para grupos
- Diferencial técnico

---

## ❌ O QUE NÃO ENTRA (v1)

### 1. Relatórios Financeiros
**Por que não:**
- Complexidade alta
- Não é core do produto
- Pode ser adicionado depois

**Alternativa:**
- Exportar dados para Excel/CSV
- Integrar com sistemas externos (futuro)

---

### 2. Integrações Externas
**Por que não:**
- Complexidade alta
- Dependências externas
- Não é core do produto

**Exemplos:**
- iFood, Uber Eats, etc.
- Sistemas de pagamento
- ERPs
- Contabilidade

**Alternativa:**
- Manual (v1)
- Integrações futuras (v2+)

---

### 3. Gestão de Funcionários
**Por que não:**
- Escopo diferente
- Complexidade alta
- Não é core do produto

**Exemplos:**
- Ponto eletrônico
- Folha de pagamento
- Controle de acesso

**Alternativa:**
- Usar sistema externo
- Integração futura (v2+)

---

### 4. Marketing / CRM
**Por que não:**
- Escopo diferente
- Não é core do produto
- Pode ser adicionado depois

**Exemplos:**
- Programa de fidelidade
- Campanhas
- Email marketing

**Alternativa:**
- Integração futura (v2+)

---

### 5. Delivery / Logística
**Por que não:**
- Escopo diferente
- Complexidade alta
- Não é core do produto

**Exemplos:**
- Rastreamento de entregas
- Otimização de rotas
- Gestão de entregadores

**Alternativa:**
- Integração com iFood/Uber Eats (futuro)
- Manual (v1)

---

## 🎯 Limites Claros (Promessas)

### O Que Prometemos (v1)
✅ Sistema operacional de produção para restaurantes  
✅ Menu como contrato operacional  
✅ Pedidos multi-origem  
✅ KDS profissional  
✅ Estoque conectado à operação  
✅ Task Engine automático  
✅ Multi-restaurante isolado

### O Que NÃO Prometemos (v1)
❌ Relatórios financeiros completos  
❌ Integrações externas  
❌ Gestão de funcionários  
❌ Marketing / CRM  
❌ Delivery / logística

---

## 📦 Pacote Vendável (v1)

### Para 1 Restaurante
- Menu Builder
- Pedidos (todas as origens)
- KDS
- Estoque + Lista de Compras
- Task Engine
- Suporte básico

### Para Grupos (2-10 restaurantes)
- Tudo acima
- Multi-restaurante isolado
- Onboarding estruturado
- Suporte dedicado

### Para Franquias (10+ restaurantes)
- Tudo acima
- Suporte prioritário
- Customizações (sob demanda)

---

## 🎯 Próximos Passos (Até 20 de Março)

### Semana 1-2 (Até 9 de fevereiro)
- [ ] Finalizar escopo (este documento)
- [ ] Validar que tudo funciona end-to-end
- [ ] Documentar limites claros

### Semana 3-4 (Até 23 de fevereiro)
- [ ] Polir UI/UX (sem adicionar features)
- [ ] Preparar onboarding
- [ ] Testar fluxo completo

### Semana 5-6 (Até 9 de março)
- [ ] Preparar narrativa de produto
- [ ] Preparar demo
- [ ] Validar com usuários beta (se possível)

### Semana 7-8 (Até 20 de março)
- [ ] Deploy para Sofia Gastrobar
- [ ] Onboarding
- [ ] Suporte inicial

---

## 🧠 Filosofia

> **"Produto vendável = claro, confiável, útil."**

Não precisa ser perfeito. Precisa ser:
- ✅ Claro (o que faz, o que não faz)
- ✅ Confiável (funciona como prometido)
- ✅ Útil (resolve problema real)

---

**Conclusão:** Este escopo define o produto vendável v1. Tudo que está aqui é implementado e validado. Tudo que não está aqui fica para v2+.
