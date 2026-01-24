# 🚀 BACKLOG FASE 2 - MVP Demo

**Data:** 2026-01-20  
**Decisão:** Split QR Code deixado para Fase 2  
**Foco Atual:** Validar MVP Demo atual antes de expandir

---

## 📋 DECISÃO ESTRATÉGICA

### **O Que Foi Decidido:**
- ✅ **MVP Demo atual:** Foco em validar core (mesa → pedido → split → pagamento)
- ✅ **Split QR Code:** Deixado para Fase 2 (após feedback do MVP)
- ✅ **Prioridade:** Endurecer e validar o que já existe

### **Razão:**
- MVP atual já tem split funcional via garçom
- Adicionar QR Code agora adiciona 7-9 dias ao cronograma
- Melhor validar o core antes de expandir
- QR Code pode ser diferencial forte na próxima fase

---

## 🎯 FEATURES FASE 2 (PRIORIZADAS)

### **1. Split Bill via QR Code** 🔥
**Prioridade:** ALTA  
**Esforço:** 7-9 dias  
**Impacto:** ALTO

**Descrição:**
- Cliente divide e paga conta via QR Code na mesa
- Cada pessoa paga sua parte no próprio telemóvel
- Atualização em tempo real para garçom

**Documentação:** `SPLIT_QR_CODE_MVP.md`

**Tarefas:**
- [ ] Backend: Criar rotas `/api/split/*`
- [ ] Backend: Criar tabela `gm_split_sessions`
- [ ] Frontend TPV: Criar `SplitQRCodeModal.tsx`
- [ ] Frontend TPV: Criar `SplitStatusPanel.tsx`
- [ ] Frontend Cliente: Criar página pública `/split/{splitId}`
- [ ] QR Code: Gerar e validar tokens
- [ ] Testes: Fluxo completo e segurança

---

### **2. Split por Itens** 🔥
**Prioridade:** ALTA  
**Esforço:** 3-5 dias  
**Impacto:** MÉDIO-ALTO

**Descrição:**
- Cliente escolhe quais itens vai pagar
- Sistema calcula total individual
- Útil para grupos que não querem dividir igualmente

**Tarefas:**
- [ ] UI: Checkbox para selecionar itens
- [ ] Lógica: Calcular total por pessoa
- [ ] Backend: Validar que itens não são duplicados
- [ ] Testes: Validar cálculos complexos

---

### **3. Offline Visível** 🔥
**Prioridade:** MÉDIA  
**Esforço:** 2-3 dias  
**Impacto:** MÉDIO

**Descrição:**
- Indicador visual claro quando sistema está offline
- Mostrar queue de sincronização
- Feedback visual durante sync

**Tarefas:**
- [ ] UI: Banner de status offline
- [ ] UI: Indicador de queue de sync
- [ ] UI: Progresso de sincronização
- [ ] Testes: Validar em cenários offline reais

---

### **4. Histórico Detalhado do Dia**
**Prioridade:** MÉDIA  
**Esforço:** 2-3 dias  
**Impacto:** MÉDIO

**Descrição:**
- Lista de pedidos do dia
- Filtros (por mesa, status, método de pagamento)
- Exportar relatório simples

**Tarefas:**
- [ ] UI: Lista de pedidos do dia
- [ ] UI: Filtros e busca
- [ ] Backend: Endpoint de histórico
- [ ] UI: Exportar PDF simples

---

### **5. Gorjeta Individual**
**Prioridade:** BAIXA  
**Esforço:** 1-2 dias  
**Impacto:** BAIXO

**Descrição:**
- Opção de adicionar gorjeta no split
- Cada pessoa pode escolher sua gorjeta
- Calculado separadamente do total da conta

**Tarefas:**
- [ ] UI: Campo de gorjeta no split
- [ ] Lógica: Calcular gorjeta individual
- [ ] Backend: Armazenar gorjeta separadamente

---

## 📊 MATRIZ DE PRIORIZAÇÃO

| Feature | Prioridade | Esforço | Impacto | ROI |
|---------|-----------|---------|---------|-----|
| Split QR Code | ALTA | 7-9d | ALTO | ⭐⭐⭐⭐⭐ |
| Split por Itens | ALTA | 3-5d | MÉDIO-ALTO | ⭐⭐⭐⭐ |
| Offline Visível | MÉDIA | 2-3d | MÉDIO | ⭐⭐⭐ |
| Histórico Detalhado | MÉDIA | 2-3d | MÉDIO | ⭐⭐⭐ |
| Gorjeta Individual | BAIXA | 1-2d | BAIXO | ⭐⭐ |

---

## 🎯 CRITÉRIOS PARA INICIAR FASE 2

### **MVP Demo Deve Estar:**
- ✅ Testado e validado (3 ciclos completos)
- ✅ Sem bugs críticos
- ✅ Feedback de 1-2 usuários reais coletado
- ✅ Documentação completa
- ✅ Pitch de 60 segundos praticado

### **Decisão de Produto:**
- ✅ MVP Demo validado como útil
- ✅ Diferenciação clara identificada
- ✅ Próximo passo estratégico definido

---

## 📅 ESTIMATIVA FASE 2

### **Cenário Conservador:**
- Split QR Code: 9 dias
- Split por Itens: 5 dias
- Offline Visível: 3 dias
- **Total:** ~17 dias (3-4 semanas)

### **Cenário Otimista:**
- Split QR Code: 7 dias
- Split por Itens: 3 dias
- Offline Visível: 2 dias
- **Total:** ~12 dias (2-3 semanas)

### **Recomendação:**
Focar em **Split QR Code** primeiro (maior impacto), depois decidir se continua com outras features baseado em feedback.

---

## 🔄 PROCESSO DE DECISÃO

### **Quando Revisar Backlog:**
1. Após testes de balcão completos
2. Após feedback de 1-2 usuários reais
3. Após validar MVP Demo em uso real

### **Como Priorizar:**
1. **Impacto no usuário:** Resolve problema real?
2. **Diferenciação:** Diferencia do last.app?
3. **Esforço:** Vale o tempo investido?
4. **Feedback:** Usuários pediram isso?

---

## 📝 NOTAS

### **O Que Aprendemos:**
- MVP atual já tem split funcional (via garçom)
- QR Code é diferencial forte, mas não crítico agora
- Melhor validar core antes de expandir

### **Riscos Identificados:**
- Split QR Code pode ser complexo (segurança, UX)
- Precisa validação com usuários reais
- Pode adicionar complexidade desnecessária se mal feito

### **Oportunidades:**
- QR Code pode ser diferencial competitivo forte
- Split por itens resolve caso de uso real
- Offline visível aumenta confiança no produto

---

## 🎯 PRÓXIMOS PASSOS

### **Agora (MVP Demo):**
1. Aplicar migration SQL
2. Executar testes de balcão
3. Corrigir bugs críticos
4. Validar com usuários reais

### **Depois (Fase 2):**
1. Revisar backlog baseado em feedback
2. Priorizar features de maior impacto
3. Decidir se inicia Split QR Code
4. Planejar sprint de Fase 2

---

**Status:** 📋 Backlog Criado  
**Decisão:** Split QR Code para Fase 2  
**Foco Atual:** Validar MVP Demo  
**Última atualização:** 2026-01-20
